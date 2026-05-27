# AI News Web

实时新闻催化看板，部署在 Vercel。

前端是 React + Vite，后端是 Vercel Functions，API 在服务端连接 MySQL。浏览器不会拿到数据库密码。

## 线上结构

```text
Vercel
├── frontend/        React 页面
└── api/             Serverless API，实时查询 MySQL
```

数据源：

```text
ai.xray.top:10086 / stock
```

目标仓库：

```text
git@github.com:lushi78778/ai-news-web.git
```

## 本地开发

1. 安装依赖

```bash
npm install
npm --prefix frontend install
```

2. 准备环境变量

```bash
cp .env.example .env
```

`.env`：

```env
DB_HOST=ai.xray.top
DB_PORT=10086
DB_USER=gh_actions
DB_PASSWORD=
DB_NAME=stock
```

3. 启动 Vercel 本地开发

```bash
npm run dev
```

如果本机没有 Vercel CLI：

```bash
npm i -g vercel
```

然后打开 Vercel dev 给出的本地地址，通常是：

```text
http://localhost:3000/
```

## 部署到 Vercel

在 Vercel 新建项目，导入：

```text
lushi78778/ai-news-web
```

环境变量填：

| Name | Value |
| --- | --- |
| `DB_HOST` | `ai.xray.top` |
| `DB_PORT` | `10086` |
| `DB_USER` | `gh_actions` |
| `DB_PASSWORD` | 数据库密码 |
| `DB_NAME` | `stock` |

Vercel 构建设置保持默认即可，项目里已经有 `vercel.json`：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/dist"
}
```

## API

API 默认公开，可被任意站点调用。

响应头包含：

```text
Access-Control-Allow-Origin: *
RateLimit-Limit: 60
RateLimit-Policy: 60;w=60
```

限流策略：

```text
每个 IP 60 秒内最多 60 次请求，滑动窗口统计。
```

| Route | Description |
| --- | --- |
| `GET /api/health` | 健康检查 |
| `GET /api/v2/news` | 最近 50 条新闻 |
| `GET /api/v2/news?date=YYYY-MM-DD` | 指定日期新闻 |
| `GET /api/v2/themes` | 日期列表和主题列表 |

## 为什么不用 GitHub Pages

GitHub Pages 只能托管静态文件，不能安全也不能直接连接 MySQL。

这个项目改用 Vercel 后，前端仍然是静态页面，但 `/api/*` 会在 Vercel 服务端执行，因此可以实时查询数据库，并且不会把数据库密码暴露给浏览器。
