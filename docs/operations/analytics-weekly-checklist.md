# Analytics weekly review — human checklist (15–30 min)

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

1. `summary.md` — Period（直近 7 日）、Totals、Top findings
2. `actions.md` — Top 3 / Needs 3 / P1–P3
3. 前週フォルダがあれば前週比の変化

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
| [cursor-analytics-prompt.md](./cursor-analytics-prompt.md) | Automation 用プロンプト |
| [analytics-automation-setup.md](./analytics-automation-setup.md) | Cursor Automation 設定 |
