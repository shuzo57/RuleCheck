# Backend セットアップガイド

## 1. 依存関係のインストール
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

## 2. 環境変数を設定する
`.env.example` をコピーして必要な値を設定します。
```bash
cp .env.example .env
```

主な環境変数例（Postgres 利用時）
```
GEMINI_API_KEY="your-gemini-api-key"
DB_URL="postgresql+psycopg://rulecheck:secret@localhost:5432/rulecheck"
STORAGE_DIR="./app/storage"
# 任意: Postgres コンテナ起動時に使用する補助変数
POSTGRES_DB="rulecheck"
POSTGRES_USER="rulecheck"
POSTGRES_PASSWORD="secret"
```

## 3. Postgres コンテナを起動する
ローカルで簡単に試す場合は、次のように公式イメージからコンテナを立ち上げます。
```bash
docker run --name rulecheck-postgres \
  -e POSTGRES_DB=rulecheck \
  -e POSTGRES_USER=rulecheck \
  -e POSTGRES_PASSWORD=secret \
  -p 5432:5432 \
  -d postgres:15
```
すでにコンテナがある場合は `docker start rulecheck-postgres` で再利用できます。

### Docker Compose を使う場合
以下のような追加ファイル（例: `docker-compose.postgres.yml`）を用意すると、Postgres も含めて一度に起動できます。
```yaml
services:
  postgres:
    image: postgres:15
    container_name: rulecheck-postgres
    environment:
      POSTGRES_DB: rulecheck
      POSTGRES_USER: rulecheck
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"
```
作成したら次のコマンドで API/フロント/DB を同時に立ち上げます。
```bash
docker compose -f docker-compose.yml -f docker-compose.postgres.yml up --build
```
`.env` の `DB_URL` は Compose ネットワーク内のホスト名に合わせて `postgresql+psycopg://rulecheck:secret@postgres:5432/rulecheck` のように設定してください。

## 4. データベースの初期化・マイグレーション
テーブル定義は `app.models` にまとめられており、`app.db.init_db` が `Base.metadata.create_all` を呼び出します。バックエンドを起動すると FastAPI の `startup` イベントで自動的に実行されます。

手動で初期化したい場合は、仮想環境を有効化した状態で次のコマンドを実行してください。
```bash
python -c "from app.db import init_db; init_db()"
```
既存テーブルにカラムを追加する軽量マイグレーションも `init_db()` 内で行われます（例: `analysis_items` への `correction_type` 追加）。
既定の環境変数をそのまま使う場合、Postgres コンテナ起動時に `POSTGRES_DB` で指定したデータベースが自動で作成されます。名前を変更したり追加でデータベースを用意したい場合は、次のように `createdb` コマンドを実行してください。
```bash
docker exec -it rulecheck-postgres createdb -U rulecheck rulecheck
```

## 5. アプリケーションの起動
ローカル環境では次のコマンドで FastAPI を起動します。
```bash
uvicorn app.main:app --reload
```
Docker Compose を利用している場合は `docker compose up` の時点で API が 8000 番ポートで待ち受けます。
