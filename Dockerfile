FROM node:18-slim AS builder

WORKDIR /app

# 安装 OpenSSL（Prisma 引擎依赖）
RUN apt-get update && apt-get install -y \
    openssl \
    libssl-dev \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 复制 package 文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装所有依赖（包括 devDependencies，用于构建）
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm ci

# 生成 Prisma Client
RUN npx prisma generate

# 复制源码并构建
COPY . .
RUN npm run build

# ─── 运行阶段 ────────────────────────────────────────────────────────────────
FROM node:18-slim AS runner

# 安装 Chromium、CJK 字体和 OpenSSL（Prisma 运行时依赖）
RUN apt-get update && apt-get install -y \
    openssl \
    chromium \
    fonts-noto-cjk \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROMIUM_PATH=/usr/bin/chromium
ENV MAX_CONCURRENT_RENDERS=2
ENV BROWSER_IDLE_TIMEOUT_MS=300000

# 复制完整的 node_modules（包含 prisma、@prisma/client 等运行时依赖）
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 复制 standalone 输出（会覆盖 node_modules 中的部分文件，但 standalone 版本更优化）
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# 复制 scripts 目录（用于初始化脚本）
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
