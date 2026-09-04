# Cursor Agent 用プロンプト — GSC / GA4 分析

`analytics-pipeline.md` に沿って、Cursor Agent に週次レビューを任せるためのプロンプト集です。

**正本:** [`analytics-pipeline.md`](./analytics-pipeline.md)

---

## 使い分け

| 状況 | プロンプト |
|------|-----------|
| 週次定例（steady） | [§1 週次レビュー](#1-週次レビューsteady) |
| データ少（bootstrap） | [§2 bootstrap チェック](#2-bootstrap-チェック) |
| 特定絵巻深掘り | [§3 絵巻深掘り](#3-絵巻深掘り) |
| **Cursor Automation** | [§4 Automation（週次）](#4-cursor-automation週次) |
| ISR / Vercel / Cloudinary | [§6 Infra / cost](#6-infra--costisrvercelcloudinary) |

---

## 1. 週次レビュー（steady）

### コピー用プロンプト

````markdown
# タスク: 週次 GSC/GA4 レビュー

## 参照ドキュメント（必読）
- 正本: docs/operations/analytics-pipeline.md
- KPI: analytics/kpi.yaml
- Skill: .cursor/skills/analytics-review/SKILL.md

## データ
- analytics/reports/ の最新日付フォルダ
- 1 つ前のフォルダ（あれば前週比較）

## やること
1. summary.md と merged.json を読む
2. 好調 Top 3 / 要改善 Top 3（前週比必須）
3. 改善案は meta・内部リンク・ビューア UX（measurementUtils イベント）に分解
4. Quiz 節（`quiz_funnel` / `quiz_by_question`）を actions.md に独立で書く
5. Infra / cost（ISR・Vercel・Cloudinary）を actions.md に独立節で書く（Skill の Infra 節 / 本ファイル §6）
6. 出力: analytics/reports/{最新}/actions.md
````

---

## 2. bootstrap チェック

### コピー用プロンプト

````markdown
# タスク: analytics bootstrap チェック

## データ
- analytics/reports/ の最新フォルダ

## やること
1. summary.md の review mode を確認
2. GSC / GA4 の行数・セッション数が kpi.yaml の閾値を超えているか
3. 計測健全性チェックリスト（page_view、主要カスタムイベント）
4. 週次改善レビューはスキップし、ベースライン記録のみ actions.md に書く
````

---

## 3. 絵巻深掘り

### コピー用プロンプト

````markdown
# タスク: 絵巻 {{titleen}} の GSC × GA4 深掘り

## データ
- analytics/reports/ 最新の merged.json / gsc_queries.json

## やること
1. slug = {{titleen}} の GSC クエリ・CTR・掲順
2. GA4 sessions / viewer_engagement_events / fallback
3. 改善提案 3 件（根拠数値付き）
````

---

## 4. Cursor Automation（週次）

**Automation の Instructions にそのまま貼る。**  
設定手順: [`analytics-automation-setup.md`](./analytics-automation-setup.md)

### コピー用プロンプト

````markdown
# タスク: 週次 Analytics レビュー（Automation）

`.cursor/skills/analytics-review/SKILL.md` に従う。Google Analytics / Search Console API は直接呼ばない（fetch スクリプトのみ可）。

## 1. データ取得

```bash
python scripts/analytics/fetch_all.py --skip-config-check
```

環境変数 `GOOGLE_APPLICATION_PROPERTY_ID`, `GOOGLE_CREDENTIALS_BASE64`, `GSC_SITE_URL` は Cloud Secrets から注入されている前提。

失敗時: ログにエラーを書き、GitHub Issue `[Analytics] Automation fetch failed` を 1 件作成して終了。

## 2. 分析

- `analytics/reports/` の最新日付フォルダを特定
- 1 つ前のフォルダがあれば前週比較
- `summary.md`, `merged.json`, `kpi.yaml` を読む
- `insight_flags` を起点に Top 3 / Needs 3 / P1–P3 を整理
- `summary.md` の **Quiz** 節と `merged.json` の `quiz_funnel` / `quiz_by_question` を読み、actions.md に **Quiz (UI + education)** を独立節で書く（SEO と混ぜない）
- Infra / cost: Skill の Infra 節および本ファイル §6。Cloudinary は `check_cloudinary_usage.py`。Vercel 数字がチャットに無ければ「未実施」

## 3. 出力

`analytics/reports/{最新日付}/actions.md` に書く:

```markdown
# Analytics Actions — YYYY-MM-DD

## Top performers (3)
## Needs improvement (3)
## Recommended actions (prioritized P1–P3)
## Quiz (UI + education)
## Infra / cost (ISR · Vercel · Cloudinary)
```

各 P 項目: slug、根拠数値、提案（meta / 内部リンク / viewer UX / CDN）。
Quiz は設問正答率・ファネル根拠を付ける（イベント件数ベース）。
Infra は GSC Top 3 と混ぜない。Issue 化は credits ≥ 20 または ISR Reads 上限超過のときだけ。

## 4. GitHub Issues

`actions.md` の P1–P3 ごとに Issue を作成（`gh issue create`）:

- タイトル: `[Analytics P1] {slug}: {短い要約}`
- ラベル: `analytics-weekly` + `analytics-p1`（P2/P3 も同様）
- 本文: 根拠数値、提案、レポートパス

同一 slug + 同一 P1 で open Issue がある場合は新規作成せずコメントで更新。

CI では `scripts/analytics/run_weekly_review.py` が同じ Issue 作成経路を smoke test できます。

**commit / push しない**（reports は gitignore）。

## 5. Google Calendar

google-calendar MCP で 1 週間後 30 分のイベントを作成:

- タイトル: `[emakimono-next] Analytics weekly review`
- 説明: GitHub Issues `label:analytics-weekly` の URL
- カレンダー: lifelog（利用可能なら）

## 6. 完了報告

チャット / 実行ログに以下を短く出力:

- レポート日付・Period
- actions.md パス
- 作成した Issue URL 一覧
- Calendar イベント日時
- Infra: Cloudinary 実施 / 未実施、Vercel ISR 実施 / 未実施
````

---

## 5. 人間レビュー

Automation 後: [`analytics-weekly-checklist.md`](./analytics-weekly-checklist.md)（15–35 分。Vercel ISR 含む）

---

## 6. Infra / cost（ISR・Vercel・Cloudinary）

週次の GSC/GA4 とは独立した定点。`actions.md` の **Infra / cost** 節に書く。

### Cloudinary（スクリプト可）

最新 `analytics/reports/{date}/` が用意できてから:

```powershell
py -3.14 scripts/check_cloudinary_usage.py --warn-at 18 --fail-at 20 --output analytics/reports/{date}/cloudinary-usage.json
```

| 記録 | 閾値 |
|------|------|
| `credits.usage` / limit / used_percent | warn ≥ 18、危険 ≥ 20（Free 上限 25） |
| bandwidth, storage, transformations | 前週比で急増したら原因を一行 |

`CLOUDINARY_URL` が無ければスキップし「未実施」。  
`scripts/analyze_cloudinary_assets.py` は **transformations または storage が急増したときだけ**（毎週実行しない。Admin API 枠）。

### Vercel / ISR（ダッシュボード）

リポジトリに Vercel API はない。Observability / Usage の表・CSV・スクショを人が渡すか、checklist で貼る。

| 見るもの | 注意 |
|----------|------|
| HTML ルートの Size Range | `/en` `/en/about` `/en/404` `/ja`。**`/_next/data/*` は除外**（pageProps） |
| ISR Reads | 使用量 / 上限 1M。課金は **非圧縮** Size（8KB = 1 Unit）。転送 kB ではない |
| Fast Data Transfer / Edge Requests | Usage の Last 7 days または billing cycle |

数字が無ければ「未実施（checklist 待ち）」。

### ISR 抑制の効果測定（2026-08-18 本番マージ）

フォント CSS の HTML インライン停止。週次 7 日窓はデプロイ日をまたぐ。

| 期間 | 目安 |
|------|------|
| 修正前（8/11–17 またはマージ直前） | Size Range 約 **800KB** |
| 修正後（8/18 以降） | HTML ルート **約 60–130KB**。同じヒット数なら Reads は roughly 1/8 |

**2026-08-24 の週次**は混在週になりうるので、必ず 8/18 で期間を割る。  
2026-08-31 以降は通常の前週比でよい。

Infra の GitHub Issue は credits ≥ 20 または ISR Reads 上限超過のときだけ。
