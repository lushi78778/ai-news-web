const { getPool, sendJson, prepareRequest } = require('../_db');

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
      data: rows,
    });
  } catch (err) {
    console.error('news api error:', err);
    sendJson(res, 500, { success: false, error: 'Internal server error' });
  }
};
