const { getPool, sendJson, prepareRequest } = require('../_db');

function fmtDate(v) {
  if (!v || !(v instanceof Date)) return v;
  const pad = (n) => String(n).padStart(2, '0');
  return `${v.getFullYear()}-${pad(v.getMonth()+1)}-${pad(v.getDate())}`;
}

module.exports = async function handler(req, res) {
  if (!prepareRequest(req, res)) return;

  try {
    const pool = getPool();
    const [dates] = await pool.query(
      `SELECT DATE(event_time_utc8) AS day, COUNT(*) cnt
       FROM external_catalyst_event
       WHERE usable_for_signal = 1 AND event_time_utc8 IS NOT NULL
       GROUP BY DATE(event_time_utc8)
       ORDER BY day DESC
       LIMIT 60`
    );
    const [themes] = await pool.query(
      `SELECT code, label FROM external_news_theme ORDER BY code`
    );
    sendJson(res, 200, { success: true, dates: dates.map(d => ({ ...d, day: fmtDate(d.day) })), themes });
  } catch (err) {
    console.error('themes api error:', err);
    sendJson(res, 500, { success: false, error: 'Internal server error' });
  }
};
