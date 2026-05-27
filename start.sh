#!/bin/bash
# 固化启动脚本 - 直接使用正确的DB密码
docker rm -f news-app 2>/dev/null
docker run -d \
  --name news-app \
  --restart unless-stopped \
  --network host \
  -e DB_HOST=127.0.0.1 \
  -e DB_PORT=10086 \
  -e DB_USER=stock_app \
  -e DB_PASSWORD=${DB_PASSWORD:?DB_PASSWORD not set} \
  -e DB_NAME=stock \
  news-frontend:latest
