const express = require('express');
const Joi = require('joi');
const { pool } = require('../database/connection');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Schéma de validation pour les produits
const productSchema = Joi.object({
  name: Joi.string().min(2).required(),
  description: Joi.string().allow(''),
  sku: Joi.string().min(2).required(),
  barcode: Joi.string().allow(''),
  category: Joi.string().allow(''),
  unit: Joi.string().default('pièce'),
  purchase_price: Joi.number().min(0).default(0),
  selling_price: Joi.number().min(0).default(0),
  min_stock: Joi.number().integer().min(0).default(0),
  max_stock: Joi.number().integer().min(1).default(1000),
  current_stock: Joi.number().integer().min(0).default(0),
  image_url: Joi.string().uri().allow(''),
  supplier_id: Joi.number().integer().allow(null)
});

// Obtenir tous les produits
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', category = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, s.name as supplier_name 
      FROM products p 
      LEFT JOIN suppliers s ON p.supplier_id = s.id 
      WHERE p.is_active = true
    `;
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (p.name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (category) {
      paramCount++;
      query += ` AND p.category = $${paramCount}`;
      params.push(category);
    }

    query += ` ORDER BY p.name LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Compter le total
    let countQuery = 'SELECT COUNT(*) FROM products WHERE is_active = true';
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (name ILIKE $${countParamCount} OR sku ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (category) {
      countParamCount++;
      countQuery += ` AND category = $${countParamCount}`;
      countParams.push(category);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Obtenir un produit par ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*, s.name as supplier_name 
       FROM products p 
       LEFT JOIN suppliers s ON p.supplier_id = s.id 
       WHERE p.id = $1 AND p.is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Créer un produit
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = productSchema.validate(req.body);
    if (error) throw error;

    const {
      name, description, sku, barcode, category, unit,
      purchase_price, selling_price, min_stock, max_stock,
      current_stock, image_url, supplier_id
    } = value;

    const result = await pool.query(
      `INSERT INTO products 
       (name, description, sku, barcode, category, unit, purchase_price, 
        selling_price, min_stock, max_stock, current_stock, image_url, supplier_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING *`,
      [name, description, sku, barcode, category, unit, purchase_price,
       selling_price, min_stock, max_stock, current_stock, image_url, supplier_id]
    );

    // Créer une alerte si le stock est faible
    if (current_stock <= min_stock) {
      await pool.query(
        `INSERT INTO alerts (product_id, type, message) 
         VALUES ($1, 'stock_faible', $2)`,
        [result.rows[0].id, `Stock faible pour ${name}: ${current_stock} restant(s)`]
      );
    }

    res.status(201).json({
      message: 'Produit créé avec succès',
      product: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Mettre à jour un produit
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = productSchema.validate(req.body);
    if (error) throw error;

    const {
      name, description, sku, barcode, category, unit,
      purchase_price, selling_price, min_stock, max_stock,
      current_stock, image_url, supplier_id
    } = value;

    const result = await pool.query(
      `UPDATE products 
       SET name = $1, description = $2, sku = $3, barcode = $4, category = $5, 
           unit = $6, purchase_price = $7, selling_price = $8, min_stock = $9, 
           max_stock = $10, current_stock = $11, image_url = $12, supplier_id = $13,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $14 AND is_active = true 
       RETURNING *`,
      [name, description, sku, barcode, category, unit, purchase_price,
       selling_price, min_stock, max_stock, current_stock, image_url, supplier_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    res.json({
      message: 'Produit mis à jour avec succès',
      product: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Supprimer un produit (soft delete)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE products SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    next(error);
  }
});

// Obtenir les catégories
router.get('/categories/list', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != \'\' AND is_active = true ORDER BY category'
    );

    res.json(result.rows.map(row => row.category));
  } catch (error) {
    next(error);
  }
});

module.exports = router;