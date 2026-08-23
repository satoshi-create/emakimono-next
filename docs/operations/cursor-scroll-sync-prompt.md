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
| 词書・range だけ直した | [§3 YAML 修正のみ](#3-yaml-修正のみcloudinary-に触らない) |
| upload 前に人間が確認したい | [§4 検証のみ](#4-検証のみupload-しない) |
| sync 後に PR を出す | [§5 PR 前の最終確認](#5-pr-前の最終確認) |
| UI だけ直す（レーン B） | [§6 UI リファクタ](#6-ui-リファクタレーン-b) |

---

## 1. 標準（新規絵巻アップロード）

### コピー用プロンプト

<!-- 外側 4 重バッククォート: 内側の powershell フェンスと衝突しない -->
````markdown
# タスク: 絵巻を自動化パイプラインで sync する（レーン A: コンテンツ追加）

## 参照ドキュメント（必読）
- 正本: docs/operations/scroll-pipeline.md §3
- 命名: docs/operations/naming-convention.md
- ワークスペース: scrolls/README.md

## 対象
- scroll_id: {{scroll-id}}（例: gakisoushi-kawamoto）
- パス: scrolls/{{scroll-id}}/scroll_config.yaml
- 画像: scrolls/{{scroll-id}}/images/

## やること（この順序を守る）

### Step 1: レビュー
1. scroll_config.yaml の scroll_id がフォルダ名と一致するか
2. metadata.titleen / metadata.id が local-data/pipeline/dataEmakis.json と重複しないか
3. scenes[].range の合計枚数 = images/ 内の画像枚数か
4. 词書ありなら scenes[].text の有無を確認

問題があれば YAML を修正してから次へ。

### Step 1.5: 上流ゲート（sync 前必須）
```powershell
$env:PYTHONIOENCODING = "utf-8"
py -3.14 scripts/normalize_scroll_images.py scrolls/{{scroll-id}}/ --dry-run
py -3.14 scripts/build_scene_mapping.py scrolls/{{scroll-id}}/ --check
py -3.14 scripts/preflight_upstream.py scrolls/{{scroll-id}}/ --skip-similarity
```
目視確認後（段構成 OK）:
```powershell
py -3.14 scripts/preflight_upstream.py scrolls/{{scroll-id}}/ --require-reviewed
```

### Step 2: Phase 0〜2（検証のみ・upload なし）
PowerShell で実行（python ではなく py -3.14）:

```powershell
$env:PYTHONIOENCODING = "utf-8"
py -3.14 scripts/preflight_scroll.py scrolls/{{scroll-id}}/scroll_config.yaml
py -3.14 scripts/check_cloudinary_usage.py --warn-at 18 --fail-at 20 --no-save
py -3.14 scripts/sync_all.py scrolls/{{scroll-id}}/scroll_config.yaml --dry-run
```

報告してほしい内容:
- preflight が OK か（エラー内容）
- usage の credits.usage / limit
- dry-run の planned 枚数
- public_id が B 形式か（{{scroll-id}}__{{scroll-id}}_1_01__01）

### Step 3: 本番 sync（Step 2 がすべて OK のときのみ）
.env.local に CLOUDINARY_URL があることを確認してから 1 回だけ:

```powershell
py -3.14 scripts/sync_all.py scrolls/{{scroll-id}}/scroll_config.yaml
```

### Step 4: 事後確認（下流ゲート）

```powershell
py -3.14 scripts/postflight_sync.py scrolls/{{scroll-id}}/
py -3.14 scripts/postflight_thumb.py {{titleen}}
node src/script/generateOgImages.js --check {{titleen}}
py -3.14 scripts/postflight_downstream.py scrolls/{{scroll-id}}/ --skip-build
py -3.14 scripts/check_cloudinary_usage.py --warn-at 18 --fail-at 20 --no-save
npm run build
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
