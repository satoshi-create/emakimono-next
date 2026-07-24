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

## Required reading

1. Latest `analytics/reports/*/summary.md`
2. Same folder's `merged.json`
3. `analytics/kpi.yaml` (phase, thresholds)
4. `docs/operations/analytics-pipeline.md`

## Rules

- **Do not call Google APIs** — read repo files only
- Compare with the **previous report folder** when available
- Use `insight_flags` in `merged.json` as starting points
- Tie UX issues to events in `analytics/dimensions.yaml` / `measurementUtils.js`
- Output actionable items: meta, internal links, viewer UX, image CDN
- Write results to `analytics/reports/{date}/actions.md`

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
