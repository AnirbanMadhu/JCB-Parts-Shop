import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    name: string;
  };
}

// Enforce JWT_SECRET is set and strong
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long');
}

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        return res.status(403).json({ error: 'Invalid token' });
      }
      
      // Validate decoded token structure
      const user = decoded as any;
      if (!user || !user.id || !user.email || !user.role) {
        return res.status(403).json({ error: 'Invalid token payload' });
      }
      
      req.user = { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        name: user.name 
      };
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

export const generateToken = (payload: { id: number; email: string; role: string; name: string }) => {
  // Validate payload
  if (!payload || !payload.id || !payload.email || !payload.role) {
    throw new Error('Invalid token payload');
  }
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '7d',
    algorithm: 'HS256'
  });
};
