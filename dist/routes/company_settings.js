"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const express_1 = require("express");
const db_1 = require("../db");

const router = (0, express_1.Router)();

// ✅ Allowed DB fields
const allowedFields = [
  'company_name',
  'website',
  'address',
  'whatsapp_india',
  'whatsapp_uae',
  'admin_email',
  'price_per_sqft',
  'aed_to_usd_rate',
  'vat_rate',
  'consultant_name',
  'consultant_phone',
  'consultant_email',
  'logo_url',
  'logo_file_name',
  'logo_file_path',
  'logo_file_size',
  'logo_mime_type',
  'updated_at'
];

// ✅ GET all company settings
router.get('/', async (req, res) => {
  try {
    const result = await db_1.pool.query('SELECT * FROM company_settings');
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// ✅ GET by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db_1.pool.query('SELECT * FROM company_settings WHERE id = ?', [req.params.id]);
    const rows = result[0];
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// ✅ CREATE new record
router.post('/', async (req, res) => {
  try {
    const data = {};
    for (const key of allowedFields) {
      if (req.body.hasOwnProperty(key)) {
        data[key] = req.body[key];
      }
    }

    const result = await db_1.pool.query('INSERT INTO company_settings SET ?', [data]);
    res.status(201).json({ id: result[0].insertId });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// ✅ PUT without ID for singleton config
router.put('/', async (req, res) => {
    try {
      const id = 1; // or fetch dynamically if needed
      const data = {};
      for (const key of allowedFields) {
        if (req.body.hasOwnProperty(key)) {
          data[key] = req.body[key];
        }
      }
  
      const result = await db_1.pool.query(
        'UPDATE company_settings SET ? WHERE id = ?',
        [data, id]
      );
  
      res.json({ affectedRows: result[0].affectedRows });
    } catch (err) {
      console.error('Error on PUT /company_settings', err);
      res.status(500).json({ error: 'Database error', message: err.message });
    }
  });
  

// ✅ DELETE by ID
router.delete('/:id', async (req, res) => {
  try {
    const result = await db_1.pool.query('DELETE FROM company_settings WHERE id = ?', [req.params.id]);
    res.json({ affectedRows: result[0].affectedRows });
  } catch (err) {
    res.status(500).json({ error: 'Database error', message: err.message, stack: err.stack });
  }
});

exports.default = router;
