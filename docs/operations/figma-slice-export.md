# Figma Slice Export Manual

本書は、絵巻物デジタルアーカイブ制作において、高精細な絵巻パノラマ原画をFigmaに取り込み、セクション（段）ごとに分割して書き出したうえで、**ビューアー用アセット（`_01-1080.jpg` 等）と `scroll_config.yaml` 骨格を Python で自動生成する**標準作業手順です。

Figma のメモリ制限によるボケを避けるため、取り込みにはプラグインを使います。**高さ統一・色調補正・1MB 圧縮・連番リネームは Python（`process_figma_slices.py`）側**で行います。

---

## 1. ワークフロー概要と使用ツール


| ステップ | 使用機能 / ツール | 主な目的・作業内容 | 担当 |
| -------- | ----------------- | ------------------ | ---- |
| **事前準備** | 設計（段構成表） | 全セクションの境界を決定。`sources/scenes-summary.csv` に落とす | 人間 |
| **Step 1** | **Insert Big Image** | Figma の自動ダウンサンプリングを回避して原画を取り込み | 人間 |
| **Step 2** | Figma 標準ツール | 余計な余白・ノドのトリム（高さはおおよそで可） | 人間 |
| **Step 3** | スライスツール（`S`） | 絵柄を切断しない境界でセクション枠を配置 | 人間 |
| **Step 4** | Figma Export | スライスをラフな PNG/JPG として書き出し（任意ファイル名可） | 人間 |
| **Step 5** | **`process_figma_slices.py`** | 1080px・補正・1MB 未満 JPEG・`_NN-1080.jpg`・YAML 骨格 | Agent / 人間 |
| **Step 6** | preflight → sync | 上流ゲート後に Cloudinary sync（別ドキュメント） | Agent |


### 旧フローとの差分

以前は Figma 上で Filter / Rename It / TinyImage Compressor まで行っていました。現在は **トリム＋スライス＋ラフ書き出しまでが Figma**、以降はスクリプトです。

| 旧 Step（廃止・任意化） | 代替 |
|-------------------------|------|
| 高さ 1080px を Figma で厳密指定 | `process_figma_slices.py`（LANCZOS） |
| Fill Exposure + Filter Sharpen | Brightness 1.05 + UnsharpMask |
| Rename It（`_%N-1080`） | `_01-1080.jpg` 連番をスクリプトが付与 |
| TinyImage Compressor（JPG 90%・1MB） | JPEG `quality` 自動低下で 1MB 保証 |

---



## 2. 詳細手順ガイド



### 【事前準備】セクション設計（段構成の確定）

- 絵巻全体の物語展開に合わせて、何枚の画像に分割するか設計します。
- 妖怪の胴体、伸ばした尾、黒雲の筋など、重要なモチーフが中途半端に途切れない位置を境界とします。
- 確定後は `scrolls/{scroll_id}/sources/scenes-summary.csv` に `range_start` / `range_end` を記入（推奨）。CSV が無い場合、スクリプトは **1 画像 = 1 段** の骨格を作ります。



### Step 1: Insert Big Image による高画質取り込み

1. Figma 上部ツールバーのリソースアイコン（`Shift + I`）から「Plugins」タブを開き、**Insert Big Image** を起動します。
2. 原画ファイルを指定して読み込みます。プラグインが自動的に画像を分割・結合してキャンバス上に配置するため、Figma 特有のダウンサンプリング（ぼやけ）を回避してオリジナル精細度を保持できます。



### Step 2: 余白トリム（高さは厳密でなくてよい）

1. 原画の余白や書籍のノド部分の影など、不要な領域をトリミングします。
2. 高さはビューアー規格の **おおよそ 1080px 前後** で構いません。最終的な高さ統一は Step 5 のスクリプトが行います。
3. （任意）Fill の露出調整は Figma で軽く触ってもよいですが、必須ではありません。



### Step 3: スライス機能（S）による切り出し

