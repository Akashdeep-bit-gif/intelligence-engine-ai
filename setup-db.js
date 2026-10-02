const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const setupDatabase = async () => {
  console.log('🔄 Initializing Project 3 Database Setup...');

  // 1. Initial connection without database selected to ensure DB exists
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456'
  });

  try {
    const dbName = process.env.DB_NAME || 'fintrack_db';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`✅ Database '${dbName}' verified/created.`);

    await connection.query(`USE \`${dbName}\`;`);

    // 2. Create AI Expenses Table (for natural language inputs & anomaly tracking)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ai_expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        category VARCHAR(50) DEFAULT 'Uncategorized',
        confidence_score DECIMAL(3, 2) DEFAULT 0.00,
        is_anomaly BOOLEAN DEFAULT FALSE,
        anomaly_reason VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "ai_expenses" created.');

    // 3. Create Daily Liquidity Snapshots Table (for burn-rate & runway math)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS daily_liquidity_snapshots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        snapshot_date DATE UNIQUE NOT NULL,
        total_liquid_balance DECIMAL(12, 2) NOT NULL,
        daily_burn DECIMAL(12, 2) NOT NULL
      );
    `);
    console.log('✅ Table "daily_liquidity_snapshots" created.');

    // 4. Create AI Co-Pilot Conversation Log Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ai_chat_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role ENUM('user', 'assistant') NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "ai_chat_history" created.');

    // 5. Seed Initial Data for Testing
    console.log('🌱 Seeding initial records for AI calculation testing...');
    
    // Seed Liquidity Snapshot
    await connection.query(`
      INSERT INTO daily_liquidity_snapshots (snapshot_date, total_liquid_balance, daily_burn)
      VALUES (CURDATE(), 2130.00, 45.00)
      ON DUPLICATE KEY UPDATE total_liquid_balance = 2130.00, daily_burn = 45.00;
    `);

    // Seed Initial Expenses for Anomaly Detection Baseline
    await connection.query(`
      INSERT INTO ai_expenses (description, amount, category, confidence_score)
      SELECT * FROM (
        SELECT 'Starbucks Coffee' AS description, 15.00 AS amount, 'Food & Dining' AS category, 0.95 AS confidence_score
        UNION ALL
        SELECT 'Uber Ride to Office', 25.00, 'Transport & Travel', 0.90
        UNION ALL
        SELECT 'AWS Server Hosting', 50.00, 'Subscriptions', 0.98
        UNION ALL
        SELECT 'Swiggy Lunch Order', 30.00, 'Food & Dining', 0.92
      ) AS tmp
      WHERE NOT EXISTS (SELECT id FROM ai_expenses LIMIT 1);
    `);

    console.log('🚀 Project 3 Database Setup Completed Successfully!');
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
  } finally {
    await connection.end();
    process.exit(0);
  }
};

setupDatabase();