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

## 年表（`/timeline`）

絵巻物 × 日本史の年表ページ。`docs/絵巻関連年表.csv` を一次資料とし、変換スクリプトで `src/data/chronology/emakiTimeline.js` を生成する。

| ファイル | 役割 |
|----------|------|
| `docs/絵巻関連年表.csv` | 一次資料（手編集する正本） |
| `scripts/convert-timeline-csv.js` | CSV → JSON 変換・時系列ソート・絵巻リンク付与 |
| `src/data/chronology/emakiTimeline.js` | **生成物**（手動編集しない） |
| `src/data/chronology/emakiTimelineSimple.js` | **簡易版**（手動キュレーション。ja/en 両方更新） |
| `src/pages/timeline.js` | 年表ページ（「さくっと見る / 詳細年表」の切替） |

再生成: `node scripts/convert-timeline-csv.js`

### 行の構造

```
{
  year: 1140,          // ソート用の数値（「ごろ」「13世紀後半〜」も数値化）
  yearText: null,      // 表示用の原文（近似年代のみ。null なら year を表示）
  era: "平安", eraen: "heiann",
  emperor, eraName, politics, arts, regent, culture,
  emaki: [{ name, titleen, href }]
}
```

- `emaki` は CSV の文化遺産列と `EMAKI_LINK_MAP`（変換スクリプト内）を突き合わせて付与
- `href`（鳥獣戯画一覧・九相図一覧などのハブ）は常に公開
- `titleen` はビルド時に `image-metadata-cache.json` の公開集合と照合し、未公開は「準備中」表示

### 絵巻を追加したとき

1. 新規公開時: `EMAKI_LINK_MAP` に `titleen` を追加 → 再生成 → 自動で年表にリンクが生える
2. 時代判定はサイトの絵巻メタ（`dataEmakis.json`）を優先するため、独自の解釈は不要

### 簡易版（`emakiTimelineSimple.js`）

`/timeline` の初期表示（モバイルは常時）は「さくっと見る」の簡易版。詳細版の全行テーブルではなく、**時代のまとめ文 + 「歴史 → 絵巻」の因果エントリ**を厳選した手動キュレーション。

- 構造: `{ era, eraen, period, catch, keywords[], entries[] }`（entries は `{ year, event, story, emaki[] }`）
- `emaki` の形式・live/準備中判定は詳細版と同じ（`{ name, titleen, href }`）
- **ja/en 両方を手動で更新する**（詳細版と違い、en は最初から翻訳済み）
- エントリを増減・修正するときは、詳細版 CSV との整合（成立年代・時代区分）に注意
- 未公開作品は `titleen` に既知の slug を入れておく（公開後に自動リンク化）。slug 未定の作品は `titleen: ""` で名前のみ表示
- 対象時代は全6時代（平安・鎌倉・室町・安土・桃山・江戸・明治）。詳細版 CSV は2026-08 に安土・桃山以降を追記済み。後期3時代の行はサイト絵巻メタ（`dataEmakis.json`）を参考にしている
- 年表ページの「さくっと見る」では、詳細版と同じ「時代からさがす」TOC を冒頭に表示する（アンカーは `#simple-{eraen}`）。`EmakiTimelineSimple` は `rows.length > 1` のときだけ TOC を描画するため、絵巻ページ/時代ページへの単一時代埋め込みでは表示されない

### 埋め込み（絵巻ページ / 時代ページ）

年表は年表ページ以外にも、絵巻ページと時代ページへ埋め込む。

| ファイル | 役割 |
|----------|------|
| `src/utils/getLiveSlugs.js` | 公開中（withdrawn 除外）の titleen 集合。live/準備中判定の共通ヘルパー |
| `src/components/chronology/EmakiEraTimeline.js` | 1時代分の簡易年表の埋め込み。デスクトップは `<details>/<summary>` アコーディオン、スマホ（`max-width: 767px`）はボタン → モーダル表示。`eraen` に該当データが無ければ年表ページへのリンクのみ表示 |
| `src/components/emaki/layout/EmakiLandscapContent.js` | 横表示ビューアのメタ情報（時代/種別タグの直後）に埋め込み |
| `src/components/emaki/layout/EmakiPortraitContent.js` | 縦表示ビューアのメタ情報に同様に埋め込み |
| `src/pages/era/[slug].js` | 時代ページの Breadcrumbs 直後に年表セクション（`open` で展開表示） |

- 絵巻ページ: `data.eraen` で該当時代を引き、デスクトップは `details` 初期クローズ（プルダウン）、スマホはモーダル。文言は `common.json` の `timeline.embedTitle` / `timeline.viewFull` / `timeline.close`
- 時代ページ: `getStaticProps` で `timelineEraName`（簡易版の ja/en 時代名）を渡し、`timeline.embedEraTitle` で見出しを出す。表示形式（アコーディオン/モーダル）は絵巻ページと同じ
- 年表ページへのリンクは常に `/timeline`（アンカーは `#simple-{eraen}` / `#eraen` を `timeline.js` 側で解決し、表示を切り替える）
- モーダルは `EmakiEraTimeline.js` 内の `useState` + body スクロールロックで実装（`z-index: 500`）。デスクトップ/モバイルの切替は CSS メディアクエリのみで行う

## Agent がデータを編集するとき

1. `.cursorignore` から該当 JSON パスを一時的に外す
2. 変更後 `npm run build` でビルド確認
3. ビューア表示は `titleen`（slug）で `[slug].js` が解決
