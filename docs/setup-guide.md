# 部署教程

## 第一步：开启 GitHub Pages

1. 打开 repo → **Settings**
2. 左侧导航选 **Pages**
3. **Build and deployment** → **Source** → 选 **GitHub Actions**
4. 不用其他配置，关掉页面

---

## 第二步：配置数据库连接（可选）

如果想让 GitHub Actions 每次构建时自动从 MySQL 拉取最新数据，需要配置 Secrets。

### 2a. 添加 Secrets

1. repo → **Settings** → **Secrets and variables** → **Actions**
2. 点 **New repository secret**，逐个添加：

| Secret 名称 | 值 | 示例 |
|---|---|---|
| `DB_HOST` | MySQL 公网 IP | `1.2.3.4` |
| `DB_PORT` | 端口 | `10086` |
| `DB_USER` | 用户名 | `stock_app` |
| `DB_PASSWORD` | 密码 | |
| `DB_NAME` | 数据库名 | `stock` |

### 2b. 让 MySQL 能被外网访问

GitHub Actions 的 runner 在 GitHub 的服务器上运行，你的 MySQL 是 `127.0.0.1`（本机），它连不上。

需要让 MySQL 监听公网地址：

**方法一：放开 VPS 防火墙 + MySQL 绑 0.0.0.0**

```bash
# 1. 查看 MySQL 当前绑定的地址
docker inspect $(docker ps --filter "name=mysql" -q) | grep 10086

# 2. 如果 MySQL 在宿主机上，修改 my.cnf 把 bind-address 改为 0.0.0.0
#    如果 MySQL 在 Docker 里，确保端口映射到 0.0.0.0

# 3. 开放防火墙（以 iptables / ufw 为例）
ufw allow from any to any port 10086 proto tcp

# 4. ⚠️ 安全建议：限制只允许 GitHub Actions 的 IP
#    GitHub Actions 使用这些 IP 范围：
#    https://api.github.com/meta  → 找 actions 字段
#    或直接用 Cloudflare Tunnel 更安全
```

**方法二：SSH 隧道（更安全）**

在 GitHub Actions 中通过 SSH 端口转发连接 VPS 的 MySQL：

```yaml
# 在 deploy.yml 的 export-data 步骤之前加上：
- name: Setup SSH tunnel
  run: |
    ssh -f -N -L 10086:127.0.0.1:10086 \
      -o StrictHostKeyChecking=no \
      user@your-vps-ip
```

但 SSH 密钥也需要存在 Secrets 里。

**方法三：用 TiDB Cloud（推荐，完全免费）**

如果不想暴露现有数据库，开一个 TiDB Cloud Serverless（MySQL 兼容，5GB 免费）：

1. 注册 [TiDB Cloud](https://tidbcloud.com/signup)
2. 创建 Serverless 集群，记下连接信息
3. 把 stock-news 数据导入 TiDB（用 mysqldump 或直接在 VPS 上跑迁移脚本）
4. 把 TiDB 的连接信息填入 GitHub Secrets
5. `stock-news` 的采集管线照常跑本地 MySQL，TiDB 只给 Pages 用

---

## 第三步：触发部署

有数据的两种方式：

**方式 A：VPS 自动推送（已配置好，不需要 Secrets）**

你的 VPS 上已经有 cron（每天 6/14/22 点）自动运行：

```bash
# 手动也可以
/opt/scripts/news-export-push.sh
```

推送数据后 GitHub Actions 自动构建部署。

**方式 B：Actions 直连数据库（需要先配置 Secrets + 暴露 MySQL）**

直接 push 到 main，或者去 Actions 标签页点 **Run workflow**。

---

## 常见问题

**Q: Secrets 在日志里会泄漏吗？**
不会。GitHub 自动把 Secrets 值打码为 `***`，日志里看不到原文。

**Q: 纯前端能直连 MySQL 吗？**
不能。浏览器端 JS 无法连接 MySQL。必须通过后端或预导出 JSON。

**Q: 数据多久更新一次？**
取决于配置：
- 方式 A：每天 3 次（6/14/22 点 VPS cron）
- 方式 B：每次 push 或手动触发

**Q: 部署完后访问地址是？**
`https://lushi78778.github.io/stock-news-web/news/`
