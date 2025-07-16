"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT * FROM pdf_templates');
        const rows = result[0];
        // Transform database structure to frontend format
        const transformedRows = rows.map(row => ({
            id: row.id,
            template_id: row.template_id,
            name: row.name,
            headerLogo: row.header_logo,
            headerText: row.header_text,
            footerText: row.footer_text,
            colors: {
                primary: row.primary_color,
                secondary: row.secondary_color,
                accent: row.accent_color
            },
            fonts: {
                heading: row.heading_font,
                body: row.body_font
            },
            sections: {
                showClientInfo: Boolean(row.show_client_info),
                showProjectSpecs: Boolean(row.show_project_specs),
                showPricing: Boolean(row.show_pricing),
                showTerms: Boolean(row.show_terms),
                customSections: row.custom_sections ? JSON.parse(row.custom_sections) : []
            },
            layout: row.layout_style,
            isActive: Boolean(row.is_active),
            isDefault: Boolean(row.is_default),
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
        res.json(transformedRows);
    }
    catch (err) {
        res.status(500).json({ error: 'Database error', details: err });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT * FROM pdf_templates WHERE id = ?', [req.params.id]);
        const rows = result[0];
        if (rows.length === 0)
            return res.status(404).json({ error: 'Not found' });
        const row = rows[0];
        // Transform database structure to frontend format
        const transformedRow = {
            id: row.id,
            template_id: row.template_id,
            name: row.name,
            headerLogo: row.header_logo,
            headerText: row.header_text,
            footerText: row.footer_text,
            colors: {
                primary: row.primary_color,
                secondary: row.secondary_color,
                accent: row.accent_color
            },
            fonts: {
                heading: row.heading_font,
                body: row.body_font
            },
            sections: {
                showClientInfo: Boolean(row.show_client_info),
                showProjectSpecs: Boolean(row.show_project_specs),
                showPricing: Boolean(row.show_pricing),
                showTerms: Boolean(row.show_terms),
                customSections: row.custom_sections ? JSON.parse(row.custom_sections) : []
            },
            layout: row.layout_style,
            isActive: Boolean(row.is_active),
            isDefault: Boolean(row.is_default),
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
        res.json(transformedRow);
    }
    catch (err) {
        res.status(500).json({ error: 'Database error', details: err });
    }
});
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        // Transform frontend data structure to match database schema
        const transformedData = {
            template_id: data.template_id || data.id,
            name: data.name,
            header_logo: data.headerLogo || data.header_logo,
            header_text: data.headerText || data.header_text,
            footer_text: data.footerText || data.footer_text,
            primary_color: data.colors?.primary || data.primary_color,
            secondary_color: data.colors?.secondary || data.secondary_color,
            accent_color: data.colors?.accent || data.accent_color,
            heading_font: data.fonts?.heading || data.heading_font,
            body_font: data.fonts?.body || data.body_font,
            show_client_info: data.sections?.showClientInfo !== undefined ? data.sections.showClientInfo : data.show_client_info,
            show_project_specs: data.sections?.showProjectSpecs !== undefined ? data.sections.showProjectSpecs : data.show_project_specs,
            show_pricing: data.sections?.showPricing !== undefined ? data.sections.showPricing : data.show_pricing,
            show_terms: data.sections?.showTerms !== undefined ? data.sections.showTerms : data.show_terms,
            custom_sections: data.sections?.customSections ? JSON.stringify(data.sections.customSections) : data.custom_sections,
            layout_style: data.layout || data.layout_style,
            is_active: data.isActive !== undefined ? data.isActive : data.is_active,
            is_default: data.isDefault !== undefined ? data.isDefault : data.is_default
        };
        const result = await db_1.pool.query('INSERT INTO pdf_templates SET ?', [transformedData]);
        res.status(201).json({ id: result[0].insertId });
    }
    catch (err) {
        res.status(500).json({ error: 'Database error', details: err });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const data = req.body;
        // Transform frontend data structure to match database schema
        const transformedData = {
            template_id: data.template_id || data.id,
            name: data.name,
            header_logo: data.headerLogo || data.header_logo,
            header_text: data.headerText || data.header_text,
            footer_text: data.footerText || data.footer_text,
            primary_color: data.colors?.primary || data.primary_color,
            secondary_color: data.colors?.secondary || data.secondary_color,
            accent_color: data.colors?.accent || data.accent_color,
            heading_font: data.fonts?.heading || data.heading_font,
            body_font: data.fonts?.body || data.body_font,
            show_client_info: data.sections?.showClientInfo !== undefined ? data.sections.showClientInfo : data.show_client_info,
            show_project_specs: data.sections?.showProjectSpecs !== undefined ? data.sections.showProjectSpecs : data.show_project_specs,
            show_pricing: data.sections?.showPricing !== undefined ? data.sections.showPricing : data.show_pricing,
            show_terms: data.sections?.showTerms !== undefined ? data.sections.showTerms : data.show_terms,
            custom_sections: data.sections?.customSections ? JSON.stringify(data.sections.customSections) : data.custom_sections,
            layout_style: data.layout || data.layout_style,
            is_active: data.isActive !== undefined ? data.isActive : data.is_active,
            is_default: data.isDefault !== undefined ? data.isDefault : data.is_default
        };
        const result = await db_1.pool.query('UPDATE pdf_templates SET ? WHERE id = ?', [transformedData, req.params.id]);
        res.json({ affectedRows: result[0].affectedRows });
    }
    catch (err) {
        res.status(500).json({ error: 'Database error', details: err });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const result = await db_1.pool.query('DELETE FROM pdf_templates WHERE id = ?', [req.params.id]);
        res.json({ affectedRows: result[0].affectedRows });
    }
    catch (err) {
        res.status(500).json({ error: 'Database error', details: err });
    }
});
exports.default = router;
