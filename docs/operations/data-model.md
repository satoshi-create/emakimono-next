# データモデル — フロントエンド正本

絵巻ビューアが参照する JSON と識別子の関係。Cloudinary 命名の詳細は [naming-convention.md](./naming-convention.md)。

## 識別子（混同しない）

| 識別子 | 用途 | 例 |
|--------|------|-----|
| `titleen` | **URL スラッグ** / ルーティング | `cyoujyujinbutsugiga_kou` |
| `scroll_id` | Cloudinary / `scrolls/` YAML | `choju-giga-yamazaki-kou` |
| `metadata.id` | `dataEmakis.json` 内の数値 ID | `1` |
| `typeen` | 種別フィルタ | `emaki` |

**`scroll_id` ≠ `titleen`** — 同期パイプラインと URL は別命名体系。

## ファイルと役割

```
pages/[slug].js
    │  slug = titleen
    ▼
image-metadata-cache/image-metadata-cache.json  ← ビューアのシーン列（画像 URL, chapter, id）
    │
data/json-data/dataEmakis.json                  ← 一覧カード用メタ（author, era, thumb, desc）
    │
data/emaki-text-data/*.json                     ← 詞書・章テキスト（Ekotoba, 目次）
    │
data/data.js                                    ← 複数 category JSON の concat（レガシー含む）
```

| ファイル | 読者 | 内容 |
|----------|------|------|
| `image-metadata-cache.json` | ビューア | シーン画像・寸法・chapter |
| `dataEmakis.json` | 一覧・SEO・カード | title, titleen, author, thumb, keyword |
| `emaki-text-data/` | 詞書オーバーレイ | 章ごとの classical / modern テキスト |
| `data.js` | 旧一覧 API | emaki + 屏風・浮世絵等を結合 |

## 現行 MVP

サイトの主眼は **鳥獣人物戯画** と **九相図** の2系統。`data.js` が結合する他 category（`dataByoubus` 等）はレガシーで、トップ UI は一部のみ使用。

## 型定義

`src/types/emaki.ts` — 一部フィールドのみ。全面 TypeScript 化前の参考。

## ローカル sync（gitignore）

| Path | 役割 |
|------|------|
| `scrolls/{scroll_id}/scroll_config.yaml` | シーン定義の正本（ローカル） |
| `scripts/` sync | YAML → `image-metadata-cache` / Cloudinary |

手順: [scroll-pipeline.md](./scroll-pipeline.md), Agent プロンプト: [cursor-scroll-sync-prompt.md](./cursor-scroll-sync-prompt.md)

## Agent がデータを編集するとき

1. `.cursorignore` から該当 JSON パスを一時的に外す
2. 変更後 `npm run build` でビルド確認
3. ビューア表示は `titleen`（slug）で `[slug].js` が解決
