from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv(Path(__file__).resolve().parents[2] / ".env")
API_KEY: str = os.getenv("API_KEY") or ""
if not API_KEY:
    raise RuntimeError("API_KEY is not set")