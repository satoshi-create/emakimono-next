"""Google API authentication helpers."""

from __future__ import annotations

import base64
import json
import os
import sys
from pathlib import Path

from google.oauth2 import service_account

from _paths import REPO_ROOT

SCOPES = [
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/webmasters.readonly",
]

try:
    from dotenv import load_dotenv

    load_dotenv(REPO_ROOT / ".env.local")
except ImportError:
    pass


def load_credentials_json() -> dict:
    b64 = os.environ.get("GOOGLE_CREDENTIALS_BASE64", "").strip()
    if b64:
        return json.loads(base64.b64decode(b64).decode("ascii"))

    path = os.environ.get("GOOGLE_CREDENTIALS_PATH", "").strip()
    if path:
        return json.loads(Path(path).read_text(encoding="utf-8"))

    raise SystemExit(
        "Missing credentials. Set GOOGLE_CREDENTIALS_BASE64 or GOOGLE_CREDENTIALS_PATH in .env.local"
    )


def get_credentials():
    info = load_credentials_json()
    return service_account.Credentials.from_service_account_info(info, scopes=SCOPES)


def require_env(*names: str) -> None:
    missing = [name for name in names if not os.environ.get(name, "").strip()]
    if missing:
        print(f"Missing environment variables: {', '.join(missing)}", file=sys.stderr)
        raise SystemExit(1)
