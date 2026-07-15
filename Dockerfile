# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
ENV CI=true
RUN pnpm install --frozen-lockfile --ignore-scripts

# 禁用 pnpm build 前的依赖检查，避免重复触发 prepare 脚本
RUN pnpm config set verify-deps-before-run false

COPY . .
RUN pnpm build

FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]