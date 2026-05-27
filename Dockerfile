# === Stage 1: Build Frontend ===
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# === Stage 2: Runtime ===
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./public
COPY backend/package.json ./
RUN npm install --production
COPY backend/ .

ENV STATIC_DIR=/app/public
EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health',r=>{process.exit(r.statusCode==200?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
