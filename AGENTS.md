# AGENTS.md — emakimono-next

横スクロールで絵巻物を鑑賞する Next.js サイト（本番: https://emakimono.com）。

## Tech stack

- **Next.js 12** Pages Router（App Router ではない）
- **React 18**, JavaScript 中心（一部 TypeScript）
- **Chakra UI** + CSS Modules（Tailwind は devDeps のみ）
- **next-i18next** — locales: `ja`, `en`（default: `en`）
- **Vercel** デプロイ、`next-sitemap` で robots/sitemap 生成

## Reading order (start here)

1. This file (`AGENTS.md`)
2. `docs/operations/data-model.md` — JSON / slug / scroll_id の関係
3. `src/pages/[slug].js` — 絵巻ページのエントリ
4. `src/components/emaki/layout/EmakiConteiner.js` — ビューア本体
5. `src/pages/_app.js` — `AppContext`（navIndex, fullscreen, modals）
6. `src/components/meta/Meta.js` — SEO
7. 編集対象の locales / constants（下記 i18n 表）

## Directory map

| Path | Purpose |
|------|---------|
| `src/pages/` | ルート定義（`/[slug]` が絵巻ビューア） |
| `src/components/emaki/` | 絵巻ビューア UI |
| `src/components/layout/` | Header, Footer |
| `src/components/meta/Meta.js` | SEO（next/head） |
| `src/libs/constants/` | サイトメタ・ナビリンク・静的文案 |
| `src/data/` | 絵巻 JSON メタデータ |
| `public/locales/` | i18n 翻訳（`common.json`） |
| `docs/operations/` | Analytics / Scroll sync / data-model |
| `.cursor/skills/analytics-review/` | GSC/GA4 週次レビュー Skill |
| `scripts/analytics/` | GA4/GSC 取得 Python |
| `scrolls/` | ローカル絵巻 YAML（gitignore） |

## MVP scope vs legacy

- **現行 MVP:** 鳥獣人物戯画（Chōjū-jinbutsu-giga）・九相図（Kusōzu）
- `src/data/json-data/dataEmakis.json` 等には他 category も含むが、トップは上記2系統に焦点
- `src/libs/_archive_unused_data/` / `src/components/_archive_unused/` — **参照・編集しない**
- `func.js` が archive を import していてもレガシー

## Legacy identifier typos (do not rename)

| Actual name | Note |
|-------------|------|
| `EmakiConteiner.js` | Container の typo |
| `ResposiveImage.js` | Responsive の typo |
| `oepnSidebar` | open の typo（AppContext） |

## i18n — where to edit text

| Content | File |
|---------|------|
| ビューア UI（ボタン・ヘルプ） | `public/locales/{ja,en}/common.json` |
| トップ / About 長文 HTML | `src/libs/constants/staticData.js` |
| SEO site title / description | `src/libs/constants/dataSiteMeta.js` |
| ページ `<title>` / OGP | `Meta.js` + 各 `pages/*.js` の props |

**Both `ja` and `en` must be updated together.**

See also: `.cursor/rules/i18n-sources.mdc`

## Commands

```bash
npm run dev      # 開発サーバー
npm run build    # ビルド + postbuild で sitemap 生成
npm run lint     # ESLint
```

Scroll sync / analytics は `docs/operations/` を参照。

## Conventions

- デザイン正本: `.cursor/rules/design-tokens.mdc` + `src/styles/globals.css`（単一ライトモード、3フォント: UI / story / classical）
- 絵巻 ID 命名: `docs/operations/naming-convention.md`（`scroll_id` ≠ `titleen`）
- データ正本: `docs/operations/data-model.md`
- ページ構成（guide/legal）: `docs/operations/site-pages-plan.md`
- お問い合わせ: Notion 外部 URL（`src/libs/constants/links.js`）
- **コミット・push はユーザー明示指示時のみ**

## `.cursorignore` and large JSON

These paths are excluded from Agent indexing by default:

- `src/data/json-data/`
- `src/data/image-metadata-cache/`
- `src/data/emaki-text-data/`

When editing scroll metadata or text JSON, temporarily comment out the relevant lines in `.cursorignore` or open those files directly in the editor.

## Cursor-specific assets

| File | Role |
|------|------|
| `.cursor/rules/design-tokens.mdc` | 色・フォント・レイアウト・スタイル規約 |
| `.cursor/rules/i18n-sources.mdc` | UI 文言の編集先 |
| `.cursor/skills/analytics-review/` | Analytics 週次 Skill |
| `docs/operations/cursor-analytics-prompt.md` | Analytics Agent プロンプト |
| `docs/operations/cursor-scroll-sync-prompt.md` | Scroll sync Agent プロンプト |
| `docs/operations/data-model.md` | JSON / slug データ正本 |
| `docs/operations/site-pages-plan.md` | guide / legal ページ構成案 |
| `.cursor/mcp.json` | プロジェクト MCP（必要時に追加） |

## Planned pages (guide / legal / SEO)

- `/about` — 既存（プロジェクト趣旨）
- `/guide`, `/privacy`, `/terms` — 未実装（`site-pages-plan.md` 参照）

## Do not

- `.env*` や `credentials.json` をコミットしない
- `src/components/_archive_unused/` を本番機能の参照元にしない
- Next.js 14+ 前提の API（App Router 等）を無条件に導入しない
