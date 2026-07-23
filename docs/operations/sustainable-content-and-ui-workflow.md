# サスティナブル運用：絵巻追加と UI 改善の並行ガイド

Free プラン（Cloudinary / Vercel Hobby）の上限内で、**1 絵巻 ≒ 10 枚**のコンテンツを少しずつ追加しつつ、UI の精度向上・リファクタリングを進めるための運用方針です。

同期パイプラインの詳細は [`sync-workflow.md`](./sync-workflow.md) を参照してください。

## 前提：2 つの上限

| サービス | 主な上限 | モニタリング先 |
|----------|----------|----------------|
| **Cloudinary Free** | 月 25 クレジット、Admin API 500/月 | `scripts/check_cloudinary_usage.py`、Console Usage Reports |
| **Vercel Hobby** | Fast Data Transfer ~100 GB、Edge Requests ~1M 等 | Vercel Dashboard → Usage |

**配信の分担:**

```
[ユーザー] ── HTML/JS/CSS ──→ Vercel
[ユーザー] ── 絵巻画像 ─────→ Cloudinary CDN（LazyImage custom loader）
```

絵巻画像の帯域・Impressions は **Cloudinary** に計上され、Vercel Usage には含まれません。

## 基本方針：2 レーンに分ける

コンテンツ追加と UI リファクタを **同じ PR・同じ週に混ぜない** ことを推奨します。

| レーン | 内容 | Cloudinary | 頻度目安 |
|--------|------|------------|----------|
| **A: コンテンツ追加** | YAML + 画像 → sync → JSON | アップロードあり | **月 2〜3 絵巻** |
| **B: UI リファクタ** | コンポーネント・レイアウト改善 | 触らない（URL 固定） | 随時 |

**ルール:**

- sync した週は **Cloudinary loader の URL パラメータを変えない**
- UI を大きく変えた週は **新絵巻の sync を控える**

---

## 月間バジェット（目安）

### Cloudinary

クレジット消費の主因は **帯域（Bandwidth）** です。Transformations や Storage より配信量が支配的になりやすい。

| 操作 | 1 絵巻（10 枚）あたり目安 |
|------|--------------------------|
| アップロード | Admin API ~10 回、クレジットほぼ 0 |
| ストレージ | +40〜80 MB → ~0.04〜0.08 クレジット |
| 初回アクセス後の帯域 | トラフィック次第（クレジット主因） |

**目安:** `credits.usage` が **18 未満** なら新絵巻追加 OK。**20 超** で追加ペースを落とす。

### Vercel

- 絵巻 10 枚追加自体は Vercel 帯域にほぼ効かない（Cloudinary 直配信）
- **Edge Requests / ISR Reads** が ~50% 付近なら、アクセス急増時に要監視

---

## レーン A：1 絵巻追加の標準手順

### Phase 0: 事前チェック

```powershell
$env:PYTHONIOENCODING = "utf-8"
py -3.14 scripts/preflight_scroll.py scrolls/my-new-scroll/scroll_config.yaml
py -3.14 scripts/check_cloudinary_usage.py --warn-at 18 --fail-at 20
```

`--warn-at` で警告、`--fail-at` で exit 1（sync 前ゲート）。JSON 保存不要なら `--no-save`。

`preflight_scroll.py` は Cloudinary API を呼びません。usage チェックは Admin API を **1 回** 消費します。

`sync_all.py` 実行時も preflight が **自動で先に走ります**（`--skip-preflight` で省略可）。検証のみ:

```powershell
py -3.14 scripts/sync_all.py scrolls/my-new-scroll/scroll_config.yaml --preflight
```

画像の事前条件（Cloudinary Free）:

- 各ファイル **≤ 10 MB**
- 解像度 **≤ 25 MP**
- 高さ **1080px 前後**（`_01-1080.jpg` 形式で可）

### Phase 1: ローカル準備（Cloudinary に触らない）

```powershell
Copy-Item -Recurse scrolls\_template scrolls\my-new-scroll
# または
py -3.14 scripts/create-project.py my-new-scroll
```

