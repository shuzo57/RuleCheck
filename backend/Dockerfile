# backend/Dockerfile
FROM python:3.11-slim

# 依存の最小化 & 非root
RUN apt-get update && apt-get install -y --no-install-recommends build-essential \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# 依存のみ先にコピー（キャッシュ効かせる）
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ソース
COPY backend/ ./

# Cloud Run は可変 $PORT を使う（デフォルト8080）
ENV PORT=8080
# 書き込みは /tmp を推奨（永続化が必要なら Cloud Storage を使う）
ENV STORAGE_DIR=/tmp

# 非rootユーザーで実行
RUN useradd -m appuser
USER appuser

# EXPOSE は任意（メモ用）
EXPOSE 8080

# 本番は gunicorn、開発は uvicorn を使い分けたいなら env で切替
# ただし本番イメージは gunicorn 固定の方が安全
CMD ["bash","-lc","python -m gunicorn app.main:app -w 2 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:${PORT}"]
