import os
from dataclasses import dataclass

try:
    # Optional: load .env if present
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except Exception:
    pass

@dataclass(frozen=True)
class DBConfig:
    host: str = os.getenv("DB_HOST", "localhost")
    port: int = int(os.getenv("DB_PORT", "3306"))
    user: str = os.getenv("DB_USER", "root")
    password: str = os.getenv("DB_PASSWORD", "password")
    database: str = os.getenv("DB_NAME", "gestos_db")

DB_CONFIG = DBConfig()

# App config
APP_HOST = os.getenv("APP_HOST", "127.0.0.1")
APP_PORT = int(os.getenv("APP_PORT", "5000"))
DEBUG = os.getenv("DEBUG", "true").lower() == "true"