1. キーボードの `S` を押してスライスツールを起動します。
2. 絵巻の右端（巻頭・第1段）から左端（巻末）に向かって、各セクションの切り出し枠をドラッグして作成します。
3. 横幅は妖怪や雲が切れないよう自然な背景地に合わせて調整します（目安: 1200px〜1800px 相当）。
4. スライス名は任意で構いません（連番リネームはスクリプト側）。



### Step 4: ラフ書き出し

1. すべてのスライスを選択し、Figma の Export で **PNG または JPG** を書き出します。
2. 出力先は次のどちらかにします（**`images/` 直下には置かない**）:
   - `scrolls/{scroll_id}/images/_raw/`
   - 任意の一時フォルダ（後で `--input-dir` に渡す）
3. この時点では 1MB 超過・非連番名・高さ不一致があって構いません。



### Step 5: `process_figma_slices.py`（必須）

依存:

```powershell
py -3.14 -m pip install -r scripts/requirements-scroll.txt
```

実行例（詞書なし・解説バーあり）:

```powershell
$env:PYTHONIOENCODING = "utf-8"
py -3.14 scripts/process_figma_slices.py scrolls/{scroll_id}/ `
  --input-dir scrolls/{scroll_id}/images/_raw `
  --scene-text `
  --force
```

スクリプトが行うこと:

| 処理 | 内容 |
|------|------|
| リサイズ | 高さ **1080px**・縦横比維持・`LANCZOS` |
| 補正 | Brightness `1.05`、UnsharpMask `radius=1.5, percent=130, threshold=3` |
| 出力 | JPEG（`optimize`）、各ファイル **1MB 以下**（quality を自動低下） |
| 命名 | `_01-1080.jpg`, `_02-1080.jpg`, …（1 始まり・欠番なし） |
| YAML | `scroll_config.yaml` の `scenes` 骨格。CSV があれば range を反映 |

オプション:

| フラグ | 意味 |
|--------|------|
| `--dry-run` | 書き込まず処理結果だけ表示 |
| `--force` | 既存の `_NN-*.jpg` を上書き |
| `--scene-text` | `metadata.sceneText: true` + `text.desc/descen` 空欄 |
| `--kotobagaki true\|false` | 既定 `false` |
| `--skip-yaml` | 画像のみ |
| `--scenes-csv PATH` | CSV パス明示 |

解説文は **`scenes[].text.desc` / `descen`** に書く（scene 直下の `desc` はパイプラインが読まない）。



### Step 6: 上流ゲート → sync

```powershell
py -3.14 scripts/normalize_scroll_images.py scrolls/{scroll_id}/ --dry-run
py -3.14 scripts/preflight_upstream.py scrolls/{scroll_id}/ --skip-similarity
# 目視 OK 後
py -3.14 scripts/sync_all.py scrolls/{scroll_id}/scroll_config.yaml --dry-run
```

詳細は [`docs/operations/scroll-pipeline.md`](operations/scroll-pipeline.md) と [`docs/operations/cursor-scroll-sync-prompt.md`](operations/cursor-scroll-sync-prompt.md) を参照。

---



## 3. 人間 / Agent の分担

| 人間 | Agent |
|------|-------|
| 段の切れ目・トリム・スライス・ラフ Export | `process_figma_slices.py` 実行 |
| コンタクトシート / 段の見た目 OK | preflight / dry-run / sync |
| 解説文の内容・校正 | YAML の `text.*` / `sceneText` 正規化 |
| 本番 upload の許可 | 結果報告（commit は指示時のみ） |

---



## 4. 次回制作時のチェックリスト

- [ ] プラグイン **Insert Big Image** が Saved にあるか
- [ ] 余白・ノドをトリムしたか
- [ ] スライス枠で妖怪の身体や小道具が切れていないか
- [ ] ラフを `images/_raw/`（または別 input-dir）に置いたか（`images/` 直下と混在させない）
- [ ] `process_figma_slices.py` で `_NN-1080.jpg` が揃い、各ファイル 1MB 以下か
- [ ] `scroll_config.yaml` の global index（1 始まり・欠番なし）と画像枚数が一致するか
- [ ] 詞書なしで解説バーを出す場合 `sceneText: true` と `scenes[].text` があるか
- [ ] 上流ゲート通過後に sync するか
