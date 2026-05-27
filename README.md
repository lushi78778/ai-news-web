# AI Xray · 催化信号日报

[stock-news](https://github.com/lushi78778/stock-news) 采集管线的前端展示。数据预导出为静态 JSON，部署在 GitHub Pages。

👉 **在线地址**：`https://lushi78778.github.io/stock-news-web/news/`

## 项目结构

```
├── frontend/                  # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx            # 主组件
│   │   ├── config.js          # 数据源切换（API / 静态 JSON）
│   │   └── main.jsx
│   ├── public/data/           # 导出的静态 JSON 数据
│   └── vite.config.js         # base: /news/
├── backend/                   # Node.js + Express API
│   ├── server.js
│   └── package.json
├── scripts/
│   ├── export-data.mjs        # MySQL → 静态 JSON 导出
│   └── news-export-push.sh    # VPS 自动导出推送
├── .github/workflows/
│   └── deploy.yml             # GitHub Pages 部署流水线
├── docs/
│   └── setup-guide.md         # 部署教程（Secrets 配置等）
├── Dockerfile
├── nginx.conf
└── start.sh
```

## 部署

详见 [docs/setup-guide.md](docs/setup-guide.md)

## 本地开发

```bash
cd frontend && npm install && npm run dev       # http://localhost:5173/news/
cd backend  && npm install && DB_PASSWORD=*** node server.js
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3001` | 后端端口 |
| `DB_HOST` | `127.0.0.1` | MySQL 地址 |
| `DB_PORT` | `10086` | MySQL 端口 |
| `DB_USER` | `root` | MySQL 用户 |
| `DB_PASSWORD` | — | MySQL 密码 |
| `DB_NAME` | `news` | 数据库名 |

## API

| 路径 | 说明 |
|------|------|
| `GET /api/v2/news?date=YYYY-MM-DD` | 按日期获取信号 + 汇总 |
| `GET /api/v2/news` | 最近 50 条 |
| `GET /api/v2/themes` | 主题分类 + 历史日期 |
| `GET /api/health` | 健康检查 |
