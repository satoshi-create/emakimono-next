# 絵巻サムネイル生成ワークフロー（Figma MCP + Cursor）

絵巻カードのサムネイル（`public/thumb/{titleen}_thumb.webp`）を、**Figma をクロップ・目視確認ツールとして**使って生成するワークフロー。絵の新規生成はせず、Cloudinary 上の既存シーン画像を 16:9 にクロップします。

Agent 用の簡潔版は [`.cursor/skills/emaki-thumb/SKILL.md`](../../.cursor/skills/emaki-thumb/SKILL.md)。

## 関連ドキュメント

| ドキュメント | 役割 |
|-------------|------|
| `scroll-pipeline.md` | 絵巻追加の同期パイプライン（本ワークフローの上流） |
| `data-model.md` | titleen / scroll_id / JSON の関係 |
| `naming-convention.md` | Cloudinary B 形式 public_id |
| `design-tokens.mdc` | 紙色 `#f5f0e6`・カード 533×300 |

## 背景と現状（2026-08）

- カードは `next/image` で `dataEmakis.json` の `thumb` を参照（`SingleCardA.js` / `ChojuGigaScrollCard.js` / `KusouzuScrollCard.js`、すべて 533×300）
- 過去に thumb 実ファイルが欠落していた作品: 絵師草紙、地獄草紙（安住院本 / 益田家甲本）
- OGP は `src/script/generateOgImages.js` がローカル thumb から生成。thumb 欠落時は `src/libs/constants/emakiOgImages.js` の `OGP_IMAGE_FALLBACKS`（Cloudinary 変換 URL）にフォールバック
- サムネ材料（シーン画像）は Cloudinary に揃っている → 「絵を作る」ではなく「既存画像をクロップして実ファイル化」する問題

## 設計方針

| 項目 | 決定 |
|------|------|
| カード表示 | 533×300（16:9） |
| Figma フレーム | **1066×600**（2x, retina） |
| 背景 | `#f5f0e6`（絵巻の紙色） |
| アートワーク | `FILL`（カバークロップ・中央） |
| タイトル等の文字 | **焼き込まない**（i18n 二重管理防止。カードの `<h3>` が表示） |
| 保存パス | `/thumb/{titleen}_thumb.webp`（全作品統一） |

### 代表シーンの選定基準（優先順）

1. `src/libs/constants/emakiOgImages.js` の `OGP_IMAGE_FALLBACKS` に既にある public_id
2. `image-metadata-cache.json` の `emakis[]` で `cat: "image"` のシーン
3. **縦長（portrait）シーンを避ける** — 16:9 に強くクロップされ中央帯だけになる

実績（パイロット）:

| 作品 | 採用シーン | 寸法 | 理由 |
|------|-----------|------|------|
| 絵師草紙 | `eshi-no-soshi__eshi-no-soshi_1_01__04` | 1708×1080 | OGP フォールバック基準 |
| 地獄草紙 安住院本 | `jigokusoushi-anzyuin__jigokusoushi-anzyuin_1_04__02` | 1561×1080 | 横長。`1_01__02`(775×1080) は縦長すぎて不採用 |
| 地獄草紙 益田家甲本 | `jigokusoushi_masuda_kou__jigokusoushi_masuda_kou_1_01__02` | 1040×1080 | OGP フォールバック基準 |

> **2026-08-05 追補:** 安住院本・益田家甲本は初回生成後、ユーザーが Figma で縦横比・クロップ位置を調整（`artwork` を拡大・移動）。その後 Figma MCP のレート制限により**手動エクスポート（経路 B）**で差し替え。安住院本では旧版 PNG が残っていたため一度は反映されず、旧 PNG 削除後に JPG から再変換した（「変換元の優先順位」参照）。

## Figma 共有テンプレート

| 項目 | 値 |
|------|-----|
| ファイル名 | `emakimono-thumbs` |
| fileKey | `cgGh90megCqJM6EuFzUsSv` |
| URL | https://www.figma.com/design/cgGh90megCqJM6EuFzUsSv |
| ページ | 既定の `Page 1` に `thumb_{titleen}` フレーム（1066×600）を並べる |
| フレーム内 | `artwork` 矩形（画像フィル配置用） |

テンプレートは使い回し。新しい絵巻はフレームを追加して `upload_assets` → `use_figma` で画像をセット。

## 前提条件

- Figma MCP `plugin-figma-figma` が ready（`GetMcpTools` で確認）
- Figma デスクトップアプリ起動中
- `use_figma` の前に `figma-use` スキルを読む
- `create_new_file` の前に `figma-create-new-file` スキルを読む（初回のみ）

### Figma MCP のレート制限（重要）

| プラン | 読み取り系ツールの上限 |
|--------|------------------------|
| Starter（現状） | **月 6 コール**（`use_figma` / `get_screenshot` / `download_assets`） |
| Professional 以上 | 200/day（Full/Dev シート） |

- 読み取り系: `use_figma`, `get_screenshot`, `get_metadata`, `get_design_context`, `download_assets` など
- **書き込み系は対象外**: `upload_assets`, `generate_figma_design`, `whoami`
- `upload_assets` で画像配置までできるが、**`use_figma`（inspect・screenshot）とエクスポートが制限で使えない**ため、実質「配置→手動エクスポート」になる

**制限エラー:** `You've reached the Figma MCP tool call limit on the Starter plan` が出たら、[経路 B（手動エクスポート）](#4b-経路-b-手動エクスポートfigma-mcp-制限時) へ切り替える。`whoami` でプラン確認も可能。

## 手順

### 1. 欠落サムネの把握

```powershell
node src/script/generateOgImages.js
# SKIP (no local source image): {titleen} が欠落リスト
```

または `dataEmakis.json` の `thumb` と `public/thumb/*` を照合。

### 2. 代表シーンの決定

上の「代表シーンの選定基準」に従う。`emakiOgImages.js` のフォールバック先が最優先。

### 3. 画像を Cloudinary からダウンロード

```powershell
# 一時保存先（gitignore）
New-Item -ItemType Directory -Force -Path scrolls\_tmp-thumb
curl.exe -s -L -o "scrolls\_tmp-thumb\{titleen}.jpg" "https://res.cloudinary.com/dw2gjxrrf/image/upload/emakimono/{public_id}.jpg"
```

`image-metadata-cache.json` の `emakis[].src` が `public_id` + `.jpg` の形。

### 4. Figma に配置

#### 4a. 経路 A: Figma MCP（制限内の場合）

1. `use_figma`（read-only）でフレームと `artwork` ノード ID を確認
2. `upload_assets`（`fileKey`、`nodeId` = artwork、`scaleMode: "FILL"`）で upload URL を取得
3. 返ってきた `submitUrl` へ画像を POST（multipart `file` フィールド）
4. `get_screenshot` で目視確認 → **ユーザーに提示して OK をもらう**（クロップ位置・シーン選定の承認）
5. OK なら `download_assets`（`defaultFormat: "png"`, `defaultScale: 1`）で 1066×600 PNG をエクスポート → `scrolls/_tmp-thumb/{titleen}_thumb.png`

> **レート制限に達したらここで中断し、経路 B へ。**

#### 4b. 経路 B: 手動エクスポート（Figma MCP 制限時）

トリガー: `use_figma` / `get_screenshot` / `download_assets` が制限エラーで失敗した場合。

1. **Figma デスクトップアプリ**で `emakimono-thumbs` を開く
2. `thumb_{titleen}` フレームを選択
3. 右パネル **Export** → **PNG / 1x**（または 2x）で書き出し
4. 保存先: `scrolls/_tmp-thumb/{titleen}_thumb.png`
   - もしくは任意の場所（例: `public/ogp/thumb_{titleen}.jpg`）に置いてもらい、後述の `_tmp-thumb` へコピーする（実績あり）
5. **変換元 PNG が既に存在する場合は必ず先に削除**（下記「変換元の優先順位」を参照）
6. 手順 5 の webp 変換へ進む

Figma 側のクロップ調整（ユーザーが手動で縦横比・位置を整える）はこの経路でも問題ない。調整済みフレームをそのままエクスポートするだけ。

#### 変換元の PNG/JPG 優先順位（注意）

`scripts/generate-thumb-webp.js` は `scrolls/_tmp-thumb/{titleen}_thumb.png` を **PNG 優先**で探索する（`.png` → `.jpg` の順）。

- **古い PNG（整形前の MCP エクスポート）が残っていると、新しい手動版 JPG が無視される**
- 実例: 安住院本で旧版 PNG（17:39）が優先され、手動エクスポート版 JPG（18:22）が反映されなかった
- **対処:** 手動版を置く前に `scrolls/_tmp-thumb/{titleen}_thumb.png` を削除する

### 5. webp 変換

```powershell
node scripts/generate-thumb-webp.js {titleen}
```

- 入力: `scrolls/_tmp-thumb/{titleen}_thumb.png` **または `.jpg`**（PNG 優先）
- 出力: `public/thumb/{titleen}_thumb.webp`（1066×600, quality 82, sharp）

### 6. JSON の thumb / thumb2 を統一

両方のファイルで `thumb` / `thumb2` を `/thumb/{titleen}_thumb.webp` に更新:

| ファイル | 役割 |
|----------|------|
| `local-data/pipeline/dataEmakis.json` | 旧一覧データ（git 管理外・sync ツール用） |
| `src/data/image-metadata-cache/image-metadata-cache.json` | ★本番正本。ビューア + `generateOgImages.js` の入力 |

> 両ファイルとも `.cursorignore` 対象。編集時は一時的にコメントアウトするか、Shell の `node -e` または一時スクリプト（`$env:TEMP`）で実行する。

### 7. OGP 再生成 + ビルド

```powershell
node src/script/generateOgImages.js
# SKIP が 0 件になること（フォールバック不要化）
npm run build
```

### 8. 確認

- [ ] `public/thumb/{titleen}_thumb.webp` が存在
- [ ] `dataEmakis.json` / `image-metadata-cache.json` の `thumb` / `thumb2` が実パスと一致
- [ ] OGP 生成で SKIP 0 件
- [ ] `npm run build` が成功
- [ ] ローカルでカードが正しく表示される（`/` トップ、検索）

## スクリプト

| スクリプト | 役割 |
|-----------|------|
| `scripts/generate-thumb-webp.js` | Figma エクスポート PNG/JPG → webp 変換（**PNG 優先**） |
| `src/script/generateOgImages.js` | 全絵巻の OGP 生成（サムネ実ファイルが source） |

## チェックリスト

```
□ 代表シーンが縦長でない（16:9 クロップで自然か）
□ get_screenshot で目視確認 → ユーザー OK（経路 B では手動エクスポート画像を提示）
□ 変換元に旧 PNG が残っていない（新しい手動版 JPG がある場合は旧 PNG を削除済み）
□ public/thumb/{titleen}_thumb.webp 生成
□ dataEmakis.json + image-metadata-cache.json の thumb/thumb2 統一
□ generateOgImages.js で SKIP 0 件
□ npm run build 成功
□ scrolls/_tmp-thumb/ の一時ファイルはコミットしない
```

## 制約・注意

- Cloudinary クレジットは消費しない（既存アセットのダウンロードとローカル変換のみ）
- 文字・ラベルはサムネに焼き込まない
- `use_figma` はアトミック。エラー時は即リトライせず、エラーを読んで修正する
- 1 回の `use_figma` は 10 論理操作まで。段階実行 + 都度 `screenshot()` 検証
- **Figma MCP レート制限（Starter: 読み取り系 月 6 コール）に注意** — 制限時は経路 B（手動エクスポート）
- **変換元の PNG が残っていると手動版 JPG が無視される** — 手動版を置く前に旧 PNG を削除
- パイロット 3 作品完了済み（2026-08-05）。今後は新規絵巻 sync 後にこの手順を組み込む
