# Cursor Agent 用プロンプト — 絵巻 sync

`scroll-pipeline.md` に沿って、Cursor Agent に絵巻の検証・sync・PR 準備を任せるためのプロンプト集です。

**使い方:** 各セクションの **「コピー用プロンプト」ブロック全体** をコピーし、`{{scroll-id}}` / `{{titleen}}` を置換して Cursor チャットに貼り付けてください。

**正本:** [`scroll-pipeline.md`](./scroll-pipeline.md)  
**YAML 草案（汎用 AI）:** [`ai-scroll-config-prompt.md`](./ai-scroll-config-prompt.md)

---

## 使い分け

| 状況 | プロンプト |
|------|-----------|
| 新規絵巻を初めて sync | [§1 標準](#1-標準新規絵巻アップロード) または [§2 短縮版](#2-短縮版yaml画像は用意済み) |
| Figma ラフだけ置いた（1080/連番未） | [§1](#1-標準新規絵巻アップロード) の **Step 0a**（contact sheet → `process_figma_slices.py`） |
| 词書・range だけ直した | [§3 YAML 修正のみ](#3-yaml-修正のみcloudinary-に触らない) |
| upload 前に人間が確認したい | [§4 検証のみ](#4-検証のみupload-しない) |
| sync 後に PR を出す | [§5 PR 前の最終確認](#5-pr-前の最終確認) |
| UI だけ直す（レーン B） | [§6 UI リファクタ](#6-ui-リファクタレーン-b) |
| 既存絵巻の画像差し替え / YAML 増補 | [§3.5 再アップロード](#35-再アップロード画像差し替え) |

---

## 1. 標準（新規絵巻アップロード）

### コピー用プロンプト

<!-- 外側 4 重バッククォート: 内側の powershell フェンスと衝突しない -->
````markdown
# タスク: 絵巻を自動化パイプラインで sync する（レーン A: コンテンツ追加）

## 参照ドキュメント（必読）
- 正本: docs/operations/scroll-pipeline.md §3
- Figma ラフ後処理: docs/operations/figma-slice-export.md
- 命名: docs/operations/naming-convention.md
- ワークスペース: scrolls/README.md

## 対象
- scroll_id: {{scroll-id}}（例: gakisoushi-kawamoto）
- パス: scrolls/{{scroll-id}}/scroll_config.yaml
- 画像: scrolls/{{scroll-id}}/images/
- Figma ラフ（任意）: scrolls/{{scroll-id}}/images/_raw/

## やること（この順序を守る）

### Step 0a: Figma ラフがある場合（images/_raw/ にスライスがある）
`_NN-1080.jpg` が未生成、ラフを差し替えた、または色調を見直すとき。人間がスライス境界だけ Figma で決めた前提。**Figma Export は `images/` 直下に置かず `images/_raw/` へ。**

色調補正を飛ばさない。順序は **contact sheet → 人間 GO → process** のみ。

```powershell
$env:PYTHONIOENCODING = "utf-8"
py -3.14 -m pip install -r scripts/requirements-scroll.txt

# 1) Brightness × Sharpen 比較シートを生成
py -3.14 scripts/generate_contact_sheet.py scrolls/{{scroll-id}}/
# 出力: images/_raw/contact_sheet.jpg をユーザーに見せ、B/S 値をもらう
# 例: --brightness 1.00,1.05,1.10 --sharpen 0,120,150 / --input-file で代表枚指定可

# 2) ユーザーが決めた値で本番 batch（プレースホルダを実値に置換）
py -3.14 scripts/process_figma_slices.py scrolls/{{scroll-id}}/ `
  --input-dir scrolls/{{scroll-id}}/images/_raw `
  --brightness {{brightness}} --sharpen {{sharpen}} `
  --scene-text `
  --force
```

確認（Step 1 へ進む前）:
- ユーザーが `contact_sheet.jpg` を見て Brightness / Sharpen を明示したか
- `images/_01-1080.jpg` … が揃い、各ファイル 1MB 以下・高さ 1080
- `scroll_config.yaml` の scenes range が画像枚数を被覆
- 詞書なし解説バーなら `metadata.sceneText: true` と `scenes[].text`（直下の `desc` は不可）
- 最終画像の見た目 OK をもらってから Step 1 へ

### Step 0b: `_NN-1080.jpg` だけある場合（`_raw/` なし）
色調補正を黙ってスキップしない。次のどちらかを必須にする:

- **A（推奨）:** 既存画像を `images/_raw/` に移し（または Figma ラフを置き直し）、**Step 0a** を実行する
- **B:** ユーザーがチャットで「補正スキップ承認」と明記したときだけ Step 1 へ進む

`1_1080px.jpg` 等の非準拠名だけの状態も 0b 扱い。リネームだけで sync に進まない。

### Step 0v: 画像認識（段構成・scenes 確定前）
`.cursorignore` で `scrolls/*/images/**` と `scrolls/*/sources/**` は **常時 Agent Read 可能**（毎回コメントアウト不要）。`scrolls/source/`（研究資料）と `public/thumb/` 等は引き続きブロック。

1. ゲート: `scrolls/{{scroll-id}}/images/` の代表1枚を `Read` で開き、Permission denied でないこと
2. 全スライスを目視同定し、`sources/scene-mapping.md` に記録してから `scroll_config.yaml` の scenes を書く
3. PIL 色比率などの ad-hoc ヒューリスティックをナラティブ根拠にしない（ビジョン `Read` 必須）

### Step 1: レビュー
1. scroll_config.yaml の scroll_id がフォルダ名と一致するか
2. metadata.titleen / metadata.id が local-data/pipeline/dataEmakis.json と重複しないか
3. scenes[].range の合計枚数 = images/ 内の画像枚数か
4. 词書ありなら scenes[].text の有無を確認
5. thumb が `/{{titleen}}_thumb.webp` 形式か（scroll_id の kebab ではない）

問題があれば YAML を修正してから次へ。

### Step 1.5: 上流ゲート（sync 前必須）
```powershell
$env:PYTHONIOENCODING = "utf-8"
py -3.14 scripts/normalize_scroll_images.py scrolls/{{scroll-id}}/ --dry-run
py -3.14 scripts/build_scene_mapping.py scrolls/{{scroll-id}}/ --check
```
不一致時: `--write-yaml`（CSV→YAML）または `--write-csv`（YAML→CSV、title/range 編集後）

目視確認後（段構成 OK）:
```powershell
py -3.14 scripts/preflight_upstream.py scrolls/{{scroll-id}}/ --require-reviewed
```

preflight は次も ERROR にする: `scroll_id` 非 kebab / `eraen` 大文字・未知コード / `thumb` パス形式不一致 / `_raw` ありで contact sheet 無し / `metadata.desc`・`descen` に研究用分類語（AC型・Cモジュール・請求記号 等）。  
補正スキップ承認時のみ: `--ack-no-color-correction` を preflight_upstream / sync_all に付与。

### Step 2〜4: sync（統合コマンド推奨）

```powershell
$env:PYTHONIOENCODING = "utf-8"

# 検証のみ
py -3.14 scripts/scroll_upload.py scrolls/{{scroll-id}}/ --dry-run

# 本番（preflight → sync → thumb webp → OGP → postflight）
py -3.14 scripts/scroll_upload.py scrolls/{{scroll-id}}/ --ack-no-color-correction
```

`--ack-no-color-correction` は contact sheet 未作成時のみ付与。

**個別コマンド（デバッグ用）:**

```powershell
py -3.14 scripts/preflight_scroll.py scrolls/{{scroll-id}}/scroll_config.yaml
py -3.14 scripts/check_cloudinary_usage.py --warn-at 18 --fail-at 20 --no-save
py -3.14 scripts/sync_all.py scrolls/{{scroll-id}}/scroll_config.yaml --dry-run
py -3.14 scripts/sync_all.py scrolls/{{scroll-id}}/scroll_config.yaml
py -3.14 scripts/postflight_downstream.py scrolls/{{scroll-id}}/ --skip-build
```

### Step 5: 報告

```powershell
py -3.14 scripts/check_cloudinary_usage.py --warn-at 18 --fail-at 20 --no-save
```

更新されたファイルを一覧で報告:
- local-data/pipeline/dataEmakis.json
- src/data/image-metadata-cache/image-metadata-cache.json
- src/data/emaki-text-data/{{titleen}}.json（词書ありの場合）
- scrolls/{{scroll-id}}/.upload-cache.json（gitignore）

## 禁止事項
- --force-upload / --remote-check を使わない
- 同じ絵巻で sync をループしない
- GitHub Actions から upload しない（ローカル sync のみ）
- sync_scroll.py 単体ではなく sync_all.py を主経路とする
- UI コード（LazyImage 等）は触らない
- commit / push は指示があるまで行わない
- images/_raw/ があるのに generate_contact_sheet.py を飛ばして process_figma_slices.py / sync しない
- ユーザーの補正値 GO または「補正スキップ承認」無しで本番 sync しない

## 失敗時
- preflight エラー → YAML / 画像 / ID 重複を修正して Step 2 から再実行
- usage が --fail-at 20 で exit 1 → 本番 sync は中止し、理由を報告
- dry-run NG → 本番 sync は実行しない
````

---

## 2. 短縮版（YAML・画像は用意済み）

### コピー用プロンプト

```markdown
scrolls/{{scroll-id}}/ を docs/operations/scroll-pipeline.md §3 に従い sync してください。

0. 画像経路を確認する（色調を飛ばさない）:
   - images/_raw/ にラフがある → generate_contact_sheet.py → ユーザーが B/S 決定 → process_figma_slices.py
   - _NN-1080 のみ → _raw に戻して上記、またはユーザーの「補正スキップ承認」が無い限り sync しない
1. scroll_config.yaml と images/ をレビュー（range 枚数・titleen/id 重複・scroll_id=フォルダ名）
2. preflight → usage（--warn-at 18 --fail-at 20 --no-save）→ dry-run を py -3.14 で実行
3. すべて OK なら sync_all.py 本番を 1 回（--force-upload 禁止）
4. 更新 JSON と usage サマリーを報告。commit はしない。
```

---

## 3. YAML 修正のみ（Cloudinary に触らない）

### コピー用プロンプト

````markdown
scrolls/{{scroll-id}}/scroll_config.yaml の词書テキスト / scenes のみ修正しました。
Cloudinary アップロードは不要です。

docs/operations/scroll-pipeline.md §7 に従い:

```powershell
$env:PYTHONIOENCODING = "utf-8"
py -3.14 scripts/preflight_scroll.py scrolls/{{scroll-id}}/scroll_config.yaml
py -3.14 scripts/sync_all.py scrolls/{{scroll-id}}/scroll_config.yaml --skip-upload
```

を実行し、更新された JSON ファイルを報告してください。commit はしない。
````

---

## 3.5 再アップロード（画像差し替え）

「既存絵巻の画像を差し替えた / YAML に解説や sceneText を足して再 sync したい」場合の専用シナリオ。§1 標準は「新規巻」前提で「同一巻の再 sync」が禁止に見えるため、本節を先に読むこと。

### 前提（重要）

- `sync_scroll.py` は **同じ `public_id` への `overwrite` + `invalidate`** でアップロードする。
- 再アップロード判定は `.upload-cache.json` の **bytes + mtime** による。→ **画像ファイルの中身（サイズ・更新日時）が変わっていれば、特別なフラグなしで自動上書き**される。
- **`--force-upload` は不要・禁止のまま**（cache 差し替えで自然に再 upload されるため）。
- **Cloudinary 側の `destroy` はやらない**。本番参照中の public_id を消すとビューアが壊れる。削除が必要なのは「キャッシュから外れた旧 ID」のみ（`prune_cloudinary_assets.py`）。
- 配信 `src` は **`v{version}/emakimono/{public_id}.jpg`**（`naming-convention.md`）。version 無しだと変換 CDN が旧画像を掴んだままになる。画像が変わっていなくても version 欠落時は Admin API で version を補完する。

### コピー用プロンプト

````markdown
scrolls/{{scroll-id}}/ の画像を差し替え / YAML を増補しました。再 sync してください。

## 前提（変えなくてよい）
- sync_scroll.py は .upload-cache の bytes+mtime で同一 public_id に overwrite する
- 画像が変わっていれば特別フラグなしで自動再 upload、destroy は不要

## 手順（この順）
1. Figma ラフ差し替えなら先に再処理:
   $env:PYTHONIOENCODING = "utf-8"
   py -3.14 scripts/process_figma_slices.py scrolls/{{scroll-id}}/ --input-dir scrolls/{{scroll-id}}/images/_raw --scene-text --force
2. 画像ファイル名を正規化:
   py -3.14 scripts/normalize_scroll_images.py scrolls/{{scroll-id}}/ --fix
3. YAML の説明が scenes[].desc 直下になっていないか確認（正: scenes[].text.{desc,descen}）
   - 語書なしで下部解説バーを出すなら metadata.sceneText: true も付与
4. preflight / usage / dry-run:
   py -3.14 scripts/preflight_scroll.py scrolls/{{scroll-id}}/scroll_config.yaml
   py -3.14 scripts/check_cloudinary_usage.py --warn-at 18 --fail-at 20 --no-save
   py -3.14 scripts/sync_all.py scrolls/{{scroll-id}}/scroll_config.yaml --dry-run
5. すべて OK なら本番 sync を 1 回:
   py -3.14 scripts/sync_all.py scrolls/{{scroll-id}}/scroll_config.yaml
6. 事後ゲート（§1 Step 4 相当）:
   py -3.14 scripts/postflight_sync.py scrolls/{{scroll-id}}/
   py -3.14 scripts/postflight_downstream.py scrolls/{{scroll-id}}/ --skip-build
7. 更新 JSON（dataEmakis / image-metadata-cache / emaki-text-data）と usage を報告。commit はしない。
````

---

## 4. 検証のみ（upload しない）

### コピー用プロンプト

```markdown
scrolls/{{scroll-id}}/ が PR 可能か検証してください（upload なし）。

docs/operations/scroll-pipeline.md Phase 0〜2 と §8 チェックリストに沿い:
- preflight
- check_cloudinary_usage（--warn-at 18 --fail-at 20 --no-save）
- sync_all.py --dry-run

結果をチェックリスト形式で報告。NG 項目があれば修正案を提示。本番 sync は実行しない。
```

---

## 5. PR 前の最終確認

### コピー用プロンプト

```markdown
絵巻 {{scroll-id}} の sync 済み変更を PR する前に最終確認してください。

1. npm run dev で /{{titleen}} が表示できるか（可能なら目視ポイントを列挙）
2. preflight + dry-run が pass するか再実行
3. 同一 PR に含めるべきファイル:
   - scrolls/{{scroll-id}}/scroll_config.yaml
   - scrolls/{{scroll-id}}/images/*
   - local-data/pipeline/dataEmakis.json
   - src/data/image-metadata-cache/image-metadata-cache.json
   - src/data/emaki-text-data/{{titleen}}.json（該当時）
4. PR では .github/workflows/validate-scroll.yml が preflight + dry-run を自動実行することを確認
5. commit メッセージ案を 1 つ提案（commit は指示までしない）
```

---

## 6. UI リファクタ（レーン B）

### コピー用プロンプト

```markdown
LazyImage / EmakiImage のレイアウト精度を改善してください（レーン B: UI リファクタ）。

docs/operations/scroll-pipeline.md §7 に従うこと:
- Cloudinary loader の URL パラメータ（fl_progressive, f_jpg, w_, q_）は変更しない
- sync_all.py は実行しない
- デプロイ前に既存絵巻 1〜2 作品で横スクロール・词書・フルスクリーンを目視確認
```

---

## 関連ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [`scroll-pipeline.md`](./scroll-pipeline.md) | 手順・CI・運用の正本 |
| [`ai-scroll-config-prompt.md`](./ai-scroll-config-prompt.md) | 汎用 AI 用 YAML 草案プロンプト |
| [`naming-convention.md`](./naming-convention.md) | Cloudinary B 形式 |
| [`scrolls/README.md`](../../scrolls/README.md) | ワークスペース入口 |
