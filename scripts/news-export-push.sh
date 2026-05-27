#!/bin/bash
# 导出新闻数据 → commit → push 到 GitHub
# 用于 GitHub Pages 自动更新数据
#
# 添加到 cron（例如每 8 小时）：
#   0 6,14,22 * * * /opt/scripts/news-export-push.sh >> /var/log/news-export-push.log 2>&1

set -e

REPO_DIR="/opt/news-frontend"
LOG_TAG="[news-export]"

echo "$(date) $LOG_TAG 开始导出"

cd "$REPO_DIR"

git fetch origin main
git reset --hard origin/main

DB_USER=stock_app \
DB_PASSWORD='mL_Tkc…AYA' \
DB_NAME=stock \
node scripts/export-data.mjs

# 检查是否有数据变更
if git diff --quiet -- frontend/public/data/; then
  echo "$(date) $LOG_TAG 数据无变更，跳过"
  exit 0
fi

git add -A frontend/public/data/
git commit -m "data: 自动更新新闻数据 $(date +%Y-%m-%d_%H:%M)"

# retry push up to 3 times
for i in 1 2 3; do
  if git push origin main 2>&1; then
    echo "$(date) $LOG_TAG 推送成功"
    exit 0
  fi
  echo "$(date) $LOG_TAG 推送失败(第${i}次)，等待重试..."
  sleep 5
done

echo "$(date) $LOG_TAG 推送失败，已达最大重试次数"
exit 1
