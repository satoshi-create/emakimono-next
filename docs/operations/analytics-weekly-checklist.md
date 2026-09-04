# Analytics weekly review — human checklist (15–35 min)

Pattern C の**手動部分**だけ。fetch・分析・Issue 作成・Calendar 予約は自動。

---

## いつ

- **火曜以降**（月曜 fetch + 火曜 Automation の後）
- Calendar の `[emakimono-next] Analytics weekly review` を開く

---

## 手順

### 1. データが来ているか（2 分）

- [ ] GitHub Actions **Analytics weekly fetch** が green（月曜）
- [ ] Cursor Automation **Analytics weekly review** が green（火曜）
- [ ] 失敗 Issue `[Analytics] Weekly fetch failed` が無い

失敗時: `docs/operations/analytics-pipeline.md` のトラブルシュート → 手動 `workflow_dispatch` で再実行。

### 2. 分析結果を読む（5–10 分）

Automation 実行ログまたは最新 artifact 内:

1. `summary.md` — Period（直近 7 日）、Totals、Top findings、**Quiz**
2. `actions.md` — Top 3 / Needs 3 / P1–P3 / **Quiz (UI + education)**
3. 前週フォルダがあれば前週比の変化
4. `actions.md` の **Infra / cost**（Cloudinary。Vercel は次項）
5. Quiz: start→complete→jump と正答率ワースト設問（GO/NO-GO）

### 2b. Infra / cost — Vercel ISR（5 分）

ダッシュボード数字は Agent が取れない。ここで記録するか、チャットに渡す。

- [ ] Vercel → Observability → ISR。**HTML ルート**（`/_next/data` 以外）
- [ ] `/en` `/en/about` `/en/404` `/ja` の Size Range（非圧縮。転送 kB ではない）
- [ ] Usage: ISR Reads（/ 1M）、Fast Data Transfer、Edge Requests
- [ ] **2026-08-24 前後:** 期間を **8/18 で分割**（修正前 約 800KB vs 修正後 約 60–130KB）
- [ ] Cloudinary: Automation が未実施なら  
      `py -3.14 scripts/check_cloudinary_usage.py --warn-at 18 --fail-at 20 --no-save`

詳細: [`cursor-analytics-prompt.md`](./cursor-analytics-prompt.md) §6。

### 3. GitHub Issues（5–10 分）

フィルタ: label `analytics-weekly`

| 優先度 | 判断 |
|--------|------|
| **P1** | GO / NO-GO / 保留 をコメント。GO のみ実装キューへ |
| **P2** | 今週やらないなら `deferred` コメント or 次週へ |
| **P3** | 情報のみ — 必要なら close |

**GO 基準（目安）**

- 根拠数値が actions.md にある
- 実装見積もり ≤ 半日
- リスク低（計測・meta・内部リンク・軽微 UX）

### 4. 実装（別枠）

- GO した P1 だけ PR 化（Automation / 別 Agent セッション）
- マージ後、翌週 fetch で効果確認

### 5. クローズ（2 分）

- [ ] 判断済み Issue にコメント
- [ ] NO-GO は close または `wontfix`
- [ ] 翌週月曜 fetch まで待つ

---

## ラベル（初回のみ GitHub で作成）

```powershell
gh label create analytics-weekly --color 1D76DB --description "Weekly GSC/GA4 review"
gh label create analytics-p1 --color B60205 --description "P1 action from analytics"
gh label create analytics-p2 --color FBCA04 --description "P2 action from analytics"
gh label create analytics-p3 --color C5DEF5 --description "P3 action from analytics"
```

---

## 関連

| ドキュメント | 内容 |
|-------------|------|
| [analytics-pipeline.md](./analytics-pipeline.md) | fetch・Secrets・Actions |
| [cursor-analytics-prompt.md](./cursor-analytics-prompt.md) | Automation 用プロンプト（§6 Infra） |
| [analytics-automation-setup.md](./analytics-automation-setup.md) | Cursor Automation 設定 |
