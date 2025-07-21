import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'luxone_secret';

// Register
router.post('/register', async (req, res) => {
  const { email, password, full_name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if ((existing as any[]).length > 0) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)', [email, hash, full_name || null]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = (rows as any[])[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Middleware to verify JWT
function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// List all users (admin only)
router.get('/', async (req, res) => {
  // TODO: Add admin auth check
  try {
    const [rows] = await pool.query('SELECT id, email, full_name, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Add user (admin only)
router.post('/', async (req, res) => {
  // TODO: Add admin auth check
  const { email, password, full_name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if ((existing as any[]).length > 0) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)', [email, hash, full_name || null]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// Edit user (admin only)
router.put('/:id', async (req, res) => {
  // TODO: Add admin auth check
  const { full_name, password } = req.body;
  const { id } = req.params;
  try {
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET full_name = ?, password_hash = ? WHERE id = ?', [full_name, hash, id]);
    } else {
      await pool.query('UPDATE users SET full_name = ? WHERE id = ?', [full_name, id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', async (req, res) => {
  // TODO: Add admin auth check
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user's quotations
router.get('/my-quotations', authMiddleware, async (req: any, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM quotations WHERE user_id = ? ORDER BY created_at DESC', [req.user.userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
});

// Test endpoint for health check
router.get('/test', (req, res) => {
  res.json({ message: 'User API is working!' });
});

export default router; 