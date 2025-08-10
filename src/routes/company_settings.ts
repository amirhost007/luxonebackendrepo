import express, { Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Extend Express Request to include `user`
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
    [key: string]: any;
  };
}

// Middleware to verify JWT and extract user info
function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const token = auth.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'luxone_secret';
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedRequest['user'];
    req.user = decoded;
    
    console.log('Auth middleware - decoded user:', decoded);
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Interface for company settings payload
interface CompanySettingsPayload {
  company_name?: string;
  manager_name?: string;
  sales_contact_name?: string;
  mobile_number?: string;
  address?: string;
  margin_rate?: number;
  email?: string;
  website?: string;
  logo_url?: string;
}

// Get company settings for authenticated admin
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const adminUserId = req.user.userId;
    
    const [rows] = await pool.query(
      'SELECT * FROM company_settings WHERE admin_user_id = ?',
      [adminUserId]
    );
    
    if ((rows as any[]).length === 0) {
      // Return default settings if none exist
      return res.json({
        company_name: '',
        manager_name: '',
        sales_contact_name: '',
        mobile_number: '',
        address: '',
        margin_rate: 0,
        email: req.user.email,
        website: '',
        logo_url: ''
      });
    }
    
    const settings = (rows as any[])[0];
    res.json(settings);
    
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({ error: 'Failed to fetch company settings' });
  }
});

// Create new company settings for authenticated admin
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const adminUserId = req.user.userId;
    
    const {
      company_name = '',
      manager_name = '',
      sales_contact_name = '',
      mobile_number = '',
      address = '',
      margin_rate = 0,
      email = req.user.email,
      website = '',
      logo_url = ''
    } = req.body as CompanySettingsPayload;
    
    console.log('Creating company settings:', {
      adminUserId,
      company_name,
      manager_name,
      sales_contact_name,
      mobile_number,
      address,
      margin_rate,
      email,
      website,
      logo_url
    });
    
    const query = `
      INSERT INTO company_settings (
        admin_user_id, company_name, manager_name, sales_contact_name, 
        mobile_number, address, margin_rate, email, website, logo_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      adminUserId,
      company_name,
      manager_name,
      sales_contact_name,
      mobile_number,
      address,
      margin_rate,
      email,
      website,
      logo_url
    ];
    
    await pool.query(query, params);
    
    res.json({ success: true, message: 'Company settings created successfully' });
  } catch (error) {
    console.error('Error creating company settings:', error);
    res.status(500).json({ error: 'Failed to create company settings' });
  }
});

// Update company settings for authenticated admin
router.put('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const adminUserId = req.user.userId;
    
    const {
      company_name = '',
      manager_name = '',
      sales_contact_name = '',
      mobile_number = '',
      address = '',
      margin_rate = 0,
      email = req.user.email,
      website = '',
      logo_url = ''
    } = req.body as CompanySettingsPayload;
    
    console.log('Updating company settings:', {
      adminUserId,
      company_name,
      manager_name,
      sales_contact_name,
      mobile_number,
      address,
      margin_rate,
      email,
      website,
      logo_url
    });
    
    const query = `
      INSERT INTO company_settings (
        admin_user_id, company_name, manager_name, sales_contact_name, 
        mobile_number, address, margin_rate, email, website, logo_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        company_name = VALUES(company_name),
        manager_name = VALUES(manager_name),
        sales_contact_name = VALUES(sales_contact_name),
        mobile_number = VALUES(mobile_number),
        address = VALUES(address),
        margin_rate = VALUES(margin_rate),
        email = VALUES(email),
        website = VALUES(website),
        logo_url = VALUES(logo_url),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    const params = [
      adminUserId,
      company_name,
      manager_name,
      sales_contact_name,
      mobile_number,
      address,
      margin_rate,
      email,
      website,
      logo_url
    ];
    
    await pool.query(query, params);
    
    res.json({ success: true, message: 'Company settings updated successfully' });
  } catch (error) {
    console.error('Error updating company settings:', error);
    res.status(500).json({ error: 'Failed to update company settings' });
  }
});

// Get company settings for super admin (all companies)
router.get('/all', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }
    
    const [rows] = await pool.query(`
      SELECT cs.*, u.email as admin_email, u.full_name as admin_name, u.role as admin_role
      FROM company_settings cs
      JOIN users u ON cs.admin_user_id = u.id
      ORDER BY cs.updated_at DESC
    `);
    
    res.json(rows);
    
  } catch (error) {
    console.error('Error fetching all company settings:', error);
    res.status(500).json({ error: 'Failed to fetch company settings' });
  }
});

// Get specific company settings by admin ID (super admin only)
router.get('/:adminId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { adminId } = req.params;
    
    // Check if user is super admin or the admin themselves
    if (req.user.role !== 'super_admin' && req.user.userId !== parseInt(adminId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const [rows] = await pool.query(
      'SELECT * FROM company_settings WHERE admin_user_id = ?',
      [adminId]
    );
    
    if ((rows as any[]).length === 0) {
      return res.status(404).json({ error: 'Company settings not found' });
    }
    
    const settings = (rows as any[])[0];
    res.json(settings);
    
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({ error: 'Failed to fetch company settings' });
  }
});

// Update company settings for specific admin (super admin only)
router.put('/:adminId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('PUT /:adminId route hit');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { adminId } = req.params;
    
    console.log('Company settings update request:', {
      user: req.user,
      adminId,
      adminIdType: typeof adminId,
      body: req.body
    });
    
    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      console.log('Access denied - user role:', req.user.role);
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }
    
    console.log('User is super admin, processing request...');
    
    console.log('About to destructure request body...');
    
    const {
      company_name = '',
      manager_name = '',
      sales_contact_name = '',
      mobile_number = '',
      address = '',
      margin_rate = 0,
      email = '',
      website = '',
      logo_url = ''
    } = req.body as CompanySettingsPayload;
    
    console.log('Destructuring completed');
    console.log('Received data:', {
      company_name,
      manager_name,
      sales_contact_name,
      mobile_number,
      address,
      margin_rate,
      email,
      website,
      logo_url
    });
    
    console.log('Validation passed - all fields are valid');
    
    const query = `
      INSERT INTO company_settings (
        admin_user_id, company_name, manager_name, sales_contact_name, 
        mobile_number, address, margin_rate, email, website, logo_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        company_name = VALUES(company_name),
        manager_name = VALUES(manager_name),
        sales_contact_name = VALUES(sales_contact_name),
        mobile_number = VALUES(mobile_number),
        address = VALUES(address),
        margin_rate = VALUES(margin_rate),
        email = VALUES(email),
        website = VALUES(website),
        logo_url = VALUES(logo_url),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    console.log('Query defined');
    
    const params = [
      adminId,
      company_name,
      manager_name,
      sales_contact_name,
      mobile_number,
      address,
      margin_rate,
      email,
      website,
      logo_url
    ];
    
    console.log('Params defined:', params);
    
    await pool.query(query, params);
    
    console.log('Database query executed successfully');
    
    res.json({ success: true, message: 'Company settings updated successfully' });
  } catch (error) {
    console.error('Error updating company settings:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to update company settings' });
  }
});

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Company settings API is working!' });
});

// Test authentication endpoint
router.get('/auth-test', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({ 
    message: 'Authentication test successful',
    user: req.user,
    headers: req.headers
  });
});

// Test data endpoint
router.post('/test-data', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  console.log('Test data endpoint hit');
  console.log('Request body:', req.body);
  console.log('User:', req.user);
  
  res.json({ 
    message: 'Data test successful',
    receivedData: req.body,
    user: req.user
  });
});

export default router;
