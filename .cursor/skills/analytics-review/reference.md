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

## Quiz insight flags (`merged.json` top-level)

| Flag | Meaning |
|------|---------|
| `quiz_low_sample` | `quiz_start` below `min_quiz_starts_for_ratio`（計測健全性のみ） |
| `low_quiz_completion` | complete÷start below threshold |
| `low_quiz_jump` | jump÷complete below threshold |

`quiz_by_question[].correct_rate` = correct answers ÷ answer events（DB 不要）。

## Education geo (`merged.json` top-level)

| Field / flag | Meaning |
|--------------|---------|
| `education_geo_clusters` | region/city で sessions ≥ `min_*_cluster_sessions`（既定 30）の塊 |
| `education_geo_insight_flags` | `possible_education_geo_cluster` があれば候補あり |
| `geo_region_top` | 閾値未満でも地域 Top（分布確認用） |
| `device_category_breakdown` | GA4 標準 `deviceCategory` |
| `day_of_week_breakdown` | 曜日別 sessions（平日偏り確認） |
| `session_context_*_breakdown` | `device_type` / `connection_type`（Admin 登録後） |
| `image_load_slow_breakdown` | 絵巻別 `image_load_slow` |

地域塊は**教育利用の弱い代理**。学校確定には使わない。actions.md の **Education geo** 節へ。

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
