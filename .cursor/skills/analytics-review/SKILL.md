---
name: analytics-review
description: >-
  GSC/GA4 週次レビュー。analytics/reports/ の JSON/summary を読み改善提案する。
  ISR / Vercel Usage / Cloudinary credits も actions.md の Infra 節に記録する。
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
6. Infra / cost: 同ファイル §6（ISR・Vercel・Cloudinary）

## Rules

- **Do not call Google APIs directly** — run `scripts/analytics/fetch_all.py` if fresh data is needed
- Compare with the **previous report folder** when available
- Use `insight_flags` in `merged.json` as starting points
- Tie UX issues to events in `analytics/dimensions.yaml` / `measurementUtils.js`
- Output actionable items: meta, internal links, viewer UX, image CDN
- Write results to `analytics/reports/{date}/actions.md`（GSC/GA4 と **Infra / cost** を混ぜない）
- **Do not commit** `analytics/reports/` (gitignored)
- Infra は下記 **Infra / cost** に従う。Vercel API はリポジトリに無い（ダッシュボード数字が無ければ未実施）

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
## Infra / cost (ISR · Vercel · Cloudinary)
```

## Infra / cost

GSC Top 3 とは独立。詳細手順: `docs/operations/cursor-analytics-prompt.md` §6。

1. **Cloudinary**（自動可）: 最新レポート日付が分かったあと

   ```powershell
   py -3.14 scripts/check_cloudinary_usage.py --warn-at 18 --fail-at 20 --output analytics/reports/{date}/cloudinary-usage.json
   ```

   記録: `credits.usage` / limit / used_percent、bandwidth、storage、transformations。  
   `CLOUDINARY_URL` が無ければスキップし「未実施」と書く。  
   `analyze_cloudinary_assets.py` は **transformations または storage が前週比で急増したときだけ**（毎週実行しない。Admin API 枠）。

2. **Vercel / ISR**（手動数字が必要）: Observability の CSV・スクショ・数値がチャットにあれば要約する。無ければ checklist へ回し「未実施」。
   - HTML ルートのみ見る（`/_next/data/*` は pageProps。今回の ISR 肥大化対象外）
   - 必須パス: `/en` `/en/about` `/en/404` `/ja`
   - 課金は **非圧縮 Size Range**（転送 kB ではない。8KB = 1 Read Unit）
   - 併記: ISR Reads（使用 / 上限 1M）、Fast Data Transfer、Edge Requests

3. **ISR 抑制の効果測定（2026-08-18 本番マージ）**  
   週次 7 日窓はデプロイ日をまたぐことがある。**8/18 で期間を割る**:
   - 修正前: 8/11–17 またはマージ直前
   - 修正後: 8/18 以降  
   判定: Size Range が約 800KB 帯 → 約 60–130KB。Reads が同じヒット数なら roughly 1/8。  
   2026-08-31 以降の週次は通常の前週比でよい。

Infra の GitHub Issue は **credits ≥ 20 または ISR Reads が上限超過** のときだけ P1。フォント修正の経過観察だけなら Issue にしない。

## Bootstrap mode

If `summary.md` says `review_mode: bootstrap`, skip deep SEO recommendations.
Focus on measurement health and baseline documentation.

See [reference.md](./reference.md) for KPI glossary.
