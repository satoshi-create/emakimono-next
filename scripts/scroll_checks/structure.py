"""Range coverage and scene structure checks."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from preflight_scroll import PreflightReport


def check_range_coverage(scenes: list[dict], max_index: int, report: PreflightReport) -> None:
    if not scenes or max_index <= 0:
        return

    covered: dict[int, int] = {}
    for scene in scenes:
        start, end = scene["range"]
        for index in range(start, end + 1):
            if index in covered:
                report.error(
                    f"Global index {index} appears in multiple scenes "
                    f"(scene id={scene['id']} and id={covered[index]})"
                )
            else:
                covered[index] = scene["id"]

    expected = set(range(1, max_index + 1))
    missing = sorted(expected - set(covered.keys()))
    if 1 not in covered:
        report.error("Range does not cover index 1 (scroll must start at image _01)")
    if missing:
        report.error(f"Missing global indices in scenes range: {', '.join(str(i) for i in missing)}")
    if len(covered) != max_index:
        extra = sorted(set(covered.keys()) - expected)
        if extra:
            report.error(f"Scenes range exceeds image count (indices > {max_index}): {extra}")
