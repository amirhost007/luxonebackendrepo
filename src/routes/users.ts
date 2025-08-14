import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'luxone_secret';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: { id: number; userId?: number; email: string; role: string };
}

// Register
router.post('/register', async (req, res) => {
  const { email, password, full_name, profit_margin } = req.body;
  try {
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const profitMarginValue = parseFloat(profit_margin) || 20.00; // default

    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, profit_margin) VALUES (?, ?, ?, ?)',
      [email, hash, full_name || null, profitMarginValue]
    );

    // Fetch the full user with profit_margin from DB
    const [newUser] = await pool.query(
      'SELECT id, email, full_name, role, is_active, created_at, last_login, permissions, profit_margin FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ message: 'User registered successfully', user: newUser[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Regular user login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Re-fetch fresh data from DB including profit_margin
    const [freshUser] = await pool.query(
      'SELECT id, email, full_name, role, is_active, created_at, last_login, permissions, profit_margin FROM users WHERE id = ?',
      [user.id]
    );

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token, user: freshUser[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
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
      id: user.id, 
      email: user.email, 
      role: user.role 
    }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        full_name: user.full_name,
        role: user.role,
        profit_margin: user.profit_margin
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
      id: user.id, 
      email: user.email, 
      role: user.role 
    }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        full_name: user.full_name,
        role: user.role,
        profit_margin: user.profit_margin
      } 
    });
  } catch (err) {
    console.error('Super admin login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Middleware to verify JWT
function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET) as { id: number; email: string; role: string };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Verify token
router.get('/verify', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(400).json({ error: 'Invalid token structure' });
    }
    
    const [rows] = await pool.query('SELECT id, email, full_name, role, permissions, profit_margin FROM users WHERE id = ?', [userId]);
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
  try {
    console.log('Fetching users from database...');
    const [rows] = await pool.query(`
      SELECT id, email, full_name, role, is_active, created_at, last_login, permissions, profit_margin 
      FROM users 
      ORDER BY created_at DESC
    `);
    console.log('Users fetched successfully:', rows);
    console.log('Profit margins in fetched users:');
    (rows as any[]).forEach((user: any) => {
      console.log(`  - ${user.email}: profit_margin = ${user.profit_margin} (type: ${typeof user.profit_margin})`);
    });
    res.json(rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users', details: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Add user (admin only)
router.post('/', async (req, res) => {
  const { email, password, full_name, role = 'user', profit_margin = 20.00 } = req.body;
  console.log('Adding user:', { email, full_name, role, profit_margin });
  
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
    
    // Ensure profit_margin is a valid number
    const profitMarginValue = parseFloat(profit_margin) || 20.00;
    console.log('About to insert user with profit_margin:', profitMarginValue, 'Type:', typeof profitMarginValue);
    
    await pool.query(
      'INSERT INTO users (email, password_hash, full_name, role, permissions, profit_margin) VALUES (?, ?, ?, ?, ?, ?)', 
      [email, hash, full_name || null, role, JSON.stringify(permissions), profitMarginValue]
    );
    console.log('User added successfully:', email);
    
    // Verify the insertion
    const [insertedUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('Inserted user data:', (insertedUser as any[])[0]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error adding user:', err);
    res.status(500).json({ error: 'Failed to add user', details: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Edit user (admin only)
router.put('/:id', async (req, res) => {
  const { full_name, password, role, profit_margin } = req.body;
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
    
    if (profit_margin !== undefined) {
      const profitMarginValue = parseFloat(profit_margin) || 20.00;
      updateQuery += ', profit_margin = ?';
      params.push(profitMarginValue);
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
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user's quotations
router.get('/my-quotations', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(400).json({ error: 'Invalid token structure' });
    }
    
    const [rows] = await pool.query('SELECT * FROM quotations WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
});

// Test endpoint for health check
router.get('/test', (req, res) => {
  res.json({ message: 'User API is working!' });
});

// Test endpoint to verify deployment
router.get('/test-profit-margin', async (req, res) => {
  try {
    console.log('Testing profit margin query...');
    
    // Test 1: Check if profit_margin column exists
    const [columns] = await pool.query('DESCRIBE users');
    const hasProfitMarginColumn = (columns as any[]).some((col: any) => col.Field === 'profit_margin');
    
    // Test 2: Query with profit_margin
    const [users] = await pool.query(`
      SELECT id, email, role, profit_margin 
      FROM users 
      LIMIT 3
    `);
    
    // Test 3: Check the actual query being used
    const testQuery = `
      SELECT id, email, full_name, role, is_active, created_at, last_login, permissions, profit_margin 
      FROM users 
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const [testResult] = await pool.query(testQuery);
    
    res.json({
      deployment_test: true,
      timestamp: new Date().toISOString(),
      has_profit_margin_column: hasProfitMarginColumn,
      sample_users: users,
      test_query_result: testResult,
      test_query_used: testQuery,
      user_fields: (testResult as any[]).length > 0 ? Object.keys((testResult as any[])[0]) : []
    });
  } catch (err) {
    console.error('Test endpoint error:', err);
    res.status(500).json({ 
      error: 'Test failed', 
      details: err instanceof Error ? err.message : 'Unknown error',
      deployment_test: false
    });
  }
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

// Simple profit margin test endpoint
router.get('/profit-margin-test', async (req, res) => {
  try {
    console.log('Testing profit margin functionality...');
    
    // Test 1: Check if profit_margin column exists
    const [columns] = await pool.query('DESCRIBE users');
    const hasProfitMarginColumn = (columns as any[]).some((col: any) => col.Field === 'profit_margin');
    
    // Test 2: Get a sample user with profit margin
    const [users] = await pool.query(`
      SELECT id, email, role, profit_margin 
      FROM users 
      WHERE role = 'admin' 
      LIMIT 3
    `);
    
    // Test 3: Check the main query
    const [mainQueryResult] = await pool.query(`
      SELECT id, email, full_name, role, is_active, created_at, last_login, permissions, profit_margin 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    res.json({
      test: 'profit_margin_test',
      timestamp: new Date().toISOString(),
      has_profit_margin_column: hasProfitMarginColumn,
      sample_users: users,
      main_query_fields: (mainQueryResult as any[]).length > 0 ? Object.keys((mainQueryResult as any[])[0]) : [],
      main_query_has_profit_margin: (mainQueryResult as any[]).length > 0 ? 'profit_margin' in (mainQueryResult as any[])[0] : false,
      main_query_sample: (mainQueryResult as any[]).length > 0 ? (mainQueryResult as any[])[0] : null
    });
  } catch (err) {
    console.error('Profit margin test error:', err);
    res.status(500).json({ 
      error: 'Test failed', 
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

// Separate Profit Margin API for testing
router.get('/profit-margin-api', async (req, res) => {
  try {
    console.log('🔍 Testing Profit Margin API...');
    
    // Test 1: Check if profit_margin column exists
    const [columns] = await pool.query('DESCRIBE users');
    const hasProfitMarginColumn = (columns as any[]).some((col: any) => col.Field === 'profit_margin');
    
    // Test 2: Get all users with profit margins
    const [allUsers] = await pool.query(`
      SELECT id, email, role, profit_margin 
      FROM users 
      ORDER BY id DESC
    `);
    
    // Test 3: Get admin users specifically
    const [adminUsers] = await pool.query(`
      SELECT id, email, role, profit_margin 
      FROM users 
      WHERE role = 'admin' 
      ORDER BY id DESC
    `);
    
    // Test 4: Test the exact query that should be used
    const [exactQueryResult] = await pool.query(`
      SELECT id, email, full_name, role, is_active, created_at, last_login, permissions, profit_margin 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    // Test 5: Check if any users have profit margins
    const usersWithProfitMargin = (allUsers as any[]).filter(user => user.profit_margin !== null);
    
    res.json({
      api_name: 'profit_margin_api',
      timestamp: new Date().toISOString(),
      database_status: {
        has_profit_margin_column: hasProfitMarginColumn,
        total_users: (allUsers as any[]).length,
        admin_users: (adminUsers as any[]).length,
        users_with_profit_margin: usersWithProfitMargin.length
      },
      sample_data: {
        all_users: allUsers,
        admin_users: adminUsers,
        exact_query_result: exactQueryResult,
        users_with_profit_margin: usersWithProfitMargin
      },
      query_analysis: {
        exact_query_fields: (exactQueryResult as any[]).length > 0 ? Object.keys((exactQueryResult as any[])[0]) : [],
        exact_query_has_profit_margin: (exactQueryResult as any[]).length > 0 ? 'profit_margin' in (exactQueryResult as any[])[0] : false,
        profit_margin_values: (allUsers as any[]).map(user => ({ id: user.id, email: user.email, profit_margin: user.profit_margin }))
      }
    });
  } catch (err) {
    console.error('Profit margin API error:', err);
    res.status(500).json({ 
      error: 'Profit margin API failed', 
      details: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 