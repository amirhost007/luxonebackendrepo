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

// Regular user login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND role = "user"', [email]);
    const user = (rows as any[])[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    
    const token = jwt.sign({ 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        full_name: user.full_name,
        role: user.role 
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin login
router.post('/admin-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND role = "admin"', [email]);
    const user = (rows as any[])[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    
    const token = jwt.sign({ 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        full_name: user.full_name,
        role: user.role 
      } 
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Super admin login
router.post('/super-admin-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND role = "super_admin"', [email]);
    const user = (rows as any[])[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    
    const token = jwt.sign({ 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        full_name: user.full_name,
        role: user.role 
      } 
    });
  } catch (err) {
    console.error('Super admin login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Middleware to verify JWT
function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Verify token
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, email, full_name, role, permissions FROM users WHERE id = ?', [(req as any).user.userId]);
    const user = (rows as any[])[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(500).json({ error: 'Token verification failed' });
  }
});

// List all users (admin only)
router.get('/', async (req, res) => {
  // TODO: Add admin auth check
  try {
    console.log('Fetching users from database...');
    const [rows] = await pool.query(`
      SELECT id, email, full_name, role, is_active, created_at, last_login, permissions 
      FROM users 
      ORDER BY created_at DESC
    `);
    console.log('Users fetched successfully:', rows);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users', details: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Add user (admin only)
router.post('/', async (req, res) => {
  // TODO: Add admin auth check
  const { email, password, full_name, role = 'user' } = req.body;
  console.log('Adding user:', { email, full_name, role });
  
  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if ((existing as any[]).length > 0) {
      console.log('Email already exists:', email);
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    const hash = await bcrypt.hash(password, 10);
    
    // Set default permissions based on role
    let permissions = {};
    if (role === 'admin') {
      permissions = {
        can_manage_users: false,
        can_manage_admins: false,
        can_view_quotes: true,
        can_edit_quotes: true,
        can_view_analytics: true,
        can_edit_company_settings: true,
        can_change_passwords: false,
        can_access_super_admin: false
      };
    } else if (role === 'super_admin') {
      permissions = {
        can_manage_users: true,
        can_manage_admins: true,
        can_view_quotes: true,
        can_edit_quotes: true,
        can_view_analytics: true,
        can_edit_company_settings: true,
        can_change_passwords: true,
        can_access_super_admin: true
      };
    } else {
      permissions = {
        can_manage_users: false,
        can_manage_admins: false,
        can_view_quotes: false,
        can_edit_quotes: false,
        can_view_analytics: false,
        can_edit_company_settings: false,
        can_change_passwords: false,
        can_access_super_admin: false
      };
    }
    
    await pool.query(
      'INSERT INTO users (email, password_hash, full_name, role, permissions) VALUES (?, ?, ?, ?, ?)', 
      [email, hash, full_name || null, role, JSON.stringify(permissions)]
    );
    console.log('User added successfully:', email);
    res.json({ success: true });
  } catch (err) {
    console.error('Error adding user:', err);
    res.status(500).json({ error: 'Failed to add user', details: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Edit user (admin only)
router.put('/:id', async (req, res) => {
  // TODO: Add admin auth check
  const { full_name, password, role } = req.body;
  const { id } = req.params;
  try {
    let updateQuery = 'UPDATE users SET full_name = ?';
    let params = [full_name];
    
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updateQuery += ', password_hash = ?';
      params.push(hash);
    }
    
    if (role) {
      updateQuery += ', role = ?';
      params.push(role);
      
      // Update permissions based on role
      let permissions = {};
      if (role === 'admin') {
        permissions = {
          can_manage_users: false,
          can_manage_admins: false,
          can_view_quotes: true,
          can_edit_quotes: true,
          can_view_analytics: true,
          can_edit_company_settings: true,
          can_change_passwords: false,
          can_access_super_admin: false
        };
      } else if (role === 'super_admin') {
        permissions = {
          can_manage_users: true,
          can_manage_admins: true,
          can_view_quotes: true,
          can_edit_quotes: true,
          can_view_analytics: true,
          can_edit_company_settings: true,
          can_change_passwords: true,
          can_access_super_admin: true
        };
      } else {
        permissions = {
          can_manage_users: false,
          can_manage_admins: false,
          can_view_quotes: false,
          can_edit_quotes: false,
          can_view_analytics: false,
          can_edit_company_settings: false,
          can_change_passwords: false,
          can_access_super_admin: false
        };
      }
      
      updateQuery += ', permissions = ?';
      params.push(JSON.stringify(permissions));
    }
    
    updateQuery += ' WHERE id = ?';
    params.push(id);
    
    await pool.query(updateQuery, params);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user', details: err instanceof Error ? err.message : 'Unknown error' });
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

// Database connection test
router.get('/db-test', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT 1 as test');
    res.json({ message: 'Database connection successful', result });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ error: 'Database connection failed', details: err instanceof Error ? err.message : 'Unknown error' });
  }
});

export default router; 