const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { pool } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Schémas de validation
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  first_name: Joi.string().min(2).required(),
  last_name: Joi.string().min(2).required(),
  role: Joi.string().valid('admin', 'magasinier', 'commercial').default('magasinier')
});

// Connexion
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) throw error;

    const { email, password } = value;

    // Vérifier l'utilisateur
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = result.rows[0];

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Retourner les données utilisateur (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Connexion réussie',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
});

// Inscription (réservée aux admins)
router.post('/register', authenticateToken, async (req, res, next) => {
  try {
    // Seuls les admins peuvent créer des utilisateurs
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { error, value } = registerSchema.validate(req.body);
    if (error) throw error;

    const { email, password, first_name, last_name, role } = value;

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const result = await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, first_name, last_name, role, is_active, created_at`,
      [email, hashedPassword, first_name, last_name, role]
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Vérifier le token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    message: 'Token valide',
    user: req.user
  });
});

// Rafraîchir le token
router.post('/refresh', authenticateToken, (req, res) => {
  const token = jwt.sign(
    { userId: req.user.id, email: req.user.email, role: req.user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({ token });
});

module.exports = router;