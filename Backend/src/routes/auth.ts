import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail, sendPasswordChangeOTP } from '../utils/email';

const router = Router();

// Register first admin (owner)
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user - Anyone who registers through this endpoint becomes an ADMIN
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'ADMIN', // All users who register through /register become ADMIN
          isActive: true,
          mustChangePassword: false, // Self-registered users created their own password
          lastPasswordChange: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      res.status(201).json({
        message: 'Admin account created successfully',
        user,
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      const responseData = {
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          createdAt: user.createdAt,
        },
        token,
      };

      console.log(`[LOGIN] User ${user.email} logged in`);
      console.log(`[LOGIN] mustChangePassword: ${user.mustChangePassword}`);
      console.log(`[LOGIN] Response data:`, JSON.stringify(responseData.user, null, 2));

      res.json(responseData);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }
);

// Get current user info
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Check if system has been initialized (has admin)
router.get('/status', async (_req, res) => {
  try {
    const adminExists = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    res.json({
      initialized: !!adminExists,
      requiresSetup: !adminExists,
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check system status' });
  }
});

// Forgot password - request password reset
router.post(
  '/forgot-password',
  [
    body('email').isEmail().normalizeEmail(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Always return success message to prevent email enumeration
      if (!user) {
        return res.json({
          message: 'If an account exists with this email, a password reset link has been sent.',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.json({
          message: 'If an account exists with this email, a password reset link has been sent.',
        });
      }

      // Generate random token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Set expiration to 1 hour from now
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Delete any existing reset tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Create new reset token
      await prisma.passwordResetToken.create({
        data: {
          token: hashedToken,
          userId: user.id,
          expiresAt,
        },
      });

      // Send password reset email
      try {
        await sendPasswordResetEmail(user.email, resetToken, user.name);
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
        // Continue anyway - token is created
      }

      res.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  }
);

// Reset password - verify token and update password
router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, password } = req.body;

      // Hash the provided token to match against database
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find valid reset token
      const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          token: hashedToken,
          used: false,
          expiresAt: {
            gt: new Date(), // Token must not be expired
          },
        },
        include: {
          user: true,
        },
      });

      if (!resetToken) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Check if user is still active
      if (!resetToken.user.isActive) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      // Hash new password
      const hashedPassword = await hashPassword(password);

      // Update user password and mark token as used
      await prisma.$transaction([
        prisma.user.update({
          where: { id: resetToken.userId },
          data: { password: hashedPassword },
        }),
        prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { used: true },
        }),
      ]);

      res.json({
        message: 'Password has been reset successfully. You can now login with your new password.',
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);

// Change password (authenticated users - for first login and regular password changes)
router.post(
  '/change-password',
  authenticateToken,
  [
    body('currentPassword').notEmpty().optional(),
    body('newPassword').isLength({ min: 6 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // If user doesn't need to change password, verify current password
      if (!user.mustChangePassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required' });
        }

        const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password and clear mustChangePassword flag
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          mustChangePassword: false,
          lastPasswordChange: new Date(),
        },
      });

      res.json({
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

// Request OTP for password change (authenticated users)
router.post(
  '/request-password-change-otp',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Set expiration to 10 minutes from now
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Delete any existing unused OTPs for this user
      await prisma.passwordChangeOTP.deleteMany({
        where: {
          userId: user.id,
          used: false,
        },
      });

      // Create new OTP
      await prisma.passwordChangeOTP.create({
        data: {
          otp,
          userId: user.id,
          email: user.email,
          expiresAt,
        },
      });

      // Send OTP via email
      try {
        await sendPasswordChangeOTP(user.email, otp, user.name);
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        return res.status(500).json({ error: 'Failed to send OTP email' });
      }

      res.json({
        message: 'OTP has been sent to your registered email address',
        email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email
      });
    } catch (error) {
      console.error('Request OTP error:', error);
      res.status(500).json({ error: 'Failed to generate OTP' });
    }
  }
);

// Verify OTP and change password
router.post(
  '/change-password-with-otp',
  authenticateToken,
  [
    body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
    body('newPassword').isLength({ min: 6 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { otp, newPassword } = req.body;

      // Find valid OTP
      const otpRecord = await prisma.passwordChangeOTP.findFirst({
        where: {
          otp,
          userId: req.user.id,
          used: false,
          expiresAt: {
            gt: new Date(), // OTP must not be expired
          },
        },
      });

      if (!otpRecord) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password and mark OTP as used
      await prisma.$transaction([
        prisma.user.update({
          where: { id: req.user.id },
          data: {
            password: hashedPassword,
            mustChangePassword: false,
            lastPasswordChange: new Date(),
          },
        }),
        prisma.passwordChangeOTP.update({
          where: { id: otpRecord.id },
          data: { used: true },
        }),
      ]);

      res.json({
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password with OTP error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

export default router;
