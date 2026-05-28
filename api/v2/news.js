const { getPool, sendJson, prepareRequest } = require('../_db');

// mysql2 returns Date objects for DATETIME columns;
// JSON.stringify converts them to ISO strings with .000Z (UTC).
// Since we store Beijing time (UTC+8), explicitly format without TZ suffix.
function fmtDatetime(v) {
  if (!v || !(v instanceof Date)) return v;
  const pad = (n) => String(n).padStart(2, '0');
  return `${v.getFullYear()}-${pad(v.getMonth()+1)}-${pad(v.getDate())} ${pad(v.getHours())}:${pad(v.getMinutes())}:${pad(v.getSeconds())}`;
}

function fmtDate(v) {
  if (!v || !(v instanceof Date)) return v;
  const pad = (n) => String(n).padStart(2, '0');
  return `${v.getFullYear()}-${pad(v.getMonth()+1)}-${pad(v.getDate())}`;
}

function formatRow(r) {
  return {
    ...r,
    event_time_utc8: fmtDatetime(r.event_time_utc8),
    usable_trade_date: fmtDate(r.usable_trade_date),
  };
}

function summarize(rows) {
  const summary = {
    total: rows.length,
    by_direction: { positive: 0, negative: 0, neutral: 0 },
    by_theme: {},
    high_impact: 0,
  };

  for (const row of rows) {
    if (row.direction) {
      summary.by_direction[row.direction] = (summary.by_direction[row.direction] || 0) + 1;
    }
    if (row.external_theme) {
      summary.by_theme[row.external_theme] = (summary.by_theme[row.external_theme] || 0) + 1;
    }
    if (row.importance >= 3) {
      summary.high_impact += 1;
    }
  }

  return summary;
}

module.exports = async function handler(req, res) {
  if (!prepareRequest(req, res)) return;

  try {
    const pool = getPool();
    const { date } = req.query;

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      sendJson(res, 400, { success: false, error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    const params = [];
    let where = 'usable_for_signal = 1';
    let order = 'event_time_utc8 DESC';
    let limit = 'LIMIT 50';

    if (date) {
      where += ' AND DATE(event_time_utc8) = ?';
      params.push(date);
      order = 'importance DESC, event_time_utc8 DESC';
      limit = '';
    }

    const [rows] = await pool.query(
      `SELECT event_id, title, summary, direction, importance,
              external_theme, event_type, source, source_url,
              event_time_utc8, usable_trade_date, mentioned_tickers
       FROM external_catalyst_event
       WHERE ${where}
       ORDER BY ${order}
       ${limit}`,
      params
    );

    sendJson(res, 200, {
      success: true,
      date: date || null,
      count: rows.length,
      summary: summarize(rows),
      data: rows.map(formatRow),
    });
  } catch (err) {
    console.error('news api error:', err);
    sendJson(res, 500, { success: false, error: 'Internal server error' });
  }
};
