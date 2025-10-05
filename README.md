# Message Board Sample

FastAPI と React で構成された最小限のメッセージ管理アプリケーションです。テキストを登録すると、これまでに登録したメッセージが時系列（昇順）で一覧表示され、各メッセージは削除ボタンからデータベースから取り除くことができます。

## システム構成

- **backend/**: FastAPI + SQLAlchemy による REST API。SQLite をデフォルトで利用。
- **frontend/**: React + Vite によるシングルページアプリケーション。

## 起動方法

### 1. バックエンド
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload
```

### 2. フロントエンド
```bash
cd frontend
npm install
npm run dev
```

必要に応じて `frontend/.env` に `VITE_API_BASE` を設定してください（デフォルトは `http://localhost:8000`）。
