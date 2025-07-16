"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const express_1 = require("express");
const db_1 = require("../db");

const router = (0, express_1.Router)();

// ✅ Define only valid columns based on your table
const allowedFields = [
  'rule_name',
  'rule_type',
  'category',
  'condition_field',
  'condition_value',
  'price_value',
  'unit',
  'is_active',
  'description',
  'updated_at',
  'value'
];

// ✅ GET all pricing rules
router.get('/', async (req, res) => {
  try {
    const result = await db_1.pool.query('SELECT * FROM pricing_rules');
    const rows = result[0];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// ✅ GET a single pricing rule by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db_1.pool.query('SELECT * FROM pricing_rules WHERE id = ?', [req.params.id]);
    const rows = result[0];
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// ✅ CREATE a new pricing rule
router.post('/', async (req, res) => {
  try {
    const data = {};
    for (const key of allowedFields) {
      if (req.body.hasOwnProperty(key)) {
        data[key] = req.body[key];
      }
    }

    const result = await db_1.pool.query('INSERT INTO pricing_rules SET ?', [data]);
    res.status(201).json({ id: result[0].insertId });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// ✅ UPDATE a pricing rule by ID
router.put('/:id', async (req, res) => {
  try {
    const data = {};
    for (const key of allowedFields) {
      if (req.body.hasOwnProperty(key)) {
        data[key] = req.body[key];
      }
    }

    const result = await db_1.pool.query(
      'UPDATE pricing_rules SET ? WHERE id = ?',
      [data, req.params.id]
    );

    res.json({ affectedRows: result[0].affectedRows });
  } catch (err) {
    console.error('Error on PUT /pricing_rules/:id', err);
    res.status(500).json({ error: 'Database error', message: err.message, stack: err.stack });
  }
});

// ✅ DELETE a pricing rule by ID
router.delete('/:id', async (req, res) => {
  try {
    const result = await db_1.pool.query('DELETE FROM pricing_rules WHERE id = ?', [req.params.id]);
    res.json({ affectedRows: result[0].affectedRows });
  } catch (err) {
    res.status(500).json({ error: 'Database error', message: err.message, stack: err.stack });
  }
});

exports.default = router;
