#!/usr/bin/env python3
"""Quick checks for normalize_slug (run: py -3.14 scripts/analytics/test_normalize_slug.py)."""

from __future__ import annotations

import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from _util import normalize_slug  # noqa: E402

PREFIXES = ["/ja", "/en"]


def test_gsc_encoded_matches_ga4_unicode() -> None:
    gsc = "https://emakimono.com/ja/Ch%C5%8Dj%C5%AB-jinbutsu-giga_first"
    ga4 = "/ja/Chōjū-jinbutsu-giga_first"
    assert normalize_slug(gsc, strip_prefixes=PREFIXES) == normalize_slug(
        ga4, strip_prefixes=PREFIXES
    )


def test_ja_prefix_stripped() -> None:
    assert normalize_slug("/ja/kusouzumaki", strip_prefixes=PREFIXES) == "kusouzumaki"


def test_en_prefix_stripped() -> None:
    assert (
        normalize_slug("/en/Chōjū-jinbutsu-giga_first", strip_prefixes=PREFIXES)
        == "Chōjū-jinbutsu-giga_first"
    )


def test_ja_root_empty() -> None:
    assert normalize_slug("https://emakimono.com/ja", strip_prefixes=PREFIXES) == ""


def main() -> int:
    tests = [
        test_gsc_encoded_matches_ga4_unicode,
        test_ja_prefix_stripped,
        test_en_prefix_stripped,
        test_ja_root_empty,
    ]
    for fn in tests:
        fn()
        print(f"OK  {fn.__name__}")
    print(f"\n{len(tests)} tests passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
