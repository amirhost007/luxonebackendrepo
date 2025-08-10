import express, { Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Extend Express Request to include `user`
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
    [key: string]: any;
  };
}

// Middleware to verify JWT and extract user info
function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const token = auth.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'luxone_secret';
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedRequest['user'];
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Interface for cost category payload
interface CostCategoryPayload {
  category_name?: string;
  description?: string;
}

// Interface for cost field payload
interface CostFieldPayload {
  field_name?: string;
  field_type?: 'material' | 'labor' | 'overhead' | 'transport' | 'custom';
  base_cost?: number;
  unit?: string;
  description?: string;
  is_active?: boolean;
}

// Get all cost categories
router.get('/categories', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const [categories] = await pool.query(`
      SELECT 
        cc.id,
        cc.category_name,
        cc.description,
        cc.created_at,
        cc.updated_at,
        COUNT(cf.id) as field_count,
        COALESCE(SUM(cf.base_cost), 0) as total_cost
      FROM cost_categories cc
      LEFT JOIN cost_fields cf ON cc.id = cf.category_id AND cf.is_active = 1
      GROUP BY cc.id
      ORDER BY cc.created_at DESC
    `);
    
    // Get fields for each category
    const categoriesWithFields = await Promise.all(
      (categories as any[]).map(async (category) => {
        const [fields] = await pool.query(
          'SELECT * FROM cost_fields WHERE category_id = ? AND is_active = 1 ORDER BY created_at ASC',
          [category.id]
        );
        return {
          ...category,
          fields: fields || [],
          total_cost: parseFloat(category.total_cost) || 0
        };
      })
    );
    
    res.json(categoriesWithFields);
    
  } catch (error) {
    console.error('Error fetching cost categories:', error);
    res.status(500).json({ error: 'Failed to fetch cost categories' });
  }
});

// Create new cost category
router.post('/categories', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { category_name, description } = req.body as CostCategoryPayload;
    
    if (!category_name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO cost_categories (category_name, description) VALUES (?, ?)',
      [category_name, description || '']
    );
    
    const categoryId = (result as any).insertId;
    
    // Get the created category
    const [categories] = await pool.query(
      'SELECT * FROM cost_categories WHERE id = ?',
      [categoryId]
    );
    
    const category = (categories as any[])[0];
    res.json({ success: true, category });
    
  } catch (error) {
    console.error('Error creating cost category:', error);
    res.status(500).json({ error: 'Failed to create cost category' });
  }
});

// Update cost category
router.put('/categories/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { id } = req.params;
    const { category_name, description } = req.body as CostCategoryPayload;
    
    if (!category_name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    await pool.query(
      'UPDATE cost_categories SET category_name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [category_name, description || '', id]
    );
    
    res.json({ success: true, message: 'Cost category updated successfully' });
    
  } catch (error) {
    console.error('Error updating cost category:', error);
    res.status(500).json({ error: 'Failed to update cost category' });
  }
});

// Delete cost category
router.delete('/categories/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { id } = req.params;
    
    // Delete associated fields first
    await pool.query('DELETE FROM cost_fields WHERE category_id = ?', [id]);
    
    // Delete the category
    await pool.query('DELETE FROM cost_categories WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Cost category deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting cost category:', error);
    res.status(500).json({ error: 'Failed to delete cost category' });
  }
});

// Get cost fields for a category
router.get('/categories/:id/fields', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { id } = req.params;
    
    const [fields] = await pool.query(
      'SELECT * FROM cost_fields WHERE category_id = ? ORDER BY created_at ASC',
      [id]
    );
    
    res.json(fields);
    
  } catch (error) {
    console.error('Error fetching cost fields:', error);
    res.status(500).json({ error: 'Failed to fetch cost fields' });
  }
});

