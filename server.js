const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { fetchLiveFxRates, parseAndCategorizeExpense, calculateRunRate, queryCoPilot } = require('./engine/engine');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'fintrack_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

const initDatabase = async () => {
  try {
    const rootConn = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    await rootConn.end();

    pool = mysql.createPool(dbConfig);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        category VARCHAR(50) DEFAULT 'General Expense',
        confidence_score DECIMAL(3, 2) DEFAULT 0.00,
        is_anomaly BOOLEAN DEFAULT FALSE,
        anomaly_reason VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_liquidity_snapshots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        snapshot_date DATE UNIQUE NOT NULL,
        total_liquid_balance DECIMAL(12, 2) NOT NULL,
        daily_burn DECIMAL(12, 2) NOT NULL
      );
    `);

    const [rows] = await pool.query('SELECT COUNT(*) as count FROM daily_liquidity_snapshots');
    if (rows[0].count === 0) {
      await pool.query(`
        INSERT INTO daily_liquidity_snapshots (snapshot_date, total_liquid_balance, daily_burn)
        VALUES (CURDATE(), 2130.00, 45.00);
      `);
    }

    console.log('✅ MySQL Database & Tables Auto-Initialized Successfully.');
  } catch (err) {
    console.error('⚠️ Database Auto-Init Warning:', err.message);
  }
};

// ------------------- ENDPOINTS -------------------

app.get('/api/health', (req, res) => {
  res.json({ status: 'AURA FINTECH Engine Online', timestamp: new Date() });
});

app.get('/api/ai/fx-rates', async (req, res) => {
  try {
    const rates = await fetchLiveFxRates();
    res.json({ success: true, rates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/ai/parse-expense', async (req, res) => {
  try {
    const { rawInput, customCategory } = req.body;
    const [rows] = await pool.query('SELECT amount FROM ai_expenses ORDER BY id DESC LIMIT 20');
    const historicalAmounts = rows.map(r => Number(r.amount));

    const parsed = await parseAndCategorizeExpense(rawInput, historicalAmounts, customCategory);

    const [result] = await pool.query(
      'INSERT INTO ai_expenses (description, amount, category, confidence_score, is_anomaly, anomaly_reason) VALUES (?, ?, ?, ?, ?, ?)',
      [parsed.description, parsed.amount, parsed.category, parsed.confidence, parsed.isAnomaly, parsed.anomalyReason]
    );

    res.json({ success: true, expense: { id: result.insertId, ...parsed } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/ai/runrate', async (req, res) => {
  try {
    const [snap] = await pool.query('SELECT total_liquid_balance FROM daily_liquidity_snapshots ORDER BY id DESC LIMIT 1');
    const liquidBalance = snap.length > 0 ? Number(snap[0].total_liquid_balance) : 2130;

    const [expenses] = await pool.query('SELECT description, amount, category, created_at FROM ai_expenses ORDER BY id DESC LIMIT 15');
    const metrics = calculateRunRate(liquidBalance, expenses);

    res.json({ success: true, metrics, liquidBalance, recentExpenses: expenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/ai/copilot', async (req, res) => {
  try {
    const { message } = req.body;
    const [snap] = await pool.query('SELECT total_liquid_balance FROM daily_liquidity_snapshots ORDER BY id DESC LIMIT 1');
    const liquidBalance = snap.length > 0 ? Number(snap[0].total_liquid_balance) : 2130;

    const [expenses] = await pool.query('SELECT description, amount, category, created_at FROM ai_expenses ORDER BY id DESC LIMIT 15');
    const metrics = calculateRunRate(liquidBalance, expenses);

    const response = await queryCoPilot(message, {
      liquidBalanceUSD: liquidBalance,
      metrics,
      recentExpenses: expenses
    });

    res.json({ success: true, response });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ------------------- LAUNCH -------------------

initDatabase().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`🚀 AURA FINTECH Engine active on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const ALT_PORT = Number(PORT) + 10;
      console.warn(`⚠️ Port ${PORT} occupied. Auto-switching to http://localhost:${ALT_PORT}`);
      app.listen(ALT_PORT);
    }
  });
});