# Repository Guidelines

## Project Structure & Module Organization
- Root: `backend/` (FastAPI + SQLite), `frontend/` (React + Vite + TypeScript)
- Backend: `app/` 内に `api/`(ルート), `services/`(分析・pptx 解析), `core/`(設定)。`db.py`(エンジン/セッション), `models.py`(SQLAlchemy), `crud.py`(DB 操作), `storage/`(アップロード)。テストは `backend/tests/`、サンプルは `backend/tests/data/`。
- Frontend: `components/`, `services/`(API 呼び出し), `utils/`, `types.ts`。エントリは `index.tsx` / `App.tsx`。

## Build, Test, and Development Commands
- Backend 準備: 
  ```bash
  python -m venv .venv && source .venv/bin/activate
  pip install -r backend/requirements.txt
  cp backend/.env.example backend/.env  # GEMINI_API_KEY, DB_URL を設定
  cd backend && uvicorn app.main:app --reload  # http://127.0.0.1:8000
  ```
- Frontend 準備:
  ```bash
  cd frontend && npm install
  # frontend/.env に VITE_API_BASE=http://127.0.0.1:8000
  npm run dev  # http://localhost:5173
  ```
- テスト実行（目安）:
  - Backend: `pytest`（追加時）。
  - Frontend: `npm test`（追加時、RTL/Jest）。

## Coding Style & Naming Conventions
- Python: 4 スペース、型ヒント推奨、PEP8。モジュール/関数/変数は `snake_case`、クラスは `PascalCase`。
- React/TS: 関数コンポーネント。`components/` は `PascalCase`、関数/変数は `camelCase`、共有型は `types.ts`。
- フォーマット: 既定フォーマッタを使用。インポート整頓、関数は小さくテスト可能に。

## Testing Guidelines
- Backend: `backend/tests/` に `test_*.py`。`services/` と `crud` を優先的に単体テスト。サンプル資産は `backend/tests/data/`。
- Frontend: React Testing Library/Jest。テストはコンポーネント隣に `ComponentName.test.tsx`。
- 方針: 解析・検証・API 境界のユニットテストを重視。

## Commit & Pull Request Guidelines
- Commits: 短い命令形（JP/EN）。例: `ファイル一覧の表示を完了` / `Add analysis items patch route`。必要に応じてスコープ記載。
- PRs: 目的、主要変更、検証手順（コマンド・エンドポイント）、UI 変更はスクリーンショット/GIF、関連 Issue。小さく一貫性のある単位で。

## Security & Configuration Tips
- 秘密情報はコミットしない。Backend は `backend/.env` から `GEMINI_API_KEY`, `DB_URL`, `STORAGE_DIR` を読み込み。
- ローカル DB は `backend/local.db`（共有時は必要に応じ削除）。

## Language Policy
- すべてのコミュニケーションは日本語で行うこと。

