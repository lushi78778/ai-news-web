const { sendJson, methodAllowed } = require('./_db');

module.exports = async function handler(req, res) {
  if (!methodAllowed(req, res)) return;
  sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
};
