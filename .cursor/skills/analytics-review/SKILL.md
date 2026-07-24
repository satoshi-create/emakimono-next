---
name: analytics-review
description: >-
  GSC/GA4 週次レビュー。analytics/reports/ の JSON/summary を読み改善提案する。
  Use when reviewing SEO, traffic, CTR, GA4 events, or analytics reports.
---

# Analytics Review

## When to use

- User asks for GSC / GA4 / SEO / traffic review
- `analytics/reports/` に新しい日付フォルダがある
- 週次定例・本番運用フィードバック
- **Cursor Automation** 週次レビュー（Pattern C）

## Required reading

1. Latest `analytics/reports/*/summary.md`
2. Same folder's `merged.json`
3. `analytics/kpi.yaml` (phase, thresholds, 7-day window)
4. `docs/operations/analytics-pipeline.md`
5. Automation 時: `docs/operations/cursor-analytics-prompt.md` §4

## Rules

- **Do not call Google APIs directly** — run `scripts/analytics/fetch_all.py` if fresh data is needed
- Compare with the **previous report folder** when available
- Use `insight_flags` in `merged.json` as starting points
- Tie UX issues to events in `analytics/dimensions.yaml` / `measurementUtils.js`
- Output actionable items: meta, internal links, viewer UX, image CDN
- Write results to `analytics/reports/{date}/actions.md`
- **Do not commit** `analytics/reports/` (gitignored)

## Automation extras (Pattern C)

After writing `actions.md`:

1. Create GitHub Issues for P1–P3 (`analytics-weekly`, `analytics-p1` labels)
2. Skip duplicate open Issues for same slug + priority
3. Schedule next review on Google Calendar (lifelog, +7 days, 30 min)
4. Human follow-up: `docs/operations/analytics-weekly-checklist.md`

## Output format

```markdown
# Analytics Actions — YYYY-MM-DD

## Top performers (3)
## Needs improvement (3)
## Recommended actions (prioritized P1–P3)
```

## Bootstrap mode

If `summary.md` says `review_mode: bootstrap`, skip deep SEO recommendations.
Focus on measurement health and baseline documentation.

See [reference.md](./reference.md) for KPI glossary.
