# Turso + Drizzle — UGC データベース

絵巻メタデータ（JSON / YAML パイプライン）とは **別系統**。いいね・スクロール体験フィードバックのみ Turso に保存します。

一般お問い合わせは Notion フォームを使用します（`NOTION_CONTACT_URL` = 日本語版 / `NOTION_CONTACT_URL_EN` = 英語版。`getContactUrl(locale)` で切替）。

## 環境変数

| 変数 | 用途 |
|------|------|
| `TURSO_DATABASE_URL` | Turso DB URL（`libsql://...`） |
| `TURSO_AUTH_TOKEN` | Turso auth token（ローカル・Vercel 両方） |

`.env.local` と Vercel Project Settings に設定してください。未設定時は API が `503` を返します（シーンいいねは localStorage で UI 状態を維持）。

## スキーマ

| テーブル | 用途 |
|----------|------|
| `emaki_likes` | 巻単位いいね（`emaki_id` + 匿名 `visitor_hash` で一意） |
| `scene_likes` | シーン単位いいね（toggle） |
| `scroll_feedback` | 絵巻鑑賞中の選択式スクロール体験フィードバック |

定義: `src/db/schema.js`

## 初回セットアップ

```bash
# 1. Turso で DB 作成後、.env.local に URL / TOKEN を設定
# 2. スキーマを反映
npm run db:push

# 既存 DB に feedback テーブルがある場合
# drizzle/0001_scroll_feedback.sql を適用（db:push でも可）
```

## API

| Method | Path | body |
|--------|------|------|
| POST | `/api/likes/emaki` | `{ emakiId }` |
| GET | `/api/likes/scene?emakiId=...` | - |
| POST | `/api/likes/scene` | `{ emakiId, sceneIndex, action: "like" \| "unlike" }` |
| POST | `/api/feedback/scroll` | `{ emakiId, choice, sceneIndex, scrollRatio?, locale? }` |

`choice` の allowlist: `smooth`, `laggy`, `hard_to_read`, `confusing`, `great`

## 開発コマンド

```bash
npm run db:generate   # マイグレーション SQL 生成
npm run db:push       # Turso へスキーマ push
npm run db:studio     # Drizzle Studio
```

## 関連ファイル

- `src/db/` — schema, client
- `src/pages/api/likes/` — いいね API
- `src/pages/api/feedback/scroll.js` — スクロールフィードバック API
- `src/libs/api/ugcApi.js` — クライアント fetch ヘルパー
- `src/components/emaki/viewer/ScrollFeedbackPanel.js` — 絵巻内フィードバック UI

## 絵巻データとの境界

`docs/operations/scroll-pipeline.md` に従い、**scroll 同期・ビューア JSON は Turso に載せない** こと。
