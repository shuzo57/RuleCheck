# =======================================
# backend/Dockerfile
# FastAPI + SQLite 用のシンプルなDockerfile
# - 開発: uvicorn --reload
# - 本番: gunicorn(uvicorn workers)
#   ※ 本番/開発は環境変数 APP_ENV で分岐
# =======================================
FROM python:3.11-slim AS base

# システム依存パッケージ（必要なら追加）
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl && \
    rm -rf /var/lib/apt/lists/*

# 作業ディレクトリ
WORKDIR /app

# 依存はキャッシュを効かせるため先にコピー
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# アプリ本体をコピー
COPY backend /app

# ポート公開（FastAPI デフォルト）
EXPOSE 8000

# 既定の環境（dev or prod）
ENV APP_ENV=dev
# SQLite のデフォルト（必要に応じて .env で上書き）
ENV DB_URL=sqlite:///./local.db
ENV STORAGE_DIR=/app/storage

# ヘルスチェック（/health があれば）
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
  CMD curl -fsS http://127.0.0.1:8000/health || exit 1

# 起動コマンド：APP_ENVで分岐
# - dev : オートリロード
# - prod: ワーカー付き
CMD ["/bin/sh", "-lc", "\
  if [ \"$APP_ENV\" = \"prod\" ]; then \
    python -m gunicorn app.main:app -w 2 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000; \
  else \
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload; \
  fi \
"]
