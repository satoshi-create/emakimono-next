"""Shared path constants."""

from __future__ import annotations

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
ANALYTICS_DIR = REPO_ROOT / "analytics"
REPORTS_DIR = ANALYTICS_DIR / "reports"
PROJECT_YAML = ANALYTICS_DIR / "project.yaml"
KPI_YAML = ANALYTICS_DIR / "kpi.yaml"
DIMENSIONS_YAML = ANALYTICS_DIR / "dimensions.yaml"
