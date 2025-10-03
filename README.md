# RuleCheck

## 開発環境セットアップ概要
- バックエンド/フロントエンドの詳細はそれぞれ `backend/README.md` と `frontend/README.md`（存在する場合）を参照してください。
- バックエンドで Postgres を利用する場合の環境変数、コンテナ起動、マイグレーション手順は `backend/README.md` にまとめています。

### Postgres を使ったバックエンド初期化フロー（概要）
1. `.env.example` をコピーし、`GEMINI_API_KEY` や `DB_URL` を設定する。
2. `docker run --name rulecheck-postgres ... postgres:15` などで Postgres コンテナを起動する。
3. `python -c "from app.db import init_db; init_db()"` で SQLAlchemy の `Base.metadata.create_all` を実行する（FastAPI 起動時にも自動実行されます）。
4. `uvicorn app.main:app --reload` または `docker compose up` でバックエンドを起動する。

詳細なコマンド例は `backend/README.md` を参照してください。
