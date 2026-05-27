# 部署教程

## 第一步：开启 GitHub Pages

1. repo → **Settings** → **Pages**
2. **Build and deployment** → **Source** → 选 **GitHub Actions**
3. 关掉页面

## 第二步：配置 GitHub Secrets

1. repo → **Settings** → **Secrets and variables** → **Actions**
2. 点 **New repository secret**，添加这 5 个：

| Secret | 说明 |
|--------|------|
| `DB_HOST` | 服务器公网 IP |
| `DB_PORT` | `10086` |
| `DB_USER` | `gh_actions` |
| `DB_PASSWORD` | 专用账号密码 |
| `DB_NAME` | `stock` |

> 账号 `gh_actions` 已创建好，只有 `stock` 库的 SELECT 权限。
> Secrets 的值在 Actions 日志里会自动打码，不会泄漏。

## 第三步：触发部署

去 Actions 标签页点 **Run workflow**，或者随便 push 一次。

之后每次 push 到 main 都会自动：导出数据 → 构建 → 部署。

## 备份方案

VPS 上的自动推送 cron 还在（每天 6/14/22 点）：

```bash
# 手动触发
/opt/scripts/news-export-push.sh
```

## 访问地址

`https://lushi78778.github.io/stock-news-web/news/`
