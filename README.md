# AI Xray · 催化信号日报前端

新闻信号的结构化展示前端，配套 [stock-news](https://github.com/lushi78778/stock-news) 采集管线使用。

## 项目结构

```
├── frontend/              # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx        # 主组件：日期导航 + 新闻卡片 + 汇总面板
│   │   ├── config.js      # 数据源配置（API / 静态 JSON 切换）
│   │   ├── main.jsx       # 入口
│   │   └── index.css      # Tailwind 样式
│   ├── vite.config.js     # Vite 配置 (base: /news/)
│   └── index.html
├── backend/               # Node.js + Express API
│   ├── server.js          # API 路由 + MySQL 连接 + 静态文件服务
│   └── package.json
├── scripts/               # 工具脚本
│   └── export-data.mjs    # MySQL → 静态 JSON 导出（GH Pages 用）
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Pages 部署流水线
├── Dockerfile             # 多阶段构建 (build frontend → runtime)
├── nginx.conf             # SPA + API 反向代理
├── start.sh               # Docker 启动脚本
└── .gitignore
```

## 环境变量

### 后端（Docker / 本地运行）

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3001` | 后端监听端口 |
| `DB_HOST` | `127.0.0.1` | MySQL 地址 |
| `DB_PORT` | `10086` | MySQL 端口 |
| `DB_USER` | `root` | MySQL 用户 |
| `DB_PASSWORD` | *(必填)* | MySQL 密码 |
| `DB_NAME` | `news` | 数据库名 |
| `STATIC_DIR` | `/app/public` | 前端静态文件目录 |

### 构建（GitHub Pages）

| 变量 | 说明 |
|------|------|
| `VITE_DATA_MODE=static` | 切换到静态 JSON 数据模式 |
| `DB_*` | （Actions Secrets）MySQL 连接信息，用于导出数据 |

## GitHub Pages 部署

GitHub Pages 只能服务静态文件，无法运行后端或直连 MySQL。
本项目的解决方案：**将数据库数据预导出为静态 JSON 文件**，前端直接读取。

### 方案一：VPS 导出 + Actions 构建

1. 在你的 VPS（有 MySQL 访问权限）上定时运行数据导出脚本：

```bash
DB_PASSWORD=... node scripts/export-data.mjs
```

脚本会在 `frontend/public/data/` 下生成 `news-YYYY-MM-DD.json`、`dates.json`、`themes.json`、`latest.json`。

2. 提交并推送 data 文件到 GitHub：

```bash
git add frontend/public/data/
git commit -m "data: 更新新闻数据"
git push
```

3. GitHub Actions 自动构建并部署到 Pages → `https://你的用户名.github.io/stock-news-web/news/`

### 方案二：Actions 直连云数据库

如果你的 MySQL 公开可访问（或使用 TiDB Cloud 免费 tier），在 repo Settings → Secrets and Variables → Actions 设置：

| Secret | 说明 |
|--------|------|
| `DB_HOST` | 数据库公网地址 |
| `DB_PORT` | 端口 |
| `DB_USER` | 用户名 |
| `DB_PASSWORD` | 密码 |
| `DB_NAME` | 数据库名 |

之后 push 到 main 时，Actions 会自动导出数据 → 构建 → 部署。

### 方案三：TiDB Cloud（推荐，免费）

[TiDB Cloud Serverless](https://tidbcloud.com/signup) 提供 5GB 免费 MySQL 兼容数据库：

1. 注册 TiDB Cloud，创建 Serverless 集群
2. 将 stock-news 数据导入 TiDB
3. 在 GitHub Secrets 填入 TiDB 连接信息
4. push 即自动部署

## 快速开始

### 前置条件

- MySQL 实例（默认端口 10086），需包含 `stock.external_catalyst_event` 表
- Docker（推荐）或 Node.js 20+

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
