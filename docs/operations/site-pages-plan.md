# サイトページ構成案 — guide / legal / SEO

About ページ（`staticData.js` の `about.intro`）の趣旨に沿った実装計画。**未実装** — 実装時の正本。

## ページ役割

| Path | 役割 | 状態 |
|------|------|------|
| `/about` | Why — プロジェクト趣旨・OSS | 既存 |
| `/guide` | How — 鑑賞の使い方 | 既存 |
| `/copyright` | 著作権・ライセンス / AI画像生成での利用ガイドライン | 既存 |
| `/privacy` | プライバシーポリシー | 既存 |
| `/terms` | 利用規約 | 既存 |

## `/guide` 構成（ハッシュリンク）

目次 → `#scroll` / `#features` / `#share`

### `#scroll` — 横スクロールで鑑賞する

1. 絵巻を選ぶ（トップ or `/type/emaki`、まず鳥獣戯画から）
2. 横スクロール（スワイプ / 矢印 / ホイール）— `HelpModal` と同内容を文章化
3. 段（シーン）を追う — 目次、`#数字` URL、次へ/前へ

### `#features` — ビューア機能

- 詞書・現代語訳（`common.json` `viewer.*`）
- 目次・登場人物・絵引き
- 自動再生・フルスクリーン
- 鑑賞のコツ（段ごとに止める、九相図は観想）

### `#share` — 共有・参加

- シーン URL コピー
- Notion お問い合わせ
- GitHub OSS 参加

**JSON-LD:** `FAQPage`（SEO Step）

## `/privacy` 構成

1. はじめに / 最終更新
2. 取得情報（GA4, Clarity, アクセスログ）
3. 位置情報 — **取得しない**
4. 外部サービス（Cloudinary, Notion）
5. 利用目的・保存期間
6. 問い合わせ先

## `/terms` 構成

1. 定義
2. サービス内容
3. 禁止事項（無断転載・スクレイピング）
4. 解説の正確性免責
5. 九相図等の描写への注意
6. 運営者情報

※ 著作権・出典の詳細は `/copyright` に移管（2026-08-09 削除）。

## `/copyright` 構成（実装済み）

著作権・ライセンス / AI画像生成での利用ガイドライン。著作権・CC 解説をメインとし、AI 画像生成への言及は AI ガイドラインセクションのみ。

1. 著作権 — 古典絵巻の著作権状態（原作品 PD、画像は機関ライセンス）+ 公式ページ（文化庁）
2. CCライセンス — CC0 / CC BY / CC BY-SA / CC BY-NC + CC 公式ページ（About CC Licenses / CC0 / CC BY 4.0 / License Chooser）
3. AI画像生成での利用ガイドライン（Stable Diffusion / ControlNet / Midjourney）
4. 主な所蔵機関のライセンス（ColBase / British Museum / Wellcome / MET / Wikimedia）
5. 免責・お問い合わせ

## 共通 `LegalPageLayout`

- Header + Breadcrumbs + 本文 + 関連リンク（about, guide, privacy, terms）
- フッターにリーガル3リンク

## UI テキスト原則（4軸）

1. 専門語 → 日常語（初出 gloss）
2. ベネフィット（「繰り展げて追う」）
3. モバイル視認性
4. 用語統一（段 / シーン / 絵巻）

禁止: 「読む絵巻」「縦スクロール推奨」など趣旨と矛盾する表現。

## SEO メタ（実装時）

| Path | title 例 |
|------|-----------|
| `/guide` | 使い方ガイド \| 横スクロールで楽しむ絵巻物 |
| `/copyright` | 著作権・ライセンス \| 横スクロールで楽しむ絵巻物 |
| `/privacy` | プライバシーポリシー \| … |
| `/terms` | 利用規約 \| … |
| `/404` | noindex |

## 関連ファイル

- `src/libs/constants/dataSiteMeta.js` — SITE_* 定数
- `src/components/meta/Meta.js` — head 出力
- `next-sitemap.config.js` — sitemap 追加
