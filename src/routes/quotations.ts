import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// Get all quotations
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM quotations');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Get a single quotation by id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM quotations WHERE id = ?', [req.params.id]);
    const quotations = rows as Record<string, any>[];
    if (quotations.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(quotations[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Create a new quotation
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const qd = data.quote_data || {};
    // Map all important fields to DB columns (snake_case only)
    const dbData = {
      quote_id: data.quote_id || '',
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
      project_type: data.project_type || qd.projectType || '',
      sink_option: data.sink_option || data.sinkOption || qd.sinkOption || '',
      additional_comments: data.additional_comments || qd.additionalComments || '',
      quote_data: data.quote_data || qd || {},
      pricing_data: data.pricing_data || null,
      total_amount: data.total_amount || null,
      total_area: data.total_area || null,
      created_at: data.created_at || new Date(),
    };
    const [result] = await pool.query('INSERT INTO quotations SET ?', [dbData]);
    res.status(201).json({ id: (result as any).insertId });
  } catch (err) {
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