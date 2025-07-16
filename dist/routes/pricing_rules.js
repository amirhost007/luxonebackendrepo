const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// GET all pricing rules
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pricing_rules ORDER BY rule_name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// GET pricing rule by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pricing_rules WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// POST new pricing rule
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const [result] = await pool.query('INSERT INTO pricing_rules SET ?', [data]);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// PUT update pricing rule
router.put('/:id', async (req, res) => {
  try {
    const data = req.body;
    const [result] = await pool.query('UPDATE pricing_rules SET ? WHERE id = ?', [data, req.params.id]);
    res.json({ affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// DELETE pricing rule
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM pricing_rules WHERE id = ?', [req.params.id]);
    res.json({ affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

module.exports = router;
