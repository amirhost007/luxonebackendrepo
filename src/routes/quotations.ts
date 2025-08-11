import { Router } from 'express';
import { pool } from '../db';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

const router = Router();

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Function to send email notification
async function sendQuotationNotification(quotationData: Record<string, unknown>) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'amiroxfordalld@gmail.com',
      to: 'amirhost007@gmail.com',
      subject: `New Quotation Request - ${quotationData.customer_name || 'Customer'}`,
      html: `
        <h2>New Quotation Request Received</h2>
        <p><strong>Customer Name:</strong> ${quotationData.customer_name || 'N/A'}</p>
        <p><strong>Email:</strong> ${quotationData.customer_email || 'N/A'}</p>
        <p><strong>Phone:</strong> ${quotationData.customer_phone || 'N/A'}</p>
        <p><strong>Location:</strong> ${quotationData.customer_location || 'N/A'}</p>
        <p><strong>Service Level:</strong> ${quotationData.service_level || 'N/A'}</p>
        <p><strong>Material Type:</strong> ${quotationData.material_type || 'N/A'}</p>
        <p><strong>Material Color:</strong> ${quotationData.material_color || 'N/A'}</p>
        <p><strong>Project Type:</strong> ${quotationData.project_type || 'N/A'}</p>
        <p><strong>Timeline:</strong> ${quotationData.timeline || 'N/A'}</p>
        <p><strong>Additional Comments:</strong> ${quotationData.additional_comments || 'N/A'}</p>
        <p><strong>Total Amount:</strong> ${quotationData.total_amount ? `AED ${quotationData.total_amount}` : 'N/A'}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email notification sent successfully');
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

// Middleware to verify JWT and extract user info
function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const token = auth.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'luxone_secret';
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Get quotations based on user role
router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    console.log(`Fetching quotations for user: ${userId} with role: ${userRole}`);
    
    let query = '';
    let params: any[] = [];
    
    if (userRole === 'super_admin') {
      // Super admin can see all quotations
      query = `
        SELECT q.*, u.full_name as customer_name, a.full_name as admin_name
        FROM quotations q
        LEFT JOIN users u ON q.user_id = u.id
        LEFT JOIN users a ON q.admin_user_id = a.id
        ORDER BY q.created_at DESC
      `;
    } else if (userRole === 'admin') {
      // Admin can see quotations they created (where admin_user_id matches their ID)
      query = `
        SELECT q.*, u.full_name as customer_name
        FROM quotations q
        LEFT JOIN users u ON q.user_id = u.id
        WHERE q.admin_user_id = ?
        ORDER BY q.created_at DESC
      `;
      params = [userId];
    } else {
      // Regular users can only see their own quotations
      query = `
        SELECT q.*, a.full_name as admin_name
        FROM quotations q
        LEFT JOIN users a ON q.admin_user_id = a.id
        WHERE q.user_id = ?
        ORDER BY q.created_at DESC
      `;
      params = [userId];
    }
    
    const [rows] = await pool.query(query, params);
    console.log(`Found ${(rows as any[]).length} quotations`);
    
    // Parse JSON fields for each quotation
    const parsedRows = (rows as any[]).map(row => {
      try {
        // Parse quote_data if it exists
        if (row.quote_data && typeof row.quote_data === 'string') {
          row.quote_data = JSON.parse(row.quote_data);
        }
        
        // Parse pricing_data if it exists
        if (row.pricing_data && typeof row.pricing_data === 'string') {
          row.pricing_data = JSON.parse(row.pricing_data);
        }
        
        return row;
      } catch (error) {
        console.error('Error parsing JSON fields for quotation:', row.id, error);
        return row;
      }
    });
    
    res.json(parsedRows);
    
  } catch (err) {
    console.error('Error fetching quotations:', err);
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
});

// Get a single quotation by id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM quotations WHERE id = ?', [req.params.id]);
    const quotations = rows as Record<string, any>[];
    if (quotations.length === 0) return res.status(404).json({ error: 'Not found' });
    
    const quotation = quotations[0];
    
    // Parse JSON fields
    try {
      if (quotation.quote_data && typeof quotation.quote_data === 'string') {
        quotation.quote_data = JSON.parse(quotation.quote_data);
      }
      
      if (quotation.pricing_data && typeof quotation.pricing_data === 'string') {
        quotation.pricing_data = JSON.parse(quotation.pricing_data);
      }
    } catch (error) {
      console.error('Error parsing JSON fields for quotation:', quotation.id, error);
    }
    
    res.json(quotation);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Create a new quotation
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const qd = data.quote_data || {};
    
    // Get user info from token
    const auth = req.headers.authorization;
    let userId = null;
    let adminUserId = null;
    
    if (auth) {
      try {
        const token = auth.split(' ')[1];
        const JWT_SECRET = process.env.JWT_SECRET || 'luxone_secret';
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.userId;
        
        // If user is admin or super_admin, set admin_user_id to their ID
        if (decoded.role === 'admin' || decoded.role === 'super_admin') {
          adminUserId = decoded.userId;
        }
      } catch (error) {
        console.error('Token verification failed:', error);
      }
    }
    
    // Generate unique quotation number
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const quotationNumber = `Q${timestamp}${randomSuffix}`;
    
    // Map all important fields to DB columns (snake_case only)
    const dbData = {
      quote_id: data.quote_id || quotationNumber,
      quotation_number: quotationNumber,
      admin_user_id: adminUserId,
      user_id: userId,
      customer_name: data.customer_name || data.name || qd.name || '',
      customer_email: data.customer_email || data.email || qd.email || '',
      customer_phone: data.customer_phone || data.contactNumber || qd.contactNumber || '',
      customer_location: data.customer_location || data.location || qd.location || '',
      service_level: data.service_level || data.serviceLevel || qd.serviceLevel || '',
      material_source: data.material_source || data.materialSource || qd.materialSource || '',
      material_type: data.material_type || data.materialType || qd.materialType || '',
      material_color: data.material_color || data.materialColor || qd.materialColor || '',
      worktop_layout: data.worktop_layout || data.worktopLayout || qd.worktopLayout || '',
      timeline: data.timeline || qd.timeline || '',
      project_type: data.project_type || data.projectType || qd.projectType || '',
      sink_option: data.sink_option || data.sinkOption || qd.sinkOption || '',
      additional_comments: data.additional_comments || qd.additionalComments || '',
      quote_data: JSON.stringify(data.quote_data || qd || {}),
      pricing_data: data.pricing_data ? JSON.stringify(data.pricing_data) : null,
      total_amount: data.total_amount || null,
      total_area: data.total_area || null,
      created_at: data.created_at || new Date(),
    };
    
    const [result] = await pool.query('INSERT INTO quotations SET ?', [dbData]);
    const quotationId = (result as any).insertId;
    
    // Send email notification
    await sendQuotationNotification(dbData);
    
    res.status(201).json({ id: quotationId });
  } catch (err) {
    console.error('Error creating quotation:', err);
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Update a quotation
router.put('/:id', async (req, res) => {
  try {
    const data = req.body;
    const [result] = await pool.query('UPDATE quotations SET ? WHERE id = ?', [data, req.params.id]);
    res.json({ affectedRows: (result as any).affectedRows });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Delete a quotation
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM quotations WHERE id = ?', [req.params.id]);
    res.json({ affectedRows: (result as any).affectedRows });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

export default router; 