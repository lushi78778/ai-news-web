# Vercel 部署说明

1. 在 Vercel 导入 `lushi78778/ai-news-web`
2. Framework 选择 Vite 或让 Vercel 自动识别
3. 添加环境变量：

| Name | Value |
| --- | --- |
| `DB_HOST` | `ai.xray.top` |
| `DB_PORT` | `10086` |
| `DB_USER` | `gh_actions` |
| `DB_PASSWORD` | 数据库密码 |
| `DB_NAME` | `stock` |

4. Deploy

部署后访问 Vercel 分配的域名即可，页面会通过 `/api/v2/news` 实时读取数据库。
