"""Detect near-verbatim copying from sources/ reference files."""

from __future__ import annotations

import re
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from preflight_scroll import PreflightReport

SOURCE_SUFFIXES = {".txt", ".md", ".markdown"}
SIMILARITY_THRESHOLD = 0.25
LONG_MATCH_CHARS = 40


def _normalize(text: str) -> str:
    text = re.sub(r"<br\s*/?>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+", "", text)
    return re.sub(r"[^\w\u3040-\u30ff\u4e00-\u9fff]", "", text)


def _ngrams(text: str, n: int = 10) -> set[str]:
    if len(text) < n:
        return {text} if text else set()
    return {text[i : i + n] for i in range(len(text) - n + 1)}


def _similarity(generated: str, source: str) -> float:
    gen = _normalize(generated)
    src = _normalize(source)
    if not gen or not src:
        return 0.0
    if gen in src or src in gen:
        return 1.0
    gen_grams = _ngrams(gen)
    src_grams = _ngrams(src)
    if not gen_grams or not src_grams:
        return 0.0
    overlap = len(gen_grams & src_grams)
    return overlap / min(len(gen_grams), len(src_grams))


def _longest_common_run(a: str, b: str) -> int:
    na = _normalize(a)
    nb = _normalize(b)
    best = 0
    for i in range(len(na)):
        for j in range(len(nb)):
            length = 0
            while i + length < len(na) and j + length < len(nb) and na[i + length] == nb[j + length]:
                length += 1
            best = max(best, length)
    return best


def load_source_corpus(sources_dir: Path) -> str:
    parts: list[str] = []
    if not sources_dir.is_dir():
        return ""
    for path in sorted(sources_dir.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in SOURCE_SUFFIXES:
            continue
        try:
            parts.append(path.read_text(encoding="utf-8"))
        except OSError:
            continue
    return "\n".join(parts)


def check_source_similarity(
    scenes: list[dict],
    sources_dir: Path,
    report: PreflightReport,
    *,
    threshold: float = SIMILARITY_THRESHOLD,
) -> None:
    corpus = load_source_corpus(sources_dir)
    if not corpus.strip():
        return

    for scene in scenes:
        text = scene.get("text") or {}
        scene_id = scene.get("id")
        combined = "\n".join(
            str(text.get(key, ""))
            for key in ("gendaibun", "desc", "kobun")
            if str(text.get(key, "")).strip()
        )
        if not combined.strip():
            continue

        ratio = _similarity(combined, corpus)
        long_run = _longest_common_run(combined, corpus)
        if long_run >= LONG_MATCH_CHARS:
            report.error(
                f"Scene id={scene_id}: {long_run}-char verbatim match with sources/ "
                f"(summarize in your own words; see scene-text-policy.md)"
            )
        elif ratio >= threshold:
            report.error(
                f"Scene id={scene_id}: text {ratio:.0%} similar to sources/ "
                f"(threshold {threshold:.0%}; use summarized commentary)"
            )
