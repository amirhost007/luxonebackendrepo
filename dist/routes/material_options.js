"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT * FROM material_options');
        const rows = result[0];
        res.json(rows);
    }
    catch (err) {
        res.status(500).json({ error: 'Database error', details: err });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT * FROM material_options WHERE id = ?', [req.params.id]);
        const rows = result[0];
        if (rows.length === 0)
            return res.status(404).json({ error: 'Not found' });
        res.json(rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: 'Database error', details: err });
    }
});
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        const result = await db_1.pool.query('INSERT INTO material_options SET ?', [data]);
        res.status(201).json({ id: result[0].insertId });
    }
    catch (err) {
        res.status(500).json({ error: 'Database error', details: err });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const data = req.body;
        const result = await db_1.pool.query('UPDATE material_options SET ? WHERE id = ?', [data, req.params.id]);
        res.json({ affectedRows: result[0].affectedRows });
    }
    catch (err) {
        res.status(500).json({ error: 'Database error', details: err });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const result = await db_1.pool.query('DELETE FROM material_options WHERE id = ?', [req.params.id]);
        res.json({ affectedRows: result[0].affectedRows });
    }
    catch (err) {
        res.status(500).json({ error: 'Database error', details: err });
    }
});
exports.default = router;
