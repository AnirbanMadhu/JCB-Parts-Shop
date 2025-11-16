import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../prisma';
import { hashPassword } from '../utils/password';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { sendInvitationEmail } from '../utils/email';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all users (admin only)
router.get('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        invitedBy: true,
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Invite a new user (admin only)
router.post(
  '/invite',
  requireAdmin,
  [
    body('email').isEmail().normalizeEmail(),
    body('name').trim().notEmpty(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['USER', 'ADMIN']).optional(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, name, password, role = 'USER' } = req.body;

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user with mustChangePassword flag
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
          isActive: true,
          invitedBy: req.user!.id,
          mustChangePassword: true, // Force password change on first login
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          inviter: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      // Send invitation email with credentials
      try {
        await sendInvitationEmail(
          email,
          password, // Send plain password in email (only time it's visible)
          name,
          req.user!.name
        );
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Continue anyway - user is created
      }

      res.status(201).json({
        message: 'User invited successfully. Invitation email sent with login credentials.',
        user,
      });
    } catch (error) {
      console.error('Invite user error:', error);
      res.status(500).json({ error: 'Failed to invite user' });
    }
  }
);

// Update user (admin only)
router.put(
  '/:id',
  requireAdmin,
  [
    body('name').trim().notEmpty().optional(),
    body('email').isEmail().normalizeEmail().optional(),
    body('role').isIn(['USER', 'ADMIN']).optional(),
    body('isActive').isBoolean().optional(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = parseInt(req.params.id);
      const { name, email, role, isActive } = req.body;

      // Prevent admin from deactivating themselves
      if (userId === req.user!.id && isActive === false) {
        return res.status(400).json({ 
          error: 'You cannot deactivate your own account' 
        });
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // If email is being changed, check if new email is available
      if (email && email !== existingUser.email) {
        const emailTaken = await prisma.user.findUnique({
          where: { email },
        });
        if (emailTaken) {
          return res.status(400).json({ error: 'Email already in use' });
        }
      }

      // Update user
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(role && { role }),
          ...(isActive !== undefined && { isActive }),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      res.json({
        message: 'User updated successfully',
        user,
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

// Delete user (admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Prevent admin from deleting themselves
    if (userId === req.user!.id) {
      return res.status(400).json({ 
        error: 'You cannot delete your own account' 
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Reset user password (admin only)
router.post(
  '/:id/reset-password',
  requireAdmin,
  [
    body('password').isLength({ min: 6 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = parseInt(req.params.id);
      const { password } = req.body;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Hash new password
      const hashedPassword = await hashPassword(password);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);

export default router;
