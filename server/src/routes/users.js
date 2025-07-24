const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { pool } = require('../database/connection');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Schémas de validation
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  first_name: Joi.string().min(2).required(),
  last_name: Joi.string().min(2).required(),
  role: Joi.string().valid('admin', 'magasinier', 'commercial').required()
});

const passwordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(6).required()
});

// Obtenir tous les utilisateurs (admin seulement)
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Obtenir le profil de l'utilisateur connecté
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, is_active, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Mettre à jour le profil
router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const { first_name, last_name } = req.body;

    const schema = Joi.object({
      first_name: Joi.string().min(2).required(),
      last_name: Joi.string().min(2).required()
    });

    const { error, value } = schema.validate({ first_name, last_name });
    if (error) throw error;

    const result = await pool.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING id, email, first_name, last_name, role, is_active, created_at`,
      [value.first_name, value.last_name, req.user.id]
    );

    res.json({
      message: 'Profil mis à jour avec succès',
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Changer le mot de passe
router.put('/password', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = passwordSchema.validate(req.body);
    if (error) throw error;

    const { current_password, new_password } = value;

    // Vérifier le mot de passe actuel
    const userResult = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.id]
    );

    const isValidPassword = await bcrypt.compare(current_password, userResult.rows[0].password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(new_password, 12);

    // Mettre à jour le mot de passe
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    next(error);
  }
});

// Mettre à jour un utilisateur (admin seulement)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = userSchema.validate(req.body);
    if (error) throw error;

    const { email, first_name, last_name, role } = value;

    const result = await pool.query(
      `UPDATE users 
       SET email = $1, first_name = $2, last_name = $3, role = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 
       RETURNING id, email, first_name, last_name, role, is_active, created_at`,
      [email, first_name, last_name, role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      message: 'Utilisateur mis à jour avec succès',
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Désactiver un utilisateur (admin seulement)
router.put('/:id/deactivate', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Empêcher la désactivation de son propre compte
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas désactiver votre propre compte' });
    }

    const result = await pool.query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({ message: 'Utilisateur désactivé avec succès' });
  } catch (error) {
    next(error);
  }
});

// Réactiver un utilisateur (admin seulement)
router.put('/:id/activate', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE users SET is_active = true WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({ message: 'Utilisateur réactivé avec succès' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;