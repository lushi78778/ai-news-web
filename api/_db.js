const mysql = require('mysql2/promise');

let pool;
const requestLog = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 60;

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

function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function methodAllowed(req, res, methods = ['GET']) {
  applyCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }
  if (methods.includes(req.method)) return true;
  res.setHeader('Allow', methods.join(', '));
  sendJson(res, 405, { success: false, error: 'Method not allowed' });
  return false;
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function rateLimit(req, res) {
  const now = Date.now();
  const ip = getClientIp(req);
  const cutoff = now - WINDOW_MS;
  const hits = (requestLog.get(ip) || []).filter((ts) => ts > cutoff);

  if (hits.length >= MAX_REQUESTS) {
    requestLog.set(ip, hits);
    res.setHeader('RateLimit-Limit', String(MAX_REQUESTS));
    res.setHeader('RateLimit-Remaining', '0');
    res.setHeader('RateLimit-Reset', String(Math.ceil(WINDOW_MS / 1000)));
    res.setHeader('RateLimit-Policy', `${MAX_REQUESTS};w=${Math.ceil(WINDOW_MS / 1000)}`);
    sendJson(res, 429, { success: false, error: 'Too many requests, please try again later' });
    return false;
  }

  hits.push(now);
  requestLog.set(ip, hits);
  res.setHeader('RateLimit-Limit', String(MAX_REQUESTS));
  res.setHeader('RateLimit-Remaining', String(Math.max(0, MAX_REQUESTS - hits.length)));
  res.setHeader('RateLimit-Reset', String(Math.ceil(WINDOW_MS / 1000)));
  res.setHeader('RateLimit-Policy', `${MAX_REQUESTS};w=${Math.ceil(WINDOW_MS / 1000)}`);

  if (requestLog.size > 10000) {
    for (const [key, values] of requestLog.entries()) {
      const recent = values.filter((ts) => ts > cutoff);
      if (recent.length === 0) requestLog.delete(key);
      else requestLog.set(key, recent);
    }
  }

  return true;
}

function prepareRequest(req, res) {
  if (!methodAllowed(req, res)) return false;
  return rateLimit(req, res);
}

module.exports = { getPool, sendJson, methodAllowed, prepareRequest, applyCors };
