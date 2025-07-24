const jwt = require('jsonwebtoken');
const { pool } = require('../database/connection');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token d\'accès requis' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier que l'utilisateur existe toujours
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({ message: 'Utilisateur non trouvé ou inactif' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token invalide' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Accès refusé. Permissions insuffisantes.' 
      });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };