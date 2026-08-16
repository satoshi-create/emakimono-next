---
name: emaki-thumb
description: >-
  絵巻サムネイル生成。Figma MCP（plugin-figma-figma）で代表シーンをクロップし、
  public/thumb/{titleen}_thumb.webp を生成する。dataEmakis.json / image-metadata-cache.json の
  thumb / thumb2 を実パスに統一し、OGP を再生成する。
  Use when generating thumbnails for emaki scrolls, fixing broken card thumbnails,
  or creating new scroll content (thumbnail step).
---

# Emaki Thumbnail Workflow

## When to use

- 新規絵巻追加時（scroll sync 後にサムネ生成が必要な場合）
- `dataEmakis.json` の `thumb` が実ファイルと一致しない（壊れ画像）
- `public/thumb/` にファイルがない絵巻のサムネ作成
- OGP のフォールバック解消（`emakiOgImages.js` の `OGP_IMAGE_FALLBACKS` を不要にする）

## Required reading

1. `docs/operations/thumb-workflow.md`（本書のランブック）
2. `docs/operations/data-model.md`（titleen / scroll_id の関係）
3. `docs/operations/naming-convention.md`（Cloudinary B 形式 public_id）
4. `.cursor/rules/design-tokens.mdc`（紙色 `#f5f0e6`、カードサイズ 533×300 = 2x で 1066×600）

## Prerequisites

- Figma MCP `plugin-figma-figma` が ready（`GetMcpTools` で確認）
- Figma デスクトップアプリが起動していること
- `use_figma` の前は必ず `figma-use` スキルを読む
- `create_new_file` の前は必ず `figma-create-new-file` スキルを読む
- 共有テンプレート: `emakimono-thumbs`（fileKey はランブックに記録）

### Figma MCP レート制限（Starter: 読み取り系 月 6 コール）

- 読み取り系（`use_figma` / `get_screenshot` / `get_metadata` / `download_assets`）は**月 6 コール**
- 書き込み系（`upload_assets` / `generate_figma_design` / `whoami`）は対象外
- 制限エラー `You've reached the Figma MCP tool call limit` が出たら **経路 B（手動エクスポート）** へ切替

## Two export paths

| 経路 | 使いどころ | 手順 |
|------|-----------|------|
| **A: Figma MCP** | レート制限内 | `upload_assets` → `get_screenshot` → 目視 → `download_assets` |
| **B: 手動エクスポート** | レート制限時 | Figma デスクトップでフレーム選択 → Export → PNG 保存 → 変換スクリプトへ |

**経路 B の手順:**
1. Figma デスクトップアプリで `thumb_{titleen}` フレームを選択
2. Export → PNG / 1x（または 2x）で書き出し
3. `scrolls/_tmp-thumb/{titleen}_thumb.png` に保存（または任意場所 → コピー）
4. **変換元 PNG が既に存在する場合は必ず先に削除**（PNG 優先のため旧版が採用される）
5. 変換スクリプトへ

## Spec

| 項目 | 値 |
|------|-----|
| カード表示 | 533×300（16:9） |
| Figma フレーム | **1066×600**（2x, retina） |
| 背景 | `#f5f0e6`（絵巻の紙色。`LazyImage.js` と同じ） |
| アートワーク | `FILL`（カバークロップ、中央） |
| タイトル | **焼き込まない**（i18n 二重管理を避ける。カードの `<h3>` が表示） |
| 保存先 | `public/thumb/{titleen}_thumb.webp` |
| JSON | `dataEmakis.json` + `image-metadata-cache.json` の `thumb` / `thumb2` を統一パス `/thumb/{titleen}_thumb.webp` に |

## Steps

### 1. 対象リストを把握

```bash
node src/script/generateOgImages.js  # SKIP が出る = ローカル thumb がない作品
```

`dataEmakis.json` の `thumb` が実ファイル（`public/thumb/*`）と一致するか照合する。

### 2. 代表シーンを選定

