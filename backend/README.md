1. python -m venv .venv && source .venv/bin/activate
2. pip install -r requirements.txt
3. cp .env.example .env  # API_KEY を設定
4. uvicorn app.main:app --reload