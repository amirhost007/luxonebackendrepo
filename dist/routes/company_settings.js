"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const express_1 = require("express");
const db_1 = require("../db");

const router = (0, express_1.Router)();

// ✅ Define only valid DB columns for security and reliability
const allowedFields = [
  'company_name',
  'email',
  'phone',
  'address',
  'logo_url',
  'currency',
  'timezone',
  'updated_at'
  // Add more field names here if they exist in your DB
];

// ✅ GET all company settings
router.get('/', async (req, res) => {
  try {
    const result = await db_1.pool.query('SELECT * FROM company_settings');
    const rows = result[0];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// ✅ GET a single setting by ID
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

// ✅ CREATE new setting
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

// ✅ UPDATE a setting by ID
router.put('/:id', async (req, res) => {
  try {
    const data = {};
    for (const key of allowedFields) {
      if (req.body.hasOwnProperty(key)) {
        data[key] = req.body[key];
      }
    }

    const result = await db_1.pool.query(
      'UPDATE company_settings SET ? WHERE id = ?',
      [data, req.params.id]
    );

    res.json({ affectedRows: result[0].affectedRows });
  } catch (err) {
    console.error('Error on PUT /company_settings/:id', err);
    res.status(500).json({ error: 'Database error', message: err.message, stack: err.stack });
  }
});

// ✅ DELETE a setting by ID
router.delete('/:id', async (req, res) => {
  try {
    const result = await db_1.pool.query('DELETE FROM company_settings WHERE id = ?', [req.params.id]);
    res.json({ affectedRows: result[0].affectedRows });
  } catch (err) {
    res.status(500).json({ error: 'Database error', message: err.message, stack: err.stack });
  }
});

exports.default = router;
