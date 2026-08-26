# Scroll Slice Export Manual（Figma 非依存）

高精細な絵巻パノラマ原画を **コードでトリム／段切り** し、ラフ切片（`images/_raw/`）を経てビューアー用アセット（`_01-1080.jpg` 等）と `scroll_config.yaml` 骨格を生成する標準手順です。

**推奨経路は Figma 不要**です。旧 Figma 手順は末尾のレガシー節を参照。

中間正本: `scrolls/{scroll_id}/sources/geometry.yaml`（trim・cuts・status）。

---

## 1. ワークフロー概要


| ステップ | ツール | 目的 | 担当 |
| -------- | ------ | ---- | ---- |
| **事前** | 原画配置 | `sources/panorama.jpg` または `sources/tiles/*` | 人間 |
| **Step A** | `scroll_slice_tool.py propose` | 結合・余白候補・カット候補 → `geometry.yaml`（draft） | Agent / 人間 |
| **Step B** | `preview` または `review` | トリム／セクション境界の目視・微調整 → `status: reviewed` | **人間** |
| **Step C** | `scroll_slice_tool.py export` | `images/_raw/slice_NN.jpg` へ切り出し | Agent / 人間 |
| **Step 4.5** | `generate_contact_sheet.py` | Brightness × Sharpen 比較 | 人間 / Agent |
| **Step 5** | `process_figma_slices.py` | 1080px・補正・1MB 未満 JPEG・YAML 骨格 | Agent / 人間 |
| **Step 6** | preflight → sync | 上流ゲート後に Cloudinary sync | Agent |


人間の本業は **Step B（境界の正しさ）** と解説文・本番許可です。

---

## 2. `geometry.yaml` スキーマ

```yaml
version: 1
status: draft          # draft | reviewed（export は reviewed 推奨）
order: rtl             # rtl: _01 = 画像右端（巻頭）。ltr も可
panorama: sources/panorama.jpg
# tiles:                 # 巻頭→巻末の閲覧順（NDL なら番号昇順）
#   - sources/tiles/0005_0000.jpg
#   - sources/tiles/0006_0000.jpg
# stitch: horizontal-rtl # 既定。リスト先頭（巻頭）をキャンバス右へ貼る
# stitch: horizontal     # リスト先頭を左へ貼る（LTR）
# tile_overlaps:         # 閲覧順の隣接タイル間の重複幅(px)。結合時に除去
#   - 280                  # tiles[0]–tiles[1]
#   - 300                  # tiles[1]–tiles[2]
# tile_y_offsets:        # 同ペアの縦ずれ。+ で paste 右側タイルを下へ
#   - 0
#   - -12
trim:
  x: 120
  y: 40
  width: 18000
  height: 2100
cuts:                  # パノラマ絶対 X。trim 内・昇順。区間境界
  - 2500
  - 4800
notes: ""
```

- `cuts` が空 → トリム全体が 1 切片
- セグメント数 = `len(cuts) + 1`
- 目視後は必ず `status: reviewed`（CLI `export` は未 reviewed だと `--allow-draft` が必要）

---

## 3. 詳細手順

### 事前: 原画の配置

どちらか一方:

1. **単一パノラマ** — `scrolls/{scroll_id}/sources/panorama.jpg`（PNG/WebP/TIFF 可。パスは YAML で上書き可）
2. **タイル** — `sources/tiles/` に横並びスキャンを置く（ファイル名昇順 ＝ 巻頭→巻末）。`propose` が既定 `horizontal-rtl` で結合し、**右＝巻頭**のパノラマを作る
3. **ページ間重複・上下ずれ（NDL 等）** — `tile_overlaps` / `tile_y_offsets`。preview の**緑線**が接合位置。横ドラッグ＝重複、縦ドラッグまたは **接合 ↑↓** で上下。`propose --estimate-overlaps` が初期値を推定

向きを変え直すとき（既存 panorama を作り直す）:

```powershell
py -3.14 scripts/scroll_slice_tool.py propose scrolls/{scroll_id}/ --restitch --estimate-overlaps
# 手動で overlap / y を直したあと再結合
py -3.14 scripts/scroll_slice_tool.py propose scrolls/{scroll_id}/ --restitch --keep-overlaps --keep-cuts
```

### Step A: 候補生成

