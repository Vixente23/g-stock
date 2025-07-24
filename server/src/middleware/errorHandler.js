const errorHandler = (err, req, res, next) => {
  console.error('❌ Erreur:', err);

  // Erreur de validation Joi
  if (err.isJoi) {
    return res.status(400).json({
      message: 'Données invalides',
      details: err.details.map(detail => detail.message)
    });
  }

  // Erreur PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': // Violation de contrainte unique
        return res.status(409).json({
          message: 'Cette valeur existe déjà'
        });
      case '23503': // Violation de clé étrangère
        return res.status(400).json({
          message: 'Référence invalide'
        });
      default:
        return res.status(500).json({
          message: 'Erreur de base de données'
        });
    }
  }

  // Erreur par défaut
  res.status(err.status || 500).json({
    message: err.message || 'Erreur interne du serveur'
  });
};

module.exports = { errorHandler };