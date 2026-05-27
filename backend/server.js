const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

const PORT = process.env.PORT || 3001;

// Trust proxy (nginx)
app.set('trust proxy', 1);

// CORS: allow all origins
app.use(cors());

// Rate limit: 60 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' },
});
app.use('/api/', apiLimiter);
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '10086');
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || 'REPLACE_ME_VIA_ENV';
const DB_NAME = process.env.DB_NAME || 'news';
const STATIC_DIR = process.env.STATIC_DIR || '/usr/share/nginx/html';

let pool;

async function initDb() {
  pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  });
  const conn = await pool.getConnection();
  conn.release();
  console.log('DB connected');
}

// API routes
// GET /api/v2/news?date=YYYY-MM-DD
app.get('/api/v2/news', async (req, res) => {
  try {
    const date = req.query.date;
    if (!date) {
      const [rows] = await pool.query(
        `SELECT event_id, title, summary, direction, importance,
                external_theme, event_type, source, source_url,
                event_time_utc8, usable_trade_date, mentioned_tickers
         FROM external_catalyst_event
         WHERE usable_for_signal = 1
         ORDER BY event_time_utc8 DESC
         LIMIT 50`
      );
      return res.json({ success: true, date: null, count: rows.length, data: rows });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const [rows] = await pool.query(
      `SELECT event_id, title, summary, direction, importance,
              external_theme, event_type, source, source_url,
              event_time_utc8, usable_trade_date, mentioned_tickers
       FROM external_catalyst_event
       WHERE DATE(event_time_utc8) = ? AND usable_for_signal = 1
       ORDER BY importance DESC, event_time_utc8 DESC`,
      [date]
    );

    const summary = {
      total: rows.length,
      by_direction: { positive: 0, negative: 0, neutral: 0 },
      by_theme: {},
      high_impact: 0,
    };
    for (const r of rows) {
      if (r.direction) summary.by_direction[r.direction] = (summary.by_direction[r.direction] || 0) + 1;
      if (r.external_theme) summary.by_theme[r.external_theme] = (summary.by_theme[r.external_theme] || 0) + 1;
      if (r.importance >= 3) summary.high_impact++;
    }

    res.json({ success: true, date, count: rows.length, summary, data: rows });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/v2/themes
app.get('/api/v2/themes', async (req, res) => {
  try {
    const [dates] = await pool.query(
      `SELECT DATE(event_time_utc8) AS day, COUNT(*) cnt
       FROM external_catalyst_event
       WHERE usable_for_signal = 1 AND event_time_utc8 IS NOT NULL
       GROUP BY DATE(event_time_utc8)
       ORDER BY day DESC LIMIT 60`
    );
    const [themes] = await pool.query(
      `SELECT code, label FROM external_news_theme ORDER BY code`
    );
    res.json({ success: true, dates, themes });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static frontend files
const staticPath = path.resolve(STATIC_DIR);
app.use('/news/assets', express.static(path.join(staticPath, 'assets'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, immutable, max-age=31536000');
  }
}));

// Serve SPA at root and /news
const serveNews = (req, res) => res.sendFile(path.join(staticPath, 'index.html'));
app.get('/', serveNews);
app.get('/news', serveNews);
app.get('/news/*', serveNews);

// Catch-all: for non-API routes, serve the SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  serveNews(req, res);
});

initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`News app listening on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize:', err);
  process.exit(1);
});