基準（優先順）:
1. `src/libs/constants/emakiOgImages.js` の `OGP_IMAGE_FALLBACKS` に既にある public_id
2. `image-metadata-cache.json` の `emakis[]` で `cat: "image"` のシーン
3. 縦長（portrait）シーンは横に強くクロップされる → **横長・正方に近いシーンを優先**（安住院本 1_01__02 775×1080 は不適、1_04__02 1561×1080 を採用した実績あり）

### 3. 画像を Cloudinary から取得

```
https://res.cloudinary.com/dw2gjxrrf/image/upload/emakimono/{public_id}.jpg
```

一時保存: `scrolls/_tmp-thumb/{titleen}.jpg`（gitignore 対象）

### 4. Figma で組版

**経路 A（Figma MCP、制限内）:**
1. `use_figma` でテンプレートを確認（inspect first）
2. `upload_assets`（`nodeId` = artwork、`scaleMode: "FILL"`）で画像を配置
3. `get_screenshot` で **目視確認 → ユーザーに提示して OK をもらう**
4. `download_assets`（`defaultFormat: "png"`, `defaultScale: 1`）でエクスポート → `scrolls/_tmp-thumb/{titleen}_thumb.png`

**経路 B（レート制限時、手動）:**
1. Figma デスクトップアプリで `thumb_{titleen}` フレームを選択
2. Export → PNG で書き出し → `scrolls/_tmp-thumb/{titleen}_thumb.png` に保存
3. **旧 PNG が残っていたら先に削除**（変換スクリプトは PNG 優先）
4. 手順 5 の webp 変換へ

> Figma 側で縦横比・クロップをユーザーが手動調整する場合は、調整後にエクスポートすればよい。

### 5. webp 変換

```bash
node scripts/generate-thumb-webp.js {titleen}
```

`scrolls/_tmp-thumb/{titleen}_thumb.png` → `public/thumb/{titleen}_thumb.webp`（1066×600, quality 82）

### 6. JSON を実パスに統一

`thumb` / `thumb2` → `/thumb/{titleen}_thumb.webp`

- `local-data/pipeline/dataEmakis.json`（旧一覧データ。git 管理外・sync ツール用。編集時はパイプライン側にも反映されるよう注意）
- `src/data/image-metadata-cache/image-metadata-cache.json`（本番正本。`generateOgImages.js` が読む）

どちらも `.cursorignore` 対象のため、**編集時は一時コメントアウト**または Shell の `node -e` / 一時スクリプトで実行する。

### 7. OGP 再生成 + ビルド確認

```bash
node src/script/generateOgImages.js  # SKIP が 0 になること
npm run build
```

## Rules

- タイトル・時代ラベル等の文字は **サムネ画像に焼き込まない**（ja/en の二重管理を防ぐ）
- パス形式は常に `/thumb/{titleen}_thumb.webp`（他作品のバラバラ形式を踏襲しない）
- `use_figma` はアトミック — エラー時は即リトライせず、エラー内容を読んで修正してから再実行
- 1 回の `use_figma` は 10 論理操作まで。大きく分けて段階実行する
- `use_figma` のコードは `return` で結果を返す（`figma.closePlugin()` は使わない）
- 色は 0–1 レンジ（`#f5f0e6` → `{r: 0.9608, g: 0.9412, b: 0.902}`）
- Cloudinary クレジットを消費しない（既存アセットのダウンロードのみ）
- `scrolls/_tmp-thumb/` の一時ファイルはコミットしない
- **Figma MCP レート制限（Starter: 読み取り系 月 6 コール）** — 制限エラーが出たら経路 B へ
- **変換スクリプトは PNG 優先** — 手動版 JPG を置く前に旧 PNG（`scrolls/_tmp-thumb/{titleen}_thumb.png`）を削除する（安住院本で未反映の実績あり）

## Output

- `public/thumb/{titleen}_thumb.webp`（実ファイル）
- `dataEmakis.json` / `image-metadata-cache.json` の `thumb` / `thumb2` 更新
- OGP 再生成済み（`public/ogp/{titleen}.jpg`）

See [thumb-workflow.md](../../../docs/operations/thumb-workflow.md) for the full runbook.
