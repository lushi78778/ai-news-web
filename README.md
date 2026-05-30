# AI News Web

AI Xray 的新闻催化看板，用来按日期浏览海外市场、AI、半导体、能源、宏观等方向的事件信号。

在线访问：

```text
https://news.xray.top
```

代码仓库：

```text
git@github.com:lushi78778/ai-news-web.git
```

## 功能

- 按日期查看新闻催化事件
- 展示事件方向、重要性、主题、事件类型、来源和相关 ticker
- 汇总当日事件数量、方向分布、主题分布和高影响事件数量
- 提供公开 JSON API，便于脚本、看板或其他前端调用
- API 带基础 CORS 响应和轻量限流
- 前端使用 React + Vite，后端接口使用 Vercel Functions 风格的 API 文件

## 页面

首页是完整看板，不做营销落地页。

主要交互：

- 日期切换
- 主题筛选
- 方向筛选
- 关键词搜索
- 事件卡片详情浏览
- 一键打开来源链接

## 架构

```text
Browser
  |
  | HTTPS
  v
React + Vite frontend
  |
  | /api/health
  | /api/v2/themes
  | /api/v2/news
  v
Serverless API
  |
  v
Data source
```

浏览器只调用 HTTP API，不直接接触服务端环境变量。

## 目录结构

```text
.
├── api/
│   ├── _db.js
│   ├── health.js
│   └── v2/
│       ├── news.js
│       └── themes.js
├── docs/
│   └── setup-guide.md
├── frontend/
│   ├── public/
│   │   └── data/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── config.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .env.example
├── package.json
├── vercel.json
└── README.md
```

## 本地开发

安装依赖：

```bash
npm install
npm --prefix frontend install
```

创建本地环境文件：

```bash
cp .env.example .env
```

按本机环境填写 `.env` 后启动：

```bash
npm run dev
```

常用本地入口：

```text
http://localhost:3000
http://localhost:3000/api/health
http://localhost:3000/api/v2/themes
http://localhost:3000/api/v2/news
http://localhost:3000/api/v2/news?date=2026-05-27
```

## 构建

执行生产构建：

```bash
npm run build
```

构建流程：

1. 安装 `frontend/` 依赖
2. 执行 Vite production build
3. 输出静态资源到 `frontend/dist`

## API

API 默认返回 JSON。

公共响应头：

```text
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

限流响应头：

```text
RateLimit-Limit: 60
RateLimit-Policy: 60;w=60
RateLimit-Remaining: <remaining>
RateLimit-Reset: 60
```

限流策略：

```text
每个 IP 60 秒内最多 60 次请求，滑动窗口统计。
```

### GET /api/health

健康检查。

示例：

```bash
curl https://news.xray.top/api/health
```

响应：

```json
{
  "status": "ok",
  "timestamp": "2026-05-27T12:35:16.302Z"
}
```

### GET /api/v2/themes

返回可用日期和主题列表。

示例：

```bash
curl https://news.xray.top/api/v2/themes
```

### GET /api/v2/news

返回最近 50 条可用新闻。

示例：

```bash
curl https://news.xray.top/api/v2/news
```

### GET /api/v2/news?date=YYYY-MM-DD

返回指定日期新闻。

示例：

```bash
curl 'https://news.xray.top/api/v2/news?date=2026-05-27'
```

响应字段：

| Field | Description |
| --- | --- |
| `success` | 请求是否成功 |
| `date` | 请求日期，未传日期时为 `null` |
| `count` | 返回事件数量 |
| `summary` | 统计摘要 |
| `data` | 新闻事件列表 |

