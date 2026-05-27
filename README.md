# AI Xray · 催化信号日报前端

新闻信号的结构化展示前端，配套 [stock-news](https://github.com/lushi78778/stock-news) 采集管线使用。

## 项目结构

```
├── frontend/              # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx        # 主组件：日期导航 + 新闻卡片 + 汇总面板
│   │   ├── main.jsx       # 入口
│   │   └── index.css      # Tailwind 样式
│   ├── vite.config.js     # Vite 配置 (base: /news/)
│   └── index.html
├── backend/               # Node.js + Express API
│   ├── server.js          # API 路由 + MySQL 连接 + 静态文件服务
│   └── package.json
├── Dockerfile             # 多阶段构建 (build frontend → runtime)
├── nginx.conf             # SPA + API 反向代理
├── start.sh               # Docker 启动脚本
└── .gitignore
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3001` | 后端监听端口 |
| `DB_HOST` | `127.0.0.1` | MySQL 地址 |
| `DB_PORT` | `10086` | MySQL 端口 |
| `DB_USER` | `root` | MySQL 用户 |
| `DB_PASSWORD` | *(必填)* | MySQL 密码 |
| `DB_NAME` | `news` | 数据库名 |
| `STATIC_DIR` | `/app/public` | 前端静态文件目录 |

## 快速开始

### 前置条件

- MySQL 实例（默认端口 10086），需包含 `stock.external_catalyst_event` 表
- Docker（推荐）或 Node.js 20+

### Docker 部署

```bash
# 构建
docker build -t news-frontend:latest .

# 启动（用实际密码替换）
docker run -d \
  --name news-app \
  --restart unless-stopped \
  --network host \
  -e DB_HOST=127.0.0.1 \
  -e DB_PORT=10086 \
  -e DB_USER=stock_app \
  -e DB_PASSWORD=your_password_here \
  -e DB_NAME=stock \
  news-frontend:latest
```

访问 `http://<host>:3001/news/`

### 本地开发

```bash
# 前端
cd frontend
npm install
npm run dev     # 默认 http://localhost:5173/news/

# 后端（另一个终端）
cd backend
npm install
DB_PASSWORD=your_password node server.js
```

## API

| 路径 | 说明 |
|------|------|
| `GET /api/v2/news?date=YYYY-MM-DD` | 按日期获取信号事件，含汇总统计 |
| `GET /api/v2/news` | 获取最近 50 条信号 |
| `GET /api/v2/themes` | 获取主题分类及历史日期分布 |
| `GET /api/health` | 健康检查 |

### 新闻 API 返回格式

```json
{
  "success": true,
  "date": "2026-05-27",
  "count": 12,
  "summary": {
    "total": 12,
    "by_direction": { "positive": 5, "negative": 3, "neutral": 4 },
    "by_theme": { "AI_HARDWARE": 3, "SEMICONDUCTOR": 2 },
    "high_impact": 2
  },
  "data": [
    {
      "event_id": 1,
      "title": "…",
      "summary": "…",
      "direction": "positive",
      "importance": 4,
      "external_theme": "AI_HARDWARE",
      "event_type": "product",
      "source": "Reuters",
      "source_url": "https://…",
      "event_time_utc8": "2026-05-27 10:30:00",
      "mentioned_tickers": "NVDA, AMD"
    }
  ]
}
```
