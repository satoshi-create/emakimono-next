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

## Infra / cost（週次）

| Source | How to get | Notes |
|--------|------------|--------|
| Cloudinary credits | `scripts/check_cloudinary_usage.py` | warn ≥ 18, danger ≥ 20（Free 25） |
| Cloudinary assets | `scripts/analyze_cloudinary_assets.py` | 急増時のみ。毎週は走らせない |
| Vercel ISR Size Range | Dashboard Observability（HTML ルート） | `/_next/data` は見ない。非圧縮サイズで課金 |
| Vercel Usage | Dashboard → Usage | ISR Reads / Fast Data Transfer / Edge Requests |

ISR フォント修正の本番日: **2026-08-18**。それ以前の Size Range 目安は約 800KB。

## Emakimono slug

- URL slug = `titleen` from `dataEmakis.json`
- `/ja/{slug}` and `/{slug}` are merged in reports

<!-- TODO: 詳細 KPI 閾値・イベント解釈ガイドを追記 -->
