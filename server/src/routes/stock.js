const express = require('express');
const Joi = require('joi');
const { pool } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Schéma de validation pour les mouvements de stock
const movementSchema = Joi.object({
  product_id: Joi.number().integer().required(),
  type: Joi.string().valid('entree', 'sortie', 'ajustement', 'inventaire').required(),
  quantity: Joi.number().integer().required(),
  reason: Joi.string().allow(''),
  reference: Joi.string().allow(''),
  notes: Joi.string().allow('')
});

// Obtenir l'historique des mouvements
router.get('/movements', authenticateToken, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, product_id, type } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT sm.*, p.name as product_name, p.sku, u.first_name, u.last_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      JOIN users u ON sm.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (product_id) {
      paramCount++;
      query += ` AND sm.product_id = $${paramCount}`;
      params.push(product_id);
    }

    if (type) {
      paramCount++;
      query += ` AND sm.type = $${paramCount}`;
      params.push(type);
    }

    query += ` ORDER BY sm.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Compter le total
    let countQuery = 'SELECT COUNT(*) FROM stock_movements sm WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (product_id) {
      countParamCount++;
      countQuery += ` AND sm.product_id = $${countParamCount}`;
      countParams.push(product_id);
    }

    if (type) {
      countParamCount++;
      countQuery += ` AND sm.type = $${countParamCount}`;
      countParams.push(type);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      movements: result.rows,
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

// Créer un mouvement de stock
router.post('/movements', authenticateToken, async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { error, value } = movementSchema.validate(req.body);
    if (error) throw error;

    const { product_id, type, quantity, reason, reference, notes } = value;

    // Obtenir le stock actuel
    const productResult = await client.query(
      'SELECT current_stock, name, min_stock FROM products WHERE id = $1 AND is_active = true',
      [product_id]
    );

    if (productResult.rows.length === 0) {
      throw new Error('Produit non trouvé');
    }

    const product = productResult.rows[0];
    const previousStock = product.current_stock;
    let newStock;

    // Calculer le nouveau stock selon le type de mouvement
    switch (type) {
      case 'entree':
        newStock = previousStock + Math.abs(quantity);
        break;
      case 'sortie':
        newStock = previousStock - Math.abs(quantity);
        if (newStock < 0) {
          throw new Error('Stock insuffisant');
        }
        break;
      case 'ajustement':
        newStock = previousStock + quantity; // quantity peut être négatif
        if (newStock < 0) {
          throw new Error('Le stock ne peut pas être négatif');
        }
        break;
      case 'inventaire':
        newStock = Math.abs(quantity); // quantity = nouveau stock total
        break;
      default:
        throw new Error('Type de mouvement invalide');
    }

    // Mettre à jour le stock du produit
    await client.query(
      'UPDATE products SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newStock, product_id]
    );

    // Enregistrer le mouvement
    const movementResult = await client.query(
      `INSERT INTO stock_movements 
       (product_id, user_id, type, quantity, previous_stock, new_stock, reason, reference, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [product_id, req.user.id, type, quantity, previousStock, newStock, reason, reference, notes]
    );

    // Créer une alerte si le stock est faible
    if (newStock <= product.min_stock && newStock > 0) {
      await client.query(
        `INSERT INTO alerts (product_id, type, message) 
         VALUES ($1, 'stock_faible', $2)`,
        [product_id, `Stock faible pour ${product.name}: ${newStock} restant(s)`]
      );
    } else if (newStock === 0) {
      await client.query(
        `INSERT INTO alerts (product_id, type, message) 
         VALUES ($1, 'rupture', $2)`,
        [product_id, `Rupture de stock pour ${product.name}`]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Mouvement de stock enregistré avec succès',
      movement: movementResult.rows[0],
      newStock
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

// Obtenir les alertes de stock
router.get('/alerts', authenticateToken, async (req, res, next) => {
  try {
    const { is_read } = req.query;

    let query = `
      SELECT a.*, p.name as product_name, p.sku, p.current_stock, p.min_stock
      FROM alerts a
      JOIN products p ON a.product_id = p.id
      WHERE p.is_active = true
    `;
    const params = [];

    if (is_read !== undefined) {
      query += ' AND a.is_read = $1';
      params.push(is_read === 'true');
    }

    query += ' ORDER BY a.created_at DESC';

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Marquer une alerte comme lue
router.put('/alerts/:id/read', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE alerts SET is_read = true WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Alerte non trouvée' });
    }

    res.json({
      message: 'Alerte marquée comme lue',
      alert: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Obtenir les produits avec stock faible
router.get('/low-stock', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT p.*, s.name as supplier_name
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.current_stock <= p.min_stock AND p.is_active = true
      ORDER BY (p.current_stock::float / NULLIF(p.min_stock, 0)) ASC
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;