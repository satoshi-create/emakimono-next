"""Load analytics YAML configs with environment variable expansion."""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any

import yaml

from _paths import KPI_YAML, PROJECT_YAML

_ENV_PATTERN = re.compile(r"\$\{([A-Z0-9_]+)\}")


def _expand_env(value: Any) -> Any:
    if isinstance(value, str):

        def repl(match: re.Match[str]) -> str:
            name = match.group(1)
            env_val = os.environ.get(name, "")
            if not env_val:
                raise ValueError(
                    f"Environment variable {name} is not set (required by analytics config)"
                )
            env_val = env_val.strip().strip('"').strip("'")
            return env_val

        return _ENV_PATTERN.sub(repl, value)
    if isinstance(value, dict):
        return {k: _expand_env(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_expand_env(item) for item in value]
    return value


def load_yaml(path: Path, *, expand_env: bool = False) -> dict:
    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError(f"Expected mapping in {path}")
    if expand_env:
        return _expand_env(raw)
    return raw


def load_project_config(*, expand_env: bool = True) -> dict:
    return load_yaml(PROJECT_YAML, expand_env=expand_env)


def load_kpi_config() -> dict:
    return load_yaml(KPI_YAML, expand_env=False)
