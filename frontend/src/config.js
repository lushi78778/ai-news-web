const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export const IS_STATIC = false;

export function getNewsUrl(date) {
  return `${API_BASE}/v2/news?date=${encodeURIComponent(date)}`;
}

export function getLatestUrl() {
  return `${API_BASE}/v2/news`;
}

export function getThemesUrl() {
  return `${API_BASE}/v2/themes`;
}
