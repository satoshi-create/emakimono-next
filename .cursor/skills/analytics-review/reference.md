# Analytics Review — Reference

## Key files

| File | Purpose |
|------|---------|
| `merged.json` | Per-emaki GSC × GA4 join |
| `gsc_queries.json` | Query-level GSC data |
| `ga4_events_summary.json` | Custom event counts |
| `dimensions.yaml` | Event param ↔ GA4 mapping |

## Insight flags (merged.json)

| Flag | Meaning |
|------|---------|
| `high_impressions_low_ctr` | Many impressions, CTR below site average |
| `high_traffic_low_engagement` | Sessions high, viewer_engagement ratio low |
| `high_image_fallback` | Many `image_load_fallback` events |
| `impressions_no_clicks` | Visible but no clicks |

## Emakimono slug

- URL slug = `titleen` from `dataEmakis.json`
- `/ja/{slug}` and `/{slug}` are merged in reports

<!-- TODO: 詳細 KPI 閾値・イベント解釈ガイドを追記 -->
