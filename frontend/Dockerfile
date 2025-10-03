# =======================================
# frontend/Dockerfile
# マルチステージビルド
# - dev: Vite開発サーバでホットリロード
# - prod: Nginx でビルド成果物を配信
#   STAGE=dev / prod で動作を切替
# =======================================

# ---------- 共通: 依存インストール ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci

# ---------- dev 用 ----------
FROM deps AS dev
WORKDIR /app
COPY frontend ./
# Vite は 5173 を使う
EXPOSE 5173
# 環境変数（Viteは*.envで上書き可）
ENV VITE_API_BASE=http://127.0.0.1:8000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ---------- prod 用（ビルド） ----------
FROM deps AS build
WORKDIR /app
COPY frontend ./
# 本番ビルド時のAPIエンドポイントはビルド時に固定される点に注意
# 例: docker build arg で差し替え（compose で渡す）
ARG VITE_API_BASE=http://127.0.0.1:8000
ENV VITE_API_BASE=${VITE_API_BASE}
RUN npm run build

# ---------- prod 配信用（Nginx） ----------
FROM nginx:alpine AS prod
# dist を Nginx 公開ディレクトリへ
COPY --from=build /app/dist /usr/share/nginx/html
# 必要なら独自の nginx.conf を COPY
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