1. `scrolls/{scroll_id}/scroll_config.yaml` を編集
   - `scroll_id`（kebab-case）
   - `metadata.titleen` / `metadata.id`（**既存と重複しないこと**）
   - `scenes[].range`（合計 = 画像枚数）
2. `scrolls/{scroll_id}/images/` に画像を配置
3. 词書が必要なら `scenes[].text` を YAML に記述

命名規則: [`naming-convention.md`](./naming-convention.md)  
YAML 草案: [`ai-scroll-config-prompt.md`](./ai-scroll-config-prompt.md)

### Phase 2: ドライラン（必須）

```powershell
py -3.14 scripts/preflight_scroll.py scrolls/my-new-scroll/scroll_config.yaml
py -3.14 scripts/sync_all.py scrolls/my-new-scroll/scroll_config.yaml --dry-run
```

確認:

- [ ] `public_id` が B 形式（`scroll-id__scroll-id_1_01__01`）
- [ ] 画像枚数 = `scenes` range 合計
- [ ] `titleen` / `metadata.id` が既存と被らない

### Phase 3: 本番 sync（1 回だけ）

```powershell
py -3.14 scripts/sync_all.py scrolls/my-new-scroll/scroll_config.yaml
```

**禁止・非推奨:**

| フラグ / 操作 | 理由 |
|---------------|------|
| `--force-upload` | 全件再アップロード。Admin API・クレジットを浪費 |
| `--remote-check` | Admin API 増加。通常は `.upload-cache.json` で十分 |
| 同じ絵巻の sync ループ | 二重処理・上限消費 |

成功後の更新物:

- `src/data/json-data/dataEmakis.json`
- `src/data/image-metadata-cache/image-metadata-cache.json`
- `scrolls/{scroll_id}/.upload-cache.json`（再 sync 時のスキップ用）

### Phase 4: ローカル確認 → デプロイ

1. `npm run dev` で `/[titleen]` を開く
2. 横スクロール・词書・段数を目視
3. YAML + images + JSON を **同一 PR** で commit

**GitHub Actions 注意:**  
`.github/workflows/validate-scroll.yml` が PR で **preflight + dry-run** を自動実行（upload なし・secrets 不要）。  
`.github/workflows/sync-scroll.yml` は **手動実行のみ**（push トリガーなし）。  
Cloudinary アップロードは **ローカルで sync** し、JSON を同一 PR で commit するのが正攻法です。  
CI から upload する場合は workflow の `skip_upload` を **false** にする（明示 opt-in）。二重アップロードに注意。

### Phase 5: sync 後モニタリング

```powershell
py -3.14 scripts/check_cloudinary_usage.py --warn-at 18 --fail-at 20
```

1 絵巻追加後の目安: credits +0.1〜0.3、storage +40〜80 MB。

---

## レーン B：UI リファクタ（コンテンツと分離）

### 固定しておくもの（クレジット節約）

`src/components/emaki/viewer/LazyImage.js` の Cloudinary 変換 URL:

```
fl_progressive,f_jpg,w_{width},q_75
```

リファクタ中は **このパラメータを変更しない**。  
レイアウト・スケルトン・`sizes`・スクロール挙動の改善は OK。

Transformations が Impressions より少ないのは CDN キャッシュが効いている正常状態。  
loader の `w_` / `q_` を変えると **新しい変換 URL** が増え、クレジットを消費しやすい。

### YAML / 词書だけ直す

```powershell
py -3.14 scripts/sync_all.py scrolls/my-scroll/scroll_config.yaml --skip-upload
```

Cloudinary / Admin API **ゼロ** で JSON のみ更新。

### UI コードだけ直す

- `sync_all.py` は **実行しない**
- デプロイ前に既存絵巻 1〜2 作品で目視確認

### 避ける API

- `src/pages/api/updatejson.js` — 全画像の Admin API 一括取得
- `src/pages/api/cloudinary.js` — search API（max 500 件）

メタデータ更新は **sync パイプライン** に寄せる。

---

## 推奨スケジュール例（8 週間で 4 絵巻）