// Add cost field to category
router.post('/categories/:id/fields', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { id } = req.params;
    const { field_name, field_type, base_cost, unit, description } = req.body as CostFieldPayload;
    
    if (!field_name || !field_type || base_cost === undefined || !unit) {
      return res.status(400).json({ error: 'Field name, type, base cost, and unit are required' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO cost_fields (category_id, field_name, field_type, base_cost, unit, description, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [id, field_name, field_type, base_cost, unit, description || '']
    );
    
    const fieldId = (result as any).insertId;
    
    // Get the created field
    const [fields] = await pool.query(
      'SELECT * FROM cost_fields WHERE id = ?',
      [fieldId]
    );
    
    const field = (fields as any[])[0];
    res.json({ success: true, field });
    
  } catch (error) {
    console.error('Error creating cost field:', error);
    res.status(500).json({ error: 'Failed to create cost field' });
  }
});

// Update cost field
router.put('/fields/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { id } = req.params;
    const { field_name, field_type, base_cost, unit, description, is_active } = req.body as CostFieldPayload;
    
    if (!field_name || !field_type || base_cost === undefined || !unit) {
      return res.status(400).json({ error: 'Field name, type, base cost, and unit are required' });
    }
    
    await pool.query(
      'UPDATE cost_fields SET field_name = ?, field_type = ?, base_cost = ?, unit = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [field_name, field_type, base_cost, unit, description || '', is_active !== false ? 1 : 0, id]
    );
    
    res.json({ success: true, message: 'Cost field updated successfully' });
    
  } catch (error) {
    console.error('Error updating cost field:', error);
    res.status(500).json({ error: 'Failed to update cost field' });
  }
});

// Delete cost field
router.delete('/fields/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { id } = req.params;
    
    await pool.query('DELETE FROM cost_fields WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Cost field deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting cost field:', error);
    res.status(500).json({ error: 'Failed to delete cost field' });
  }
});

// Get all cost fields
router.get('/fields', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const [fields] = await pool.query(`
      SELECT cf.*, cc.category_name 
      FROM cost_fields cf
      JOIN cost_categories cc ON cf.category_id = cc.id
      WHERE cf.is_active = 1
      ORDER BY cc.category_name, cf.field_name
    `);
    
    res.json(fields);
    
  } catch (error) {
    console.error('Error fetching cost fields:', error);
    res.status(500).json({ error: 'Failed to fetch cost fields' });
  }
});

// Get cost field by ID
router.get('/fields/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { id } = req.params;
    
    const [fields] = await pool.query(
      'SELECT * FROM cost_fields WHERE id = ?',
      [id]
    );
    
    if ((fields as any[]).length === 0) {
      return res.status(404).json({ error: 'Cost field not found' });
    }
    
    res.json((fields as any[])[0]);
    
  } catch (error) {
    console.error('Error fetching cost field:', error);
    res.status(500).json({ error: 'Failed to fetch cost field' });
  }
});

// Calculate total cost for a category
router.get('/categories/:id/total', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { id } = req.params;
    
    const [result] = await pool.query(
      'SELECT COALESCE(SUM(base_cost), 0) as total_cost FROM cost_fields WHERE category_id = ? AND is_active = 1',
      [id]
    );
    
    const totalCost = (result as any[])[0].total_cost;
    res.json({ total_cost: parseFloat(totalCost) || 0 });
    
  } catch (error) {
    console.error('Error calculating total cost:', error);
    res.status(500).json({ error: 'Failed to calculate total cost' });
  }
});

// Get cost statistics
router.get('/statistics', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const [stats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT cc.id) as total_categories,
        COUNT(cf.id) as total_fields,
        COALESCE(SUM(cf.base_cost), 0) as total_cost,
        COUNT(CASE WHEN cf.field_type = 'material' THEN 1 END) as material_fields,
        COUNT(CASE WHEN cf.field_type = 'labor' THEN 1 END) as labor_fields,
        COUNT(CASE WHEN cf.field_type = 'overhead' THEN 1 END) as overhead_fields,
        COUNT(CASE WHEN cf.field_type = 'transport' THEN 1 END) as transport_fields,
        COUNT(CASE WHEN cf.field_type = 'custom' THEN 1 END) as custom_fields
      FROM cost_categories cc
      LEFT JOIN cost_fields cf ON cc.id = cf.category_id AND cf.is_active = 1
    `);
    
    const statistics = (stats as any[])[0];
    res.json({
      total_categories: parseInt(statistics.total_categories) || 0,
      total_fields: parseInt(statistics.total_fields) || 0,
      total_cost: parseFloat(statistics.total_cost) || 0,
      field_types: {
        material: parseInt(statistics.material_fields) || 0,
        labor: parseInt(statistics.labor_fields) || 0,
        overhead: parseInt(statistics.overhead_fields) || 0,
        transport: parseInt(statistics.transport_fields) || 0,
        custom: parseInt(statistics.custom_fields) || 0
      }
    });
    
  } catch (error) {
    console.error('Error fetching cost statistics:', error);
    res.status(500).json({ error: 'Failed to fetch cost statistics' });
  }
});

export default router;
