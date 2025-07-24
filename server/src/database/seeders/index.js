const bcrypt = require('bcryptjs');
const { pool } = require('../connection');

const seedDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Début du seeding de la base de données...');

    // Vider les tables existantes
    await client.query('TRUNCATE TABLE stock_movements, alerts, products, suppliers, users RESTART IDENTITY CASCADE');

    // Créer les utilisateurs
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const usersResult = await client.query(`
      INSERT INTO users (email, password, first_name, last_name, role) VALUES
      ('admin@stockapp.com', $1, 'Admin', 'System', 'admin'),
      ('magasinier@stockapp.com', $1, 'Jean', 'Dupont', 'magasinier'),
      ('commercial@stockapp.com', $1, 'Marie', 'Martin', 'commercial')
      RETURNING id, email, role
    `, [hashedPassword]);

    console.log('✅ Utilisateurs créés:', usersResult.rows.length);

    // Créer les fournisseurs
    const suppliersResult = await client.query(`
      INSERT INTO suppliers (name, email, phone, address, contact_person) VALUES
      ('TechnoSupply', 'contact@technosupply.com', '01 23 45 67 89', '123 Rue de la Tech, 75001 Paris', 'Pierre Techno'),
      ('ElectroDistrib', 'info@electrodistrib.fr', '01 98 76 54 32', '456 Avenue de l\'Électronique, 69000 Lyon', 'Sophie Électro'),
      ('BureauPlus', 'vente@bureauplus.com', '01 11 22 33 44', '789 Boulevard du Bureau, 13000 Marseille', 'Marc Bureau'),
      ('OutilsPro', 'commande@outilspro.fr', '01 55 66 77 88', '321 Rue des Outils, 31000 Toulouse', 'Julie Outils')
      RETURNING id, name
    `);

    console.log('✅ Fournisseurs créés:', suppliersResult.rows.length);

    // Créer les produits
    const productsData = [
      // Électronique
      ['Ordinateur Portable Dell', 'Ordinateur portable professionnel 15 pouces', 'DELL-LAP-001', '1234567890123', 'Électronique', 'pièce', 800.00, 1200.00, 5, 50, 25, null, suppliersResult.rows[0].id],
      ['Souris Logitech MX', 'Souris sans fil ergonomique', 'LOG-MX-002', '2345678901234', 'Électronique', 'pièce', 45.00, 75.00, 10, 100, 45, null, suppliersResult.rows[1].id],
      ['Clavier Mécanique', 'Clavier mécanique rétroéclairé', 'KEY-MECH-003', '3456789012345', 'Électronique', 'pièce', 120.00, 180.00, 8, 80, 32, null, suppliersResult.rows[1].id],
      ['Écran 24 pouces', 'Moniteur LED Full HD', 'MON-24-004', '4567890123456', 'Électronique', 'pièce', 200.00, 320.00, 3, 30, 15, null, suppliersResult.rows[0].id],
      ['Webcam HD', 'Caméra web haute définition', 'CAM-HD-005', '5678901234567', 'Électronique', 'pièce', 60.00, 95.00, 5, 50, 28, null, suppliersResult.rows[1].id],

      // Bureau
      ['Chaise de Bureau', 'Chaise ergonomique avec accoudoirs', 'CHAIR-ERG-006', '6789012345678', 'Mobilier', 'pièce', 150.00, 250.00, 2, 20, 8, null, suppliersResult.rows[2].id],
      ['Bureau Ajustable', 'Bureau assis-debout électrique', 'DESK-ADJ-007', '7890123456789', 'Mobilier', 'pièce', 400.00, 650.00, 1, 10, 4, null, suppliersResult.rows[2].id],
      ['Lampe LED', 'Lampe de bureau LED réglable', 'LAMP-LED-008', '8901234567890', 'Éclairage', 'pièce', 35.00, 55.00, 5, 40, 22, null, suppliersResult.rows[2].id],

      // Outils
      ['Perceuse Sans Fil', 'Perceuse-visseuse 18V avec batterie', 'DRILL-18V-009', '9012345678901', 'Outils', 'pièce', 80.00, 130.00, 3, 25, 12, null, suppliersResult.rows[3].id],
      ['Tournevis Set', 'Set de tournevis magnétiques', 'SCRW-SET-010', '0123456789012', 'Outils', 'set', 25.00, 40.00, 10, 60, 35, null, suppliersResult.rows[3].id],
      ['Niveau à Bulle', 'Niveau professionnel 60cm', 'LEVEL-60-011', '1234567890124', 'Outils', 'pièce', 15.00, 25.00, 8, 50, 18, null, suppliersResult.rows[3].id],

      // Consommables
      ['Papier A4', 'Ramette papier blanc 80g', 'PAPER-A4-012', '2345678901235', 'Consommables', 'ramette', 4.50, 8.00, 20, 200, 85, null, suppliersResult.rows[2].id],
      ['Cartouche Encre', 'Cartouche d\'encre noire HP', 'INK-HP-013', '3456789012346', 'Consommables', 'pièce', 25.00, 45.00, 15, 100, 42, null, suppliersResult.rows[0].id],
      ['Stylos Bille', 'Lot de 10 stylos bille bleus', 'PEN-BLUE-014', '4567890123457', 'Consommables', 'lot', 8.00, 15.00, 25, 150, 78, null, suppliersResult.rows[2].id],

      // Stock faible (pour tester les alertes)
      ['Câble HDMI', 'Câble HDMI 2m haute qualité', 'HDMI-2M-015', '5678901234568', 'Électronique', 'pièce', 12.00, 20.00, 10, 80, 3, null, suppliersResult.rows[1].id],
      ['Batterie AA', 'Piles alcalines AA (pack de 4)', 'BATT-AA-016', '6789012345679', 'Consommables', 'pack', 6.00, 12.00, 15, 100, 8, null, suppliersResult.rows[1].id]
    ];

    for (const productData of productsData) {
      await client.query(`
        INSERT INTO products 
        (name, description, sku, barcode, category, unit, purchase_price, selling_price, 
         min_stock, max_stock, current_stock, image_url, supplier_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, productData);
    }

    console.log('✅ Produits créés:', productsData.length);

    // Créer quelques mouvements de stock récents
    const movementsData = [
      [1, 1, 'entree', 10, 15, 25, 'Réapprovisionnement', 'REF-001', 'Livraison fournisseur'],
      [2, 2, 'sortie', 5, 50, 45, 'Vente', 'VTE-001', 'Commande client'],
      [3, 1, 'entree', 8, 24, 32, 'Réapprovisionnement', 'REF-002', 'Livraison fournisseur'],
      [4, 2, 'sortie', 2, 17, 15, 'Vente', 'VTE-002', 'Commande client'],
      [15, 1, 'sortie', 7, 10, 3, 'Vente', 'VTE-003', 'Stock faible après vente']
    ];

    for (const movementData of movementsData) {
      await client.query(`
        INSERT INTO stock_movements 
        (product_id, user_id, type, quantity, previous_stock, new_stock, reason, reference, notes) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, movementData);
    }

    console.log('✅ Mouvements de stock créés:', movementsData.length);

    // Créer des alertes pour les produits en stock faible
    const alertsData = [
      [15, 'stock_faible', 'Stock faible pour Câble HDMI: 3 restant(s)'],
      [16, 'stock_faible', 'Stock faible pour Batterie AA: 8 restant(s)']
    ];

    for (const alertData of alertsData) {
      await client.query(`
        INSERT INTO alerts (product_id, type, message) 
        VALUES ($1, $2, $3)
      `, alertData);
    }

    console.log('✅ Alertes créées:', alertsData.length);

    console.log('🎉 Seeding terminé avec succès !');
    console.log('\n📋 Comptes de test créés:');
    console.log('👤 Admin: admin@stockapp.com / password123');
    console.log('👤 Magasinier: magasinier@stockapp.com / password123');
    console.log('👤 Commercial: commercial@stockapp.com / password123');

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Exécuter le seeding si ce fichier est appelé directement
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };