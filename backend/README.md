# Backend

FastAPI で実装したシンプルなメッセージ管理 API です。メッセージの登録・一覧取得・削除を提供します。

## ローカル実行手順

1. `python -m venv .venv && source .venv/bin/activate`
2. `pip install -r requirements.txt`
3. `uvicorn app.main:app --reload`

デフォルトではリポジトリ直下に `local.db` (SQLite) が作成されます。`DB_URL` 環境変数を指定することで他のデータベースに接続できます。

## 提供エンドポイント

- `GET /health` - 動作確認用
- `GET /messages` - すべてのメッセージを作成日時の昇順で取得
- `POST /messages` - 新しいメッセージを登録
- `DELETE /messages/{id}` - 指定したメッセージを削除
