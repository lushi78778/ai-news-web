const { sendJson, prepareRequest } = require('./_db');

module.exports = async function handler(req, res) {
  if (!prepareRequest(req, res)) return;
  sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
};
