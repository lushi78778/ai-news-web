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
    const [dateRows] = await pool.query(
      `SELECT event_time_utc8
       FROM external_catalyst_event
       WHERE usable_for_signal = 1 AND event_time_utc8 IS NOT NULL
       ORDER BY event_time_utc8 DESC
       LIMIT 5000`
    );
    const [themes] = await pool.query(
      `SELECT code, label FROM external_news_theme ORDER BY code`
    );

    const dateCounts = new Map();
    for (const row of dateRows) {
      const day = fmtDate(row.event_time_utc8);
      dateCounts.set(day, (dateCounts.get(day) || 0) + 1);
      if (dateCounts.size >= 60) break;
    }
    const dates = Array.from(dateCounts, ([day, cnt]) => ({ day, cnt }));

    sendJson(res, 200, { success: true, dates: dates.map(d => ({ ...d, day: fmtDate(d.day) })), themes });
  } catch (err) {
    console.error('themes api error:', err);
    sendJson(res, 500, { success: false, error: 'Internal server error' });
  }
};
