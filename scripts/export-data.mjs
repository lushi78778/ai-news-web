#!/usr/bin/env node
/**
 * 从 MySQL 导出数据为静态 JSON 文件，用于 GitHub Pages 部署。
 *
 * 使用方式：
 *   DB_PASSWORD=*** node scripts/export-data.mjs
 *
 * 环境变量：DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 * 输出目录：frontend/public/data/
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '..', 'frontend', 'public', 'data');

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '10086');
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME || 'stock';

if (!DB_PASSWORD) {
  console.error('❌ 请设置 DB_PASSWORD 环境变量');
  process.exit(1);
}

async function exportData() {
  const pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    connectionLimit: 2,
  });

  try {
    fs.mkdirSync(OUT_DIR, { recursive: true });

    // ---- 1. 导出有数据的日期列表 ----
    const [dateRows] = await pool.query(`
      SELECT DATE(event_time_utc8) AS day, COUNT(*) AS cnt
      FROM external_catalyst_event
      WHERE usable_for_signal = 1 AND event_time_utc8 IS NOT NULL
      GROUP BY DATE(event_time_utc8)
      ORDER BY day DESC
      LIMIT 90
    `);
    const dates = dateRows.map(r => ({ day: r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day), count: r.cnt }));
    fs.writeFileSync(path.join(OUT_DIR, 'dates.json'), JSON.stringify({ dates }, null, 2));
    console.log(`  ✓ dates.json (${dates.length} days)`);

    // ---- 2. 导出主题列表 ----
    const [themes] = await pool.query(`
      SELECT DISTINCT external_theme AS code
      FROM external_catalyst_event
      WHERE usable_for_signal = 1 AND external_theme IS NOT NULL
      ORDER BY code
    `);
    fs.writeFileSync(path.join(OUT_DIR, 'themes.json'), JSON.stringify({ themes }, null, 2));
    console.log(`  ✓ themes.json (${themes.length} themes)`);

    // ---- 3. 按天导出新闻数据 ----
    for (const { day } of dates) {
      const [rows] = await pool.query(`
        SELECT event_id, title, summary, direction, importance,
               external_theme, event_type, source, source_url,
               event_time_utc8, usable_trade_date, mentioned_tickers
        FROM external_catalyst_event
        WHERE DATE(event_time_utc8) = ? AND usable_for_signal = 1
        ORDER BY importance DESC, event_time_utc8 DESC
      `, [day]);

      const summary = { total: rows.length, by_direction: {}, by_theme: {}, high_impact: 0 };
      for (const r of rows) {
        if (r.direction) summary.by_direction[r.direction] = (summary.by_direction[r.direction] || 0) + 1;
        if (r.external_theme) summary.by_theme[r.external_theme] = (summary.by_theme[r.external_theme] || 0) + 1;
        if (r.importance >= 3) summary.high_impact++;
      }

      const dayStr = day instanceof Date ? day.toISOString().slice(0, 10) : String(day);
      const data = { success: true, date: dayStr, count: rows.length, summary, data: rows };
      fs.writeFileSync(path.join(OUT_DIR, `news-${dayStr}.json`), JSON.stringify(data, null, 2));
    }
    console.log(`  ✓ 已导出 ${dates.length} 天的新闻数据`);

    // ---- 4. 导出 latest.json（最近 50 条） ----
    const [latestRows] = await pool.query(`
      SELECT event_id, title, summary, direction, importance,
             external_theme, event_type, source, source_url,
             event_time_utc8, usable_trade_date, mentioned_tickers
      FROM external_catalyst_event
      WHERE usable_for_signal = 1
      ORDER BY event_time_utc8 DESC
      LIMIT 50
    `);
    fs.writeFileSync(path.join(OUT_DIR, 'latest.json'), JSON.stringify({ success: true, count: latestRows.length, data: latestRows }, null, 2));
    console.log('  ✓ latest.json');

    console.log(`\n✅ 导出完成 → ${OUT_DIR}`);
  } finally {
    await pool.end();
  }
}

exportData().catch(err => {
  console.error('❌ 导出失败:', err.message);
  process.exit(1);
});