```powershell
$env:PYTHONIOENCODING = "utf-8"
py -3.14 -m pip install -r scripts/requirements-scroll.txt

py -3.14 scripts/scroll_slice_tool.py propose scrolls/{scroll_id}/
# 段の目安幅を変える（高さに対するアスペクト、既定 1.4 ≒ 1500px @1080h）
py -3.14 scripts/scroll_slice_tool.py propose scrolls/{scroll_id}/ --target-aspect 1.5
```

### Step B: 目視（どちらか）

**B-1. 静的プレビュー（最短）**

```powershell
py -3.14 scripts/scroll_slice_tool.py preview scrolls/{scroll_id}/
# → sources/geometry_preview.jpg を OS の画像ビューアで確認
# 座標を直す場合は geometry.yaml を編集して preview 再実行
```

**B-2. ローカル確認 UI（推奨）**

```powershell
py -3.14 scripts/scroll_slice_tool.py review scrolls/{scroll_id}/
# ブラウザ http://127.0.0.1:8765/
# 赤線ドラッグ / ダブルクリックで cut 追加 / Mark reviewed + save
```

確認の観点:

- 余白・ノド・結合継ぎ目が過剰に残っていないか
- 妖怪・雲・道具が中途半端に切れていないか

### Step C: `_raw` 書き出し

```powershell
py -3.14 scripts/scroll_slice_tool.py export scrolls/{scroll_id}/ --force
```

### Step 4.5〜6

以降は従来どおり:

```powershell
py -3.14 scripts/generate_contact_sheet.py scrolls/{scroll_id}/

py -3.14 scripts/process_figma_slices.py scrolls/{scroll_id}/ `
  --input-dir scrolls/{scroll_id}/images/_raw `
  --scene-text --force

py -3.14 scripts/normalize_scroll_images.py scrolls/{scroll_id}/ --dry-run
py -3.14 scripts/preflight_upstream.py scrolls/{scroll_id}/ --skip-similarity
```

詳細オプションは従来の Step 4.5 / 5 節（下記レガシーと共通）を参照。

---

## 4. 人間 / Agent の分担


| 人間 | Agent |
|------|-------|
| 原画配置、境界の目視・`reviewed`、補正 B/S、解説文、本番 OK | `propose` / `preview` / `export` / `process_*` / preflight / dry-run |
| `review` UI での cut 微調整 | 結果報告（commit は指示時のみ） |


---

## 5. チェックリスト

- [ ] `sources/panorama.jpg` または `tiles/` があるか
- [ ] `propose` で `geometry.yaml` ができたか
- [ ] preview または review で trim/cuts を確認し `status: reviewed` か
- [ ] `export` で `images/_raw/slice_*.jpg` があるか（`images/` 直下と混在させない）
- [ ] contact sheet で B/S を決めたか
- [ ] `process_figma_slices.py` で `_NN-1080.jpg`・1MB 以下か
- [ ] YAML の global index と枚数が一致するか
- [ ] 上流ゲート後に sync するか

---

## 6. レガシー: Figma 経路（任意）

プラグイン負荷を避けられない場合のみ。ラフを `images/_raw/` に置けば Step 4.5 以降は同一です。

| 旧ステップ | 内容 |
| ---------- | ---- |
| Insert Big Image | ダウンサンプル回避の取り込み |
| 手動トリム | 余白・ノド |
| スライス（`S`） | セクション枠 |
| Export | PNG/JPG → `_raw/` |

旧フローでは Figma 上で Filter / Rename / TinyImage まで行っていました。現在それらは Python 側です。

### Step 4.5: コンタクトシート

```powershell
py -3.14 scripts/generate_contact_sheet.py scrolls/{scroll_id}/
```

- 出力: `images/_raw/contact_sheet.jpg`
- 本番既定: Brightness `1.05` / Sharpen `130%`（赤枠 `*`）

### Step 5: `process_figma_slices.py`

```powershell
py -3.14 scripts/process_figma_slices.py scrolls/{scroll_id}/ `
  --input-dir scrolls/{scroll_id}/images/_raw `
  --brightness 1.06 --sharpen 130 `
  --scene-text --force
```

| 処理 | 内容 |
|------|------|
| リサイズ | 高さ 1080px・LANCZOS |
| 補正 | Brightness / UnsharpMask（`--brightness` / `--sharpen`） |
| 出力 | JPEG・各 1MB 以下・`_NN-1080.jpg` |
| YAML | `scenes` 骨格（CSV があれば range 反映） |

### Step 6

[`scroll-pipeline.md`](./scroll-pipeline.md) / [`cursor-scroll-sync-prompt.md`](./cursor-scroll-sync-prompt.md) を参照。
