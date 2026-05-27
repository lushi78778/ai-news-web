import React, { useState, useEffect, useCallback } from 'react';
import { getNewsUrl, IS_STATIC } from './config';

const DIRECTION_COLORS = {
  positive: 'bg-green-500/10 text-green-400 border-green-500/30',
  negative: 'bg-red-500/10 text-red-400 border-red-500/30',
  neutral: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};
const DIRECTION_LABELS = { positive: '看多 ▲', negative: '看空 ▼', neutral: '中性 —' };

function DirectionBadge({ direction }) {
  const cls = DIRECTION_COLORS[direction] || DIRECTION_COLORS.neutral;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {DIRECTION_LABELS[direction] || direction}
    </span>
  );
}

function ImportanceBadge({ importance }) {
  if (!importance || importance === 0) return null;
  const colors = ['', 'bg-blue-500/10 text-blue-400', 'bg-blue-500/20 text-blue-300', 'bg-amber-500/20 text-amber-300', 'bg-orange-500/30 text-orange-200', 'bg-red-500/30 text-red-200'];
  const c = colors[Math.min(importance, 5)];
  return <span className={`${c} px-2 py-0.5 rounded text-xs font-bold`}>{'★'.repeat(Math.min(importance, 5))}</span>;
}

function NewsCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const summaryShort = item.summary ? item.summary.slice(0, 120) : '';

  return (
    <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-200 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-base font-semibold text-gray-100 leading-snug flex-1">{item.title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          <ImportanceBadge importance={item.importance} />
          <DirectionBadge direction={item.direction} />
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
        {item.external_theme && (
          <span className="inline-flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
            {item.external_theme}
          </span>
        )}
        {item.event_type && (
          <span className="inline-flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            {item.event_type}
          </span>
        )}
        {item.event_time_utc8 && (
          <span className="inline-flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {item.event_time_utc8}
            <span className="text-gray-600 ml-1">(北京时间)</span>
          </span>
        )}
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-400 leading-relaxed">
        {expanded ? item.summary : `${summaryShort}${item.summary && item.summary.length > 120 ? '...' : ''}`}
        {item.summary && item.summary.length > 120 && (
          <button onClick={() => setExpanded(!expanded)} className="ml-1 text-blue-400 hover:text-blue-300 text-xs">
            {expanded ? '收起' : '展开'}
          </button>
        )}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {item.source && (
            <span className="inline-flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              {item.source}
            </span>
          )}
          {item.mentioned_tickers && (
            <span className="text-blue-400/70">{item.mentioned_tickers}</span>
          )}
        </div>
        {item.source_url && (
          <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs inline-flex items-center gap-1">
            原文
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        )}
      </div>
    </div>
  );
}

function SummaryPanel({ summary }) {
  if (!summary) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-4 text-center">
        <div className="text-2xl font-bold text-gray-100">{summary.total}</div>
        <div className="text-xs text-gray-500 mt-1">事件总数</div>
      </div>
      <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-4 text-center">
        <div className="text-2xl font-bold text-green-400">{(summary.by_direction?.positive) || 0}</div>
        <div className="text-xs text-gray-500 mt-1">看多</div>
      </div>
      <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-4 text-center">
        <div className="text-2xl font-bold text-red-400">{(summary.by_direction?.negative) || 0}</div>
        <div className="text-xs text-gray-500 mt-1">看空</div>
      </div>
      <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-4 text-center">
        <div className="text-2xl font-bold text-amber-400">{summary.high_impact}</div>
        <div className="text-xs text-gray-500 mt-1">高影响 ≥3</div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1,2,3].map(i => (
        <div key={i} className="bg-gray-900/50 rounded-xl border border-gray-800 p-5 animate-pulse">
          <div className="h-5 bg-gray-800 rounded w-3/4 mb-3"></div>
          <div className="h-3 bg-gray-800 rounded w-1/4 mb-3"></div>
          <div className="h-4 bg-gray-800 rounded w-full mb-1"></div>
          <div className="h-4 bg-gray-800 rounded w-5/6"></div>
        </div>
      ))}
    </div>
  );
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function DateNav({ currentDate, onDateChange, availableDates }) {
  const goDay = (offset) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + offset);
    onDateChange(formatDate(d));
  };

  const goToday = () => onDateChange(formatDate(new Date()));

  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      <button onClick={() => goDay(-1)} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>

      <div className="flex items-center gap-2">
        <button onClick={goToday} className="px-3 py-1.5 text-xs font-medium bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">今天</button>
        <div className="relative">
          <input
            type="date"
            value={currentDate}
            onChange={e => onDateChange(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 appearance-none"
          />
        </div>
      </div>

      <button onClick={() => goDay(1)} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
}

function App() {
  const today = formatDate(new Date());
  const [date, setDate] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNews = useCallback(async (d) => {
    setLoading(true);
    setError(null);
    try {
      const url = getNewsUrl(d);
      const res = await fetch(url);
      if (!res.ok) {
        if (IS_STATIC) throw new Error(`该日期无数据 (${d})`);
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!IS_STATIC && !json.success) throw new Error(json.error || 'Unknown error');
      setData(json);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(date);
  }, [date, fetchNews]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📡</span>
            <div>
              <h1 className="text-lg font-bold text-gray-100">AI Xray</h1>
              <p className="text-xs text-gray-500">催化信号日报</p>
            </div>
          </div>
          {data && !loading && (
            <div className="text-xs text-gray-500">
              更新于 {new Date().toLocaleTimeString('zh-CN', { hour12: false })}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Date Navigation */}
        <DateNav currentDate={date} onDateChange={setDate} />

        {/* Summary */}
        {data?.summary && <SummaryPanel summary={data.summary} />}

        {/* Theme tags */}
        {data?.summary?.by_theme && Object.keys(data.summary.by_theme).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(data.summary.by_theme).map(([theme, count]) => (
              <span key={theme} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800/50 rounded-full text-xs text-gray-400 border border-gray-700/50">
                {theme}
                <span className="text-gray-500 font-bold">{count}</span>
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        {loading && <LoadingSkeleton />}

        {error && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-gray-400 mb-4">{error}</p>
            <button onClick={() => fetchNews(date)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors">
              重试
            </button>
          </div>
        )}

        {!loading && !error && data?.data?.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-gray-400">{date} 没有信号事件</p>
          </div>
        )}

        {!loading && !error && data?.data?.length > 0 && (
          <div className="space-y-4">
            {data.data.map(item => (
              <NewsCard key={item.event_id} item={item} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800 mt-12 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-gray-600">
          AI Xray · 数据仅供参考，不构成投资建议
        </div>
      </footer>
    </div>
  );
}

export default App;
