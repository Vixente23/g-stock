const express = require('express');
const { pool } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtenir les statistiques du tableau de bord
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    // Statistiques générales
    const [
      productsResult,
      suppliersResult,
      lowStockResult,
      alertsResult,
      totalValueResult,
      recentMovementsResult
    ] = await Promise.all([
      // Nombre total de produits
      pool.query('SELECT COUNT(*) FROM products WHERE is_active = true'),
      
      // Nombre total de fournisseurs
      pool.query('SELECT COUNT(*) FROM suppliers WHERE is_active = true'),
      
      // Produits en stock faible
      pool.query('SELECT COUNT(*) FROM products WHERE current_stock <= min_stock AND is_active = true'),
      
      // Alertes non lues
      pool.query('SELECT COUNT(*) FROM alerts WHERE is_read = false'),
      
      // Valeur totale du stock
      pool.query('SELECT SUM(current_stock * purchase_price) as total_value FROM products WHERE is_active = true'),
      
      // Mouvements récents (7 derniers jours)
      pool.query(`
        SELECT COUNT(*) as count, type 
        FROM stock_movements 
        WHERE created_at >= NOW() - INTERVAL '7 days' 
        GROUP BY type
      `)
    ]);

    // Top 5 des produits les plus vendus (sorties) ce mois
    const topProductsResult = await pool.query(`
      SELECT p.name, p.sku, SUM(ABS(sm.quantity)) as total_sold
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      WHERE sm.type = 'sortie' 
        AND sm.created_at >= DATE_TRUNC('month', CURRENT_DATE)
        AND p.is_active = true
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    // Évolution du stock par catégorie
    const stockByCategoryResult = await pool.query(`
      SELECT 
        COALESCE(category, 'Sans catégorie') as category,
        COUNT(*) as product_count,
        SUM(current_stock) as total_stock,
        SUM(current_stock * purchase_price) as total_value
      FROM products 
      WHERE is_active = true
      GROUP BY category
      ORDER BY total_value DESC
    `);

    // Activité récente (derniers mouvements)
    const recentActivityResult = await pool.query(`
      SELECT 
        sm.*,
        p.name as product_name,
        p.sku,
        u.first_name,
        u.last_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      JOIN users u ON sm.user_id = u.id
      ORDER BY sm.created_at DESC
      LIMIT 10
    `);

    const stats = {
      overview: {
        totalProducts: parseInt(productsResult.rows[0].count),
        totalSuppliers: parseInt(suppliersResult.rows[0].count),
        lowStockProducts: parseInt(lowStockResult.rows[0].count),
        unreadAlerts: parseInt(alertsResult.rows[0].count),
        totalStockValue: parseFloat(totalValueResult.rows[0].total_value || 0)
      },
      recentMovements: recentMovementsResult.rows.reduce((acc, row) => {
        acc[row.type] = parseInt(row.count);
        return acc;
      }, {}),
      topProducts: topProductsResult.rows,
      stockByCategory: stockByCategoryResult.rows,
      recentActivity: recentActivityResult.rows
    };

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Obtenir les alertes récentes pour le tableau de bord
router.get('/alerts', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.*,
        p.name as product_name,
        p.sku,
        p.current_stock,
        p.min_stock
      FROM alerts a
      JOIN products p ON a.product_id = p.id
      WHERE a.is_read = false AND p.is_active = true
      ORDER BY a.created_at DESC
      LIMIT 5
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Obtenir les données pour les graphiques
router.get('/charts', authenticateToken, async (req, res, next) => {
  try {
    const { period = '30' } = req.query; // période en jours

    // Évolution des mouvements de stock
    const movementsChartResult = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        type,
        COUNT(*) as count,
        SUM(ABS(quantity)) as total_quantity
      FROM stock_movements
      WHERE created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY DATE(created_at), type
      ORDER BY date DESC
    `);

    // Répartition du stock par catégorie (pour graphique en secteurs)
    const categoryChartResult = await pool.query(`
      SELECT 
        COALESCE(category, 'Sans catégorie') as category,
        SUM(current_stock * purchase_price) as value,
        COUNT(*) as product_count
      FROM products 
      WHERE is_active = true AND current_stock > 0
      GROUP BY category
      ORDER BY value DESC
    `);

    // Évolution de la valeur du stock
    const stockValueResult = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        SUM(
          CASE 
            WHEN type IN ('entree', 'ajustement') AND quantity > 0 THEN quantity * 
              (SELECT purchase_price FROM products WHERE id = product_id)
            WHEN type = 'sortie' THEN -quantity * 
              (SELECT purchase_price FROM products WHERE id = product_id)
            ELSE 0
          END
        ) as value_change
      FROM stock_movements
      WHERE created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json({
      movements: movementsChartResult.rows,
      categories: categoryChartResult.rows,
      stockValue: stockValueResult.rows
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;