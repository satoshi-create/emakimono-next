"""User-facing metadata.desc / descen quality checks."""

from __future__ import annotations

import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from scroll_checks.report import ValidationReport

# Research / internal classification terms that must not appear in public desc.
_RESEARCH_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"AC型"), "AC型"),
    (re.compile(r"Cモジュール"), "Cモジュール"),
    (re.compile(r"請求記号"), "請求記号"),
    (re.compile(r"真珠庵系"), "真珠庵系"),
    (re.compile(r"系譜"), "系譜"),
    (re.compile(r"モジュール脱落"), "モジュール脱落"),
    (re.compile(r"AC[- ]lineage", re.I), "AC-lineage"),
    (re.compile(r"C[- ]module", re.I), "C-module"),
    (re.compile(r"call number", re.I), "call number"),
    (re.compile(r"Shinju-an lineage", re.I), "Shinju-an lineage"),
]


def _find_research_terms(text: str) -> list[str]:
    if not text:
        return []
    found: list[str] = []
    for pattern, label in _RESEARCH_PATTERNS:
        if pattern.search(text):
            found.append(label)
    return found


def check_user_facing_desc(meta: dict, *, report: ValidationReport) -> None:
    """Warn when metadata.desc/descen contain research-only classification language."""
    for field in ("desc", "descen"):
        value = str(meta.get(field) or "")
        terms = _find_research_terms(value)
        if terms:
            unique = sorted(set(terms))
            report.error(
                f"metadata.{field} contains research/classification terms: {', '.join(unique)}. "
                "Rewrite for general audiences (所蔵・時代・絵の内容). "
                "Keep module analysis in sources/scene-mapping.md only."
            )
