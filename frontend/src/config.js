/**
 * 数据模式配置
 *
 * API 模式（默认，本地开发 / Docker 部署）：
 *   从 /api/v2/news?date=... 获取数据
 *
 * 静态模式（GitHub Pages）：
 *   从 /news/data/news-YYYY-MM-DD.json 读取预导出 JSON
 *
 * 切换方式：Vite 构建时通过环境变量设置
 *   VITE_DATA_MODE=static npm run build
 */

const MODE = import.meta.env.VITE_DATA_MODE || 'api';
const BASE = import.meta.env.VITE_BASE_URL || '/news';

export const IS_STATIC = MODE === 'static';

export function getNewsUrl(date) {
  if (IS_STATIC) {
    return `${BASE}/data/news-${date}.json`;
  }
  return `/api/v2/news?date=${date}`;
}

export function getLatestUrl() {
  if (IS_STATIC) {
    return `${BASE}/data/latest.json`;
  }
  return '/api/v2/news';
}

export function getThemesUrl() {
  if (IS_STATIC) {
    return `${BASE}/data/themes.json`;
  }
  return '/api/v2/themes';
}
