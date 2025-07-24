const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const connectDB = async () => {
  try {
    await pool.connect();
    console.log('✅ Connexion à PostgreSQL établie');
    
    // Créer les tables si elles n'existent pas
    await createTables();
  } catch (error) {
    console.error('❌ Erreur de connexion à PostgreSQL:', error);
    throw error;
  }
};

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    // Table des utilisateurs
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(50) DEFAULT 'magasinier' CHECK (role IN ('admin', 'magasinier', 'commercial')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des fournisseurs
    await client.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        contact_person VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des produits
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        sku VARCHAR(100) UNIQUE NOT NULL,
        barcode VARCHAR(255),
        category VARCHAR(100),
        unit VARCHAR(50) DEFAULT 'pièce',
        purchase_price DECIMAL(10,2) DEFAULT 0,
        selling_price DECIMAL(10,2) DEFAULT 0,
        min_stock INTEGER DEFAULT 0,
        max_stock INTEGER DEFAULT 1000,
        current_stock INTEGER DEFAULT 0,
        image_url VARCHAR(500),
        supplier_id INTEGER REFERENCES suppliers(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des mouvements de stock
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        type VARCHAR(50) NOT NULL CHECK (type IN ('entree', 'sortie', 'ajustement', 'inventaire')),
        quantity INTEGER NOT NULL,
        previous_stock INTEGER NOT NULL,
        new_stock INTEGER NOT NULL,
        reason VARCHAR(255),
        reference VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des alertes
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('stock_faible', 'rupture', 'peremption')),
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Index pour optimiser les performances
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_alerts_product ON alerts(product_id)');

    console.log('✅ Tables créées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { pool, connectDB };