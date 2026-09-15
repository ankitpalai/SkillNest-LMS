import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT token for an authenticated user
 * @param {string} id - The MongoDB user ID
 * @param {string} role - The user's role (student, instructor, admin)
 * @returns {string} - Signed JWT
 */
export const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'dev_jwt_secret_key_12345',
    { expiresIn: '30d' }
  );
};

export default generateToken;
