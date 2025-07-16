import { Router } from 'express';
import { pool } from '../db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/logos');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'company-logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ===== COMPANY SETTINGS =====
// Get company settings
router.get('/company-settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM company_settings WHERE id = 1');
    const settings = rows as any[];
    res.json(settings[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Upload company logo
router.post('/company-logo', upload.single('logo') as any, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const filePath = `/uploads/logos/${file.filename}`;
    
    // Update company settings with logo file information
    const [result] = await pool.query(
      'UPDATE company_settings SET logo_file_name = ?, logo_file_path = ?, logo_file_size = ?, logo_mime_type = ? WHERE id = 1',
      [file.originalname, filePath, file.size, file.mimetype]
    );

    res.json({ 
      success: true, 
      file: {
        originalName: file.originalname,
        filename: file.filename,
        path: filePath,
        size: file.size,
        mimeType: file.mimetype
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Serve uploaded files
router.get('/uploads/logos/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../uploads/logos', filename);
  res.sendFile(filePath);
});

// Update company settings
router.put('/company-settings', async (req, res) => {
  try {
    const data = req.body;
    
    // Only save fields that exist in company_settings table
    const dbData = {
      company_name: data.companyName || data.company_name,
      website: data.website,
      address: data.address,
      whatsapp_india: data.whatsappIndia || data.whatsapp_india,
      whatsapp_uae: data.whatsappUAE || data.whatsapp_uae,
      admin_email: data.adminEmail || data.admin_email,
      price_per_sqft: data.pricePerSqft || data.price_per_sqft,
      aed_to_usd_rate: data.aedToUsdRate || data.aed_to_usd_rate,
      vat_rate: data.vatRate || data.vat_rate,
      consultant_name: data.consultantName || data.consultant_name,
      consultant_phone: data.consultantPhone || data.consultant_phone,
      consultant_email: data.consultantEmail || data.consultant_email,
      logo_url: data.logoUrl || data.logo_url,
    };
    
    const [result] = await pool.query(
      'UPDATE company_settings SET ? WHERE id = 1',
      [dbData]
    );
    res.json({ success: true, affectedRows: (result as any).affectedRows });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// ===== FORM FIELDS =====
// Get all form fields
router.get('/form-fields', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM form_fields ORDER BY step_number, display_order');
    
    // Map database fields to frontend format
    const mappedFields = (rows as any[]).map(field => ({
      id: field.field_id,
      type: field.field_type,
      label: field.label,
      placeholder: field.placeholder,
      required: field.is_required === 1,
      options: field.options ? JSON.parse(field.options) : null,
      validation: field.validation_rules ? JSON.parse(field.validation_rules) : null,
      step: field.step_number,
      category: field.category,
      order: field.display_order,
      visible: field.is_visible === 1,
      active: field.is_active === 1
    }));
    
    res.json(mappedFields);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Create form field
router.post('/form-fields', async (req, res) => {
  try {
    const data = req.body;
    
    // Map frontend fields to database columns
    const dbData = {
      field_id: data.id || data.field_id,
      field_type: data.type || data.field_type,
      label: data.label,
      placeholder: data.placeholder,
      is_required: data.required ? 1 : 0,
      options: data.options ? JSON.stringify(data.options) : null,
      validation_rules: data.validation ? JSON.stringify(data.validation) : null,
      step_number: data.step || data.step_number,
      category: data.category,
      display_order: data.order || data.display_order,
      is_visible: data.visible ? 1 : 0,
      is_active: 1
    };
    
    const [result] = await pool.query('INSERT INTO form_fields SET ?', [dbData]);
    res.status(201).json({ id: (result as any).insertId });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Update form field
router.put('/form-fields/:id', async (req, res) => {
  try {
    const data = req.body;
    
    // Map frontend fields to database columns
    const dbData = {
      field_id: data.id || data.field_id,
      field_type: data.type || data.field_type,
      label: data.label,
      placeholder: data.placeholder,
      is_required: data.required ? 1 : 0,
      options: data.options ? JSON.stringify(data.options) : null,
      validation_rules: data.validation ? JSON.stringify(data.validation) : null,
      step_number: data.step || data.step_number,
      category: data.category,
      display_order: data.order || data.display_order,
      is_visible: data.visible ? 1 : 0,
    };
    
    const [result] = await pool.query(
      'UPDATE form_fields SET ? WHERE id = ?',
      [dbData, req.params.id]
    );
    res.json({ success: true, affectedRows: (result as any).affectedRows });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Delete form field
router.delete('/form-fields/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM form_fields WHERE id = ?', [req.params.id]);
    res.json({ success: true, affectedRows: (result as any).affectedRows });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// ===== PDF TEMPLATES =====
// Get all PDF templates
router.get('/pdf-templates', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pdf_templates ORDER BY is_default DESC, name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Create PDF template
router.post('/pdf-templates', async (req, res) => {
  try {
    const data = req.body;
    const [result] = await pool.query('INSERT INTO pdf_templates SET ?', [data]);
    res.status(201).json({ id: (result as any).insertId });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Update PDF template
router.put('/pdf-templates/:id', async (req, res) => {
  try {
    const data = req.body;
    const [result] = await pool.query(
      'UPDATE pdf_templates SET ? WHERE id = ?',
      [data, req.params.id]
    );
    res.json({ success: true, affectedRows: (result as any).affectedRows });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Delete PDF template
router.delete('/pdf-templates/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM pdf_templates WHERE id = ?', [req.params.id]);
    res.json({ success: true, affectedRows: (result as any).affectedRows });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// ===== PRICING RULES =====
// Get all pricing rules
router.get('/pricing-rules', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pricing_rules ORDER BY rule_name');
    
    // Map database fields to frontend format
    const mappedRules = (rows as any[]).map(rule => ({
      id: rule.id.toString(),
      rule_id: rule.rule_name, // Use rule_name as rule_id for frontend
      label: rule.rule_name,
      value: rule.price_value,
      is_active: rule.is_active === 1,
      category: rule.category,
      type: rule.rule_type,
      description: rule.description,
      unit: rule.unit
    }));
    
    res.json(mappedRules);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Create pricing rule
router.post('/pricing-rules', async (req, res) => {
  try {
    const data = req.body;
    
    // Map frontend fields to database columns
    const dbData = {
      rule_name: data.rule_id || data.label,
      rule_type: data.type || 'addon',
      category: data.category,
      price_value: data.value || 0,
      unit: data.unit || 'AED',
      is_active: data.is_active ? 1 : 0,
      description: data.description
    };
    
    const [result] = await pool.query('INSERT INTO pricing_rules SET ?', [dbData]);
    res.status(201).json({ id: (result as any).insertId });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Update pricing rule
router.put('/pricing-rules/:id', async (req, res) => {
  try {
    const data = req.body;
    
    // Map frontend fields to database columns
    const dbData = {
      rule_name: data.rule_id || data.label,
      rule_type: data.type || 'addon',
      category: data.category,
      price_value: data.value || 0,
      unit: data.unit || 'AED',
      is_active: data.is_active ? 1 : 0,
      description: data.description
    };
    
    const [result] = await pool.query(
      'UPDATE pricing_rules SET ? WHERE id = ?',
      [dbData, req.params.id]
    );
    res.json({ success: true, affectedRows: (result as any).affectedRows });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Delete pricing rule
router.delete('/pricing-rules/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM pricing_rules WHERE id = ?', [req.params.id]);
    res.json({ success: true, affectedRows: (result as any).affectedRows });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// ===== ANALYTICS =====
// Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    const [quotationStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_quotations,
        SUM(total_amount) as total_sales,
        AVG(total_amount) as avg_quotation_value,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_quotations,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_quotations
      FROM quotations
    `);
    
    const [monthlyStats] = await pool.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as quotations,
        SUM(total_amount) as sales
      FROM quotations 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY month 
      ORDER BY month DESC
    `);
    
    res.json({
      quotationStats: (quotationStats as any[])[0],
      monthlyStats
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

export default router; 