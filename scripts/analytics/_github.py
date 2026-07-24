"""Minimal GitHub REST API helpers (stdlib only). Used in CI for analytics Issues."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any

ANALYTICS_LABELS: list[dict[str, str]] = [
    {"name": "analytics-weekly", "color": "1D76DB", "description": "Weekly GSC/GA4 review"},
    {"name": "analytics-p1", "color": "B60205", "description": "P1 action from analytics"},
    {"name": "analytics-p2", "color": "FBCA04", "description": "P2 action from analytics"},
    {"name": "analytics-p3", "color": "C5DEF5", "description": "P3 action from analytics"},
]


def _repo_parts() -> tuple[str, str]:
    repo = os.environ.get("GITHUB_REPOSITORY", "").strip()
    if "/" not in repo:
        raise ValueError("GITHUB_REPOSITORY is not set (owner/repo required in CI)")
    owner, name = repo.split("/", 1)
    return owner, name


def _token() -> str:
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if not token:
        raise ValueError("GITHUB_TOKEN is not set")
    return token


def github_request(
    method: str,
    path: str,
    *,
    body: dict | None = None,
) -> Any:
    owner, repo = _repo_parts()
    url = f"https://api.github.com/repos/{owner}/{repo}{path}"
    data = None
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {_token()}",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"GitHub API {method} {path} failed ({exc.code}): {detail}") from exc


def ensure_analytics_labels() -> list[str]:
    """Create analytics labels if missing. Returns names created."""
    existing = {item["name"] for item in (github_request("GET", "/labels?per_page=100") or [])}
    created: list[str] = []
    for spec in ANALYTICS_LABELS:
        if spec["name"] in existing:
            continue
        github_request("POST", "/labels", body=spec)
        created.append(spec["name"])
    return created


def list_open_analytics_issue_titles() -> list[str]:
    owner, repo = _repo_parts()
    titles: list[str] = []
    page = 1
    while page <= 5:
        batch = github_request(
            "GET",
            f"/issues?state=open&labels=analytics-weekly&per_page=100&page={page}",
        )
        if not batch:
            break
        for issue in batch:
            if issue.get("pull_request"):
                continue
            titles.append(issue.get("title") or "")
        if len(batch) < 100:
            break
        page += 1
    return titles


def create_issue(*, title: str, body: str, labels: list[str]) -> str:
    payload = github_request(
        "POST",
        "/issues",
        body={"title": title, "body": body, "labels": labels},
    )
    return payload.get("html_url") or ""
