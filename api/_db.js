const mysql = require('mysql2/promise');

let pool;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: requireEnv('DB_HOST'),
      port: Number(process.env.DB_PORT || 3306),
      user: requireEnv('DB_USER'),
      password: requireEnv('DB_PASSWORD'),
      database: requireEnv('DB_NAME'),
      waitForConnections: true,
      connectionLimit: 3,
      queueLimit: 0,
      enableKeepAlive: true,
    });
  }
  return pool;
}

function sendJson(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(body);
}

function methodAllowed(req, res, methods = ['GET']) {
  if (methods.includes(req.method)) return true;
  res.setHeader('Allow', methods.join(', '));
  sendJson(res, 405, { success: false, error: 'Method not allowed' });
  return false;
}

module.exports = { getPool, sendJson, methodAllowed };
