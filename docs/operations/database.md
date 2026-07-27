# Turso + Drizzle — UGC データベース

絵巻メタデータ（JSON / YAML パイプライン）とは **別系統**。いいね・フィードバックのみ Turso に保存します。

## 環境変数

| 変数 | 用途 |
|------|------|
| `TURSO_DATABASE_URL` | Turso DB URL（`libsql://...`） |
| `TURSO_AUTH_TOKEN` | Turso auth token（ローカル・Vercel 両方） |

`.env.local` と Vercel Project Settings に設定してください。未設定時は API が `503` を返し、クライアントは localStorage / Discord 等の既存挙動を維持します。

## スキーマ

| テーブル | 用途 |
|----------|------|
| `emaki_likes` | 巻単位いいね（`emaki_id` + 匿名 `visitor_hash` で一意） |
| `scene_likes` | シーン単位いいね（toggle） |
| `feedback` | フィードバック本文 |

定義: `src/db/schema.js`

## 初回セットアップ

```bash
# 1. Turso で DB 作成後、.env.local に URL / TOKEN を設定
# 2. スキーマを反映
npm run db:push

# または SQL を直接実行
# drizzle/0000_init.sql
```

## API

| Method | Path |  body |
|--------|------|-------|
| POST | `/api/likes/emaki` | `{ emakiId }` |
| POST | `/api/likes/scene` | `{ emakiId, sceneIndex, action: "like" \| "unlike" }` |
| POST | `/api/feedback` | `{ message, pageUrl?, emakiId?, locale? }` |

## 開発コマンド

```bash
npm run db:generate   # マイグレーション SQL 生成
npm run db:push       # Turso へスキーマ push
npm run db:studio     # Drizzle Studio
```

## 関連ファイル

- `src/db/` — schema, client
- `src/pages/api/likes/` — いいね API
- `src/pages/api/feedback/` — フィードバック API
- `src/libs/api/ugcApi.js` — クライアント fetch ヘルパー
- `src/components/ui/FeedbackModal.js` — サイト内フィードバック UI

## 絵巻データとの境界

`docs/operations/scroll-pipeline.md` に従い、**scroll 同期・ビューア JSON は Turso に載せない** こと。
