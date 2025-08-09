"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = express_1.default.Router();
// Middleware to verify JWT and extract user info
function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth)
        return res.status(401).json({ error: 'No token provided' });
    try {
        const token = auth.split(' ')[1];
        const JWT_SECRET = process.env.JWT_SECRET || 'luxone_secret';
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
// Get company settings for authenticated admin
router.get('/', authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const adminUserId = req.user.userId;
        const [rows] = await db_1.pool.query('SELECT * FROM company_settings WHERE admin_user_id = ?', [adminUserId]);
        if (rows.length === 0) {
            // Return default settings if none exist
            return res.json({
                company_name: '',
                website: '',
                address: '',
                logo_url: '',
                logo_file_path: '',
                logo_file_name: '',
                whatsapp_india: '',
                whatsapp_uae: '',
                admin_email: req.user.email,
                form_fields: [],
                pdf_templates: [],
                active_pdf_template: '',
                pricing_rules: []
            });
        }
        const settings = rows[0];
        res.json(settings);
    }
    catch (error) {
        console.error('Error fetching company settings:', error);
        res.status(500).json({ error: 'Failed to fetch company settings' });
    }
});
// Update company settings for authenticated admin
router.put('/', authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const adminUserId = req.user.userId;
        const { company_name = '', website = '', address = '', logo_url = '', logo_file_path = '', logo_file_name = '', whatsapp_india = '', whatsapp_uae = '', admin_email = req.user.email, form_fields = [], pdf_templates = [], active_pdf_template = '', pricing_rules = [] } = req.body;
        // Validate JSON fields are arrays or objects as expected
        if (!Array.isArray(form_fields) || !Array.isArray(pdf_templates) || !Array.isArray(pricing_rules)) {
            return res.status(400).json({ error: 'Invalid JSON structure for form_fields/pdf_templates/pricing_rules' });
        }
        const query = `
      INSERT INTO company_settings (
        admin_user_id, company_name, website, address, logo_url, 
        logo_file_path, logo_file_name, whatsapp_india, whatsapp_uae, 
        admin_email, form_fields, pdf_templates, active_pdf_template, pricing_rules
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        company_name = VALUES(company_name),
        website = VALUES(website),
        address = VALUES(address),
        logo_url = VALUES(logo_url),
        logo_file_path = VALUES(logo_file_path),
        logo_file_name = VALUES(logo_file_name),
        whatsapp_india = VALUES(whatsapp_india),
        whatsapp_uae = VALUES(whatsapp_uae),
        admin_email = VALUES(admin_email),
        form_fields = VALUES(form_fields),
        pdf_templates = VALUES(pdf_templates),
        active_pdf_template = VALUES(active_pdf_template),
        pricing_rules = VALUES(pricing_rules),
        updated_at = CURRENT_TIMESTAMP
    `;
        const params = [
            adminUserId,
            company_name,
            website,
            address,
            logo_url,
            logo_file_path,
            logo_file_name,
            whatsapp_india,
            whatsapp_uae,
            admin_email,
            JSON.stringify(form_fields),
            JSON.stringify(pdf_templates),
            active_pdf_template,
            JSON.stringify(pricing_rules)
        ];
        await db_1.pool.query(query, params);
        res.json({ success: true, message: 'Company settings updated successfully' });
    }
    catch (error) {
        console.error('Error updating company settings:', error);
        res.status(500).json({ error: 'Failed to update company settings' });
    }
});
// Get company settings for super admin (all companies)
router.get('/all', authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        // Check if user is super admin
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Access denied. Super admin only.' });
        }
        const [rows] = await db_1.pool.query(`
      SELECT cs.*, u.email as admin_email, u.full_name as admin_name, u.role as admin_role
      FROM company_settings cs
      JOIN users u ON cs.admin_user_id = u.id
      ORDER BY cs.updated_at DESC
    `);
        res.json(rows);
    }
    catch (error) {
        console.error('Error fetching all company settings:', error);
        res.status(500).json({ error: 'Failed to fetch company settings' });
    }
});
// Get specific company settings by admin ID (super admin only)
router.get('/:adminId', authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { adminId } = req.params;
        // Check if user is super admin or the admin themselves
        if (req.user.role !== 'super_admin' && req.user.userId !== parseInt(adminId)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const [rows] = await db_1.pool.query('SELECT * FROM company_settings WHERE admin_user_id = ?', [adminId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Company settings not found' });
        }
        const settings = rows[0];
        res.json(settings);
    }
    catch (error) {
        console.error('Error fetching company settings:', error);
        res.status(500).json({ error: 'Failed to fetch company settings' });
    }
});
// Update company settings for specific admin (super admin only)
router.put('/:adminId', authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { adminId } = req.params;
        // Check if user is super admin
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Access denied. Super admin only.' });
        }
        const { company_name = '', website = '', address = '', logo_url = '', logo_file_path = '', logo_file_name = '', whatsapp_india = '', whatsapp_uae = '', admin_email = '', form_fields = [], pdf_templates = [], active_pdf_template = '', pricing_rules = [] } = req.body;
        // Validate JSON fields are arrays or objects as expected
        if (!Array.isArray(form_fields) || !Array.isArray(pdf_templates) || !Array.isArray(pricing_rules)) {
            return res.status(400).json({ error: 'Invalid JSON structure for form_fields/pdf_templates/pricing_rules' });
        }
        const query = `
      INSERT INTO company_settings (
        admin_user_id, company_name, website, address, logo_url, 
        logo_file_path, logo_file_name, whatsapp_india, whatsapp_uae, 
        admin_email, form_fields, pdf_templates, active_pdf_template, pricing_rules
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        company_name = VALUES(company_name),
        website = VALUES(website),
        address = VALUES(address),
        logo_url = VALUES(logo_url),
        logo_file_path = VALUES(logo_file_path),
        logo_file_name = VALUES(logo_file_name),
        whatsapp_india = VALUES(whatsapp_india),
        whatsapp_uae = VALUES(whatsapp_uae),
        admin_email = VALUES(admin_email),
        form_fields = VALUES(form_fields),
        pdf_templates = VALUES(pdf_templates),
        active_pdf_template = VALUES(active_pdf_template),
        pricing_rules = VALUES(pricing_rules),
        updated_at = CURRENT_TIMESTAMP
    `;
        const params = [
            adminId,
            company_name,
            website,
            address,
            logo_url,
            logo_file_path,
            logo_file_name,
            whatsapp_india,
            whatsapp_uae,
            admin_email,
            JSON.stringify(form_fields),
            JSON.stringify(pdf_templates),
            active_pdf_template,
            JSON.stringify(pricing_rules)
        ];
        await db_1.pool.query(query, params);
        res.json({ success: true, message: 'Company settings updated successfully' });
    }
    catch (error) {
        console.error('Error updating company settings:', error);
        res.status(500).json({ error: 'Failed to update company settings' });
    }
});
// Test endpoint
router.get('/test', (req, res) => {
    res.json({ message: 'Company settings API is working!' });
});
exports.default = router;
