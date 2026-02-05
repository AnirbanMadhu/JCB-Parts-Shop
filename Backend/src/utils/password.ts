import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // Increased from 10 for better security

export const hashPassword = async (password: string): Promise<string> => {
  // Validate password input
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  
  if (password.length > 128) {
    throw new Error('Password too long (max 128 characters)');
  }
  
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  // Validate inputs
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  
  if (!hashedPassword || typeof hashedPassword !== 'string') {
    throw new Error('Hashed password must be a non-empty string');
  }
  
  // Validate hashed password format (bcrypt hashes start with $2a$, $2b$, or $2y$)
  if (!hashedPassword.match(/^\$2[aby]\$\d{2}\$/)) {
    throw new Error('Invalid hashed password format');
  }
  
  return bcrypt.compare(password, hashedPassword);
};
