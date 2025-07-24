const express = require('express');
const Joi = require('joi');
const { pool } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Schéma de validation pour les fournisseurs
const supplierSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().allow(''),
  phone: Joi.string().allow(''),
  address: Joi.string().allow(''),
  contact_person: Joi.string().allow('')
});

// Obtenir tous les fournisseurs
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM suppliers WHERE is_active = true';
    const params = [];

    if (search) {
      query += ' AND (name ILIKE $1 OR email ILIKE $1)';
      params.push(`%${search}%`);
    }

    query += ` ORDER BY name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Compter le total
    let countQuery = 'SELECT COUNT(*) FROM suppliers WHERE is_active = true';
    const countParams = [];

    if (search) {
      countQuery += ' AND (name ILIKE $1 OR email ILIKE $1)';
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      suppliers: result.rows,
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

// Obtenir un fournisseur par ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM suppliers WHERE id = $1 AND is_active = true',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Fournisseur non trouvé' });
    }

    // Obtenir les produits de ce fournisseur
    const productsResult = await pool.query(
      'SELECT id, name, sku, current_stock FROM products WHERE supplier_id = $1 AND is_active = true',
      [id]
    );

    res.json({
      ...result.rows[0],
      products: productsResult.rows
    });
  } catch (error) {
    next(error);
  }
});

// Créer un fournisseur
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = supplierSchema.validate(req.body);
    if (error) throw error;

    const { name, email, phone, address, contact_person } = value;

    const result = await pool.query(
      `INSERT INTO suppliers (name, email, phone, address, contact_person) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, email, phone, address, contact_person]
    );

    res.status(201).json({
      message: 'Fournisseur créé avec succès',
      supplier: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Mettre à jour un fournisseur
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = supplierSchema.validate(req.body);
    if (error) throw error;

    const { name, email, phone, address, contact_person } = value;

    const result = await pool.query(
      `UPDATE suppliers 
       SET name = $1, email = $2, phone = $3, address = $4, contact_person = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND is_active = true 
       RETURNING *`,
      [name, email, phone, address, contact_person, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Fournisseur non trouvé' });
    }

    res.json({
      message: 'Fournisseur mis à jour avec succès',
      supplier: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Supprimer un fournisseur (soft delete)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier s'il y a des produits liés
    const productsResult = await pool.query(
      'SELECT COUNT(*) FROM products WHERE supplier_id = $1 AND is_active = true',
      [id]
    );

    if (parseInt(productsResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Impossible de supprimer ce fournisseur car il a des produits associés' 
      });
    }

    const result = await pool.query(
      'UPDATE suppliers SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Fournisseur non trouvé' });
    }

    res.json({ message: 'Fournisseur supprimé avec succès' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;