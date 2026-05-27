# AI Xray · 催化信号日报

[stock-news](https://github.com/lushi78778/stock-news) 采集管线的前端展示。数据预导出为静态 JSON，部署在 GitHub Pages。

👉 **在线地址**：`https://lushi78778.github.io/stock-news-web/news/`

## 项目结构

```
├── frontend/              # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx        # 主组件
│   │   ├── config.js      # 数据源配置（API / 静态 JSON）
│   │   └── main.jsx       # 入口
│   ├── public/data/       # 导出的静态 JSON 数据
│   ├── vite.config.js     # Vite 配置 (base: /news/)
│   └── index.html
├── backend/               # Node.js + Express API（本地/Docker 用）
│   ├── server.js
│   └── package.json
├── scripts/
│   ├── export-data.mjs    # MySQL → 静态 JSON 导出
│   └── news-export-push.sh # VPS 自动导出推送脚本
├── .github/workflows/
│   └── deploy.yml         # GitHub Pages 部署流水线
├── Dockerfile             # Docker 部署
├── nginx.conf
├── start.sh
└── .gitignore
```

## 部署

### GitHub Pages（当前）

数据预存在 `frontend/public/data/`，VPS 定时导出推送（每天 6:00 / 14:00 / 22:00），Actions 自动构建部署。

### Docker 本地跑

```bash
docker build -t news-frontend:latest .
docker run -d --name news-app --restart unless-stopped --network host \
  -e DB_HOST=127.0.0.1 -e DB_PORT=10086 \
  -e DB_USER=stock_app -e DB_PASSWORD=your_password -e DB_NAME=stock \
  news-frontend:latest
```

### 本地开发

```bash
cd frontend && npm install && npm run dev       # → :5173
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
| `STATIC_DIR` | `/app/public` | 静态文件目录 |

## API

| 路径 | 说明 |
|------|------|
| `GET /api/v2/news?date=YYYY-MM-DD` | 按日期获取信号事件 + 汇总 |
| `GET /api/v2/news` | 最近 50 条 |
| `GET /api/v2/themes` | 主题分类 + 历史日期 |
| `GET /api/health` | 健康检查 |

## 构建前端

```bash
cd frontend
npm ci
VITE_DATA_MODE=static npm run build
# → 输出到 frontend/dist/
```
