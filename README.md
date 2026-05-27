# AI News Web

AI Xray 的实时新闻催化看板。

这是一个部署在 Vercel 的全栈 Web 应用：前端负责展示，后端 API 运行在 Vercel Functions 中，并实时读取 MySQL 数据库。

正式访问地址：

```text
https://news.xray.top
```

默认 Vercel 地址：

```text
https://ai-news-web-pi.vercel.app
```

代码仓库：

```text
git@github.com:lushi78778/ai-news-web.git
```

## 功能

- 实时读取 MySQL 中的新闻催化事件
- 按日期查看事件列表
- 展示方向、重要性、主题、事件类型、来源、相关 ticker
- 展示当日统计摘要：总数、看多、看空、中性、高影响事件
- 公开 API，允许任意站点调用
- API 内置 60 秒 60 次的 IP 滑动窗口限流
- 自定义域名 `news.xray.top`
- Vercel Functions 部署区域设置为香港 `hkg1`

## 架构

```text
Browser
  |
  | HTTPS
  v
Vercel CDN
  |
  | static assets
  v
React + Vite frontend
  |
  | /api/v2/news, /api/v2/themes
  v
Vercel Functions (hkg1)
  |
  | mysql2
  v
MySQL
```

数据库连接只发生在 Vercel Functions 服务端。浏览器不会拿到数据库密码。

## 目录结构

```text
.
├── api/
│   ├── _db.js              # MySQL pool、CORS、限流、JSON helper
│   ├── health.js           # GET /api/health
│   └── v2/
│       ├── news.js         # GET /api/v2/news
│       └── themes.js       # GET /api/v2/themes
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── config.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── .github/workflows/
│   └── tag-build.yml       # tag 构建校验
├── .env.example
├── package.json
├── vercel.json
└── README.md
```

## 数据库

当前生产数据库配置：

```text
DB_HOST=124.174.91.206
DB_PORT=10086
DB_USER=gh_actions
DB_NAME=stock
```

`DB_PASSWORD` 只放在本地 `.env` 和 Vercel Environment Variables 中，不提交到 Git。

数据库账号建议保持只读权限。

## 本地开发

安装根依赖和前端依赖：

```bash
npm install
npm --prefix frontend install
```

创建本地环境变量：

```bash
cp .env.example .env
```

填写 `.env`：

```env
DB_HOST=124.174.91.206
DB_PORT=10086
DB_USER=gh_actions
DB_PASSWORD=
DB_NAME=stock
```

启动本地 Vercel 开发环境：

```bash
npm run dev
```

本地开发入口通常是：

```text
http://localhost:3000
```

本地 API：

```text
http://localhost:3000/api/health
http://localhost:3000/api/v2/themes
http://localhost:3000/api/v2/news
http://localhost:3000/api/v2/news?date=2026-05-27
```

## 构建

```bash
npm run build
```

构建过程会：

1. 在 `frontend/` 中执行 `npm ci`
2. 执行 Vite production build
3. 输出到 `frontend/dist`

Vercel 使用 `vercel.json` 中的配置：

```json
{
  "regions": ["hkg1"],
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/dist"
}
```

## 部署

项目已经连接 Vercel 和 GitHub。

普通发布流程：

```bash
git push origin main
```

Vercel 会自动部署 `main` 分支到生产环境。

生产环境变量在 Vercel 项目中配置：

| Name | Value |
| --- | --- |
| `DB_HOST` | `124.174.91.206` |
| `DB_PORT` | `10086` |
| `DB_USER` | `gh_actions` |
| `DB_PASSWORD` | 数据库密码 |
| `DB_NAME` | `stock` |

## 自定义域名

Cloudflare DNS：

```text
Type: A
Name: news
IPv4 address: 76.76.21.21
Proxy status: DNS only
TTL: Auto
```

Vercel 项目已绑定：

```text
news.xray.top
```

## API

API 默认公开，可被任意 Origin 调用。

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

当前实现使用 Vercel Function 实例内存保存滑动窗口。它适合轻量公开 API；如果未来需要严格的全局限流，应改为 Upstash Redis、Vercel KV 或其他共享存储。

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

## Release 流程

打 tag：

```bash
git tag -a v2.0 -m "v2.0"
git push origin v2.0
```

推送 `v*` tag 后，GitHub Actions 会自动触发 `Tag Build` workflow，执行：

```bash
npm ci
npm run build
```

发布 GitHub Release：

```bash
gh release create v2.0 --title "v2.0 - First stable release" --notes-file RELEASE_NOTES.md
```

## Vercel 费用和区域说明

当前项目可以运行在 Vercel Hobby 计划上。Hobby 是免费层，但仅适用于个人/非商业用途，并有每月资源限制。

Vercel Functions 默认区域是 `iad1`，也就是 Washington, D.C., USA。本项目已在 `vercel.json` 中设置：

```json
{
  "regions": ["hkg1"]
}
```

`hkg1` 是 Vercel 的 Hong Kong 区域，更靠近中国大陆用户和当前数据库。

静态文件由 Vercel CDN 就近分发；API 函数在 `hkg1` 执行。