| 週 | レーン A（コンテンツ） | レーン B（UI） |
|----|------------------------|----------------|
| 1 | 絵巻 #1: YAML + 画像 + sync | — |
| 2 | — | LazyImage / `sizes` 改善（URL 固定） |
| 3 | 絵巻 #2 sync | — |
| 4 | — | 词書 UI / スクロール精度 |
| 5 | 絵巻 #3 sync | — |
| 6 | credits 確認 | フルスクリーン・再生モード |
| 7 | 絵巻 #4 sync | — |
| 8 | 全体回帰テスト | 計測確認 |

---

## 1 絵巻追加チェックリスト

```
□ metadata.id / titleen が dataEmakis.json と重複しない
□ preflight_scroll.py が OK
□ 画像 ≤ 10MB、1080 前後
□ --dry-run OK
□ sync は 1 回（--force-upload なし）
□ ローカルで /[titleen] 確認
□ dataEmakis.json + cache + YAML + images を同 PR
□ GitHub Actions は手動のみ（push で sync されない）
□ check_cloudinary_usage.py で credits 確認
```

---

## モニタリング

### Cloudinary（画像・クレジット）

```powershell
py -3.14 scripts/check_cloudinary_usage.py --warn-at 18 --fail-at 20
py -3.14 scripts/check_cloudinary_usage.py --json --no-save
py -3.14 scripts/check_cloudinary_usage.py --date 2026-07
```

| オプション | 意味 |
|-----------|------|
| `--warn-at N` | credits.usage ≥ N で警告（stderr） |
| `--fail-at N` | credits.usage ≥ N で **exit 1** |
| `--no-save` | `cloudinary-usage.json` を書かない |
| `--output PATH` | JSON 保存先 |
| `--json` | フル JSON を stdout に出力 |
| `--date YYYY-MM` | 指定月の usage |

| フィールド | 意味 |
|-----------|------|
| `credits.usage` / `credits.limit` | 月間クレジット（最重要） |
| `bandwidth.usage` | 配信バイト数（クレジット主因） |
| `transformations.usage` | 変換回数 |
| `storage.usage` | ストレージ |

`cloudinary-usage.json` は `.gitignore` 対象（ローカル確認用）。

### Vercel（サイト本体）

Dashboard → **Usage** → Last 30 days

優先指標: **Fast Data Transfer**、**Edge Requests**、**ISR Reads**

`vercel usage` は Hobby では `Costs not found (404)` になりやすい。Usage ページを使う。

---

## 上限に近づいたとき

| 信号 | 対処 |
|------|------|
| Cloudinary `credits.usage` **> 20** | 新絵巻追加を翌月まで延期 |
| Vercel Edge / ISR **> 80%** | デプロイ頻度を下げる |
| Transformations 急増 | loader / `sizes` 変更を見直す |
| Admin API エラー | sync 停止、`--skip-upload` のみ |

---

## Cursor Agent プロンプト例

**コンテンツ追加:**

```
scrolls/{scroll-id}/ の scroll_config.yaml と images/ を確認し、
scenes の range を画像枚数に合わせてから
py -3.14 scripts/sync_all.py scrolls/{scroll-id}/scroll_config.yaml --dry-run
を実行。OK なら sync（--force-upload 禁止）。完了後 check_cloudinary_usage.py。
```

**UI リファクタ:**

```
LazyImage / EmakiImage のレイアウト精度を改善。
Cloudinary loader の URL パラメータ（w_, q_, f_jpg）は変更しない。
sync_all.py は実行しない。
```

---

## 関連ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [`sync-workflow.md`](./sync-workflow.md) | 同期パイプライン全体 |
| [`naming-convention.md`](./naming-convention.md) | B 形式 public_id |
| [`ai-scroll-config-prompt.md`](./ai-scroll-config-prompt.md) | YAML 草案プロンプト |
| [`sync-scroll.md`](./sync-scroll.md) | sync_scroll.py CLI |
| [`sustainable-content-and-ui-workflow.md`](./sustainable-content-and-ui-workflow.md) | Free プラン向け並行運用 |
| `scripts/preflight_scroll.py` | sync 前検証 CLI |
| `scripts/check_cloudinary_usage.py` | Cloudinary usage 取得 |
