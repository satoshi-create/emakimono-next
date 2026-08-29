---
name: scroll-upload
description: >-
  絵巻 scroll sync オーケストレーション。Step 0v 画像認識 → scene-mapping.md →
  CSV/YAML 同期 → scroll_upload.py（preflight → sync → thumb/OGP → postflight）。
  metadata.desc の研究用語 lint、PR 用コミット範囲の遵守。
  Use when syncing a new scroll, running the scroll pipeline, or preparing a scroll PR.
---

# Scroll Upload Workflow

## When to use

- 新規絵巻の初回 sync（レーン A: コンテンツ追加）
- Figma ラフ後の `process_figma_slices.py` → sync 一連
- 段構成・解説文修正後の再 sync
- PR 前の preflight / dry-run 検証

## Required reading

1. `docs/operations/scroll-pipeline.md`（正本）
2. `docs/operations/cursor-scroll-sync-prompt.md`（Agent 用プロンプト）
3. `docs/operations/data-model.md`（scroll_id / titleen / metadata.id）
4. `docs/operations/naming-convention.md`（Cloudinary public_id）
5. サムネ生成時は `.cursor/skills/emaki-thumb/SKILL.md` も併読

## Prerequisites

- Windows: `py -3.14`、毎セッション `$env:PYTHONIOENCODING = "utf-8"`
- `py -3.14 -m pip install -r scripts/requirements-scroll.txt`
- `.cursorignore` で `scrolls/*/images/**` と `scrolls/*/sources/**` は Agent Read 可能（`scrolls/source/` 研究資料はブロックのまま）

## Pipeline overview

```
Step 0v  画像認識 → sources/scene-mapping.md
Step 0a  contact sheet → process_figma_slices.py（_raw/ がある場合）
Step 1   scroll_config.yaml レビュー（ID 重複・range・thumb パス）
Step 1.5 normalize → build_scene_mapping --check → preflight_upstream
Step 2   scroll_upload.py --dry-run → 本番 sync
Step 3   報告（更新ファイル一覧）→ PR 準備
```

## Step 0v: 画像認識（段構成前）

1. `scrolls/{scroll_id}/images/` を `Read` で開き Permission denied でないこと確認
2. 全スライスを目視同定し **`sources/scene-mapping.md`** に記録（研究用語・モジュール分析はここだけ）
3. `sources/scenes-summary.csv` を正本として段構成を確定（`confidence: draft` → 目視後 `reviewed`）
4. PIL 色比率などの ad-hoc ヒューリスティックをナラティブ根拠にしない

## CSV ↔ YAML 同期

```powershell
py -3.14 scripts/build_scene_mapping.py scrolls/{scroll_id}/ --check
py -3.14 scripts/build_scene_mapping.py scrolls/{scroll_id}/ --write-yaml   # CSV → YAML
py -3.14 scripts/build_scene_mapping.py scrolls/{scroll_id}/ --write-csv    # YAML → CSV
```

- `scene-mapping.csv` と `scenes-summary.csv` の共存は preflight **ERROR**
- `slot_types` に書くのは `image` / `ekotoba` のみ（`onset` 等の意味タグは YAML に書かない）

## metadata.desc 品質（preflight 自動）

`metadata.desc` / `metadata.descen` は**一般向け**（所蔵・時代・絵の内容）。次の研究用語は ERROR:

| 日本語 | 英語 |
|--------|------|
| AC型, Cモジュール, 請求記号, 真珠庵系, 系譜, モジュール脱落 | AC-lineage, C-module, call number, Shinju-an lineage |

モジュール分析・系譜は `sources/scene-mapping.md` に残す。

## 統合コマンド（推奨）

```powershell
$env:PYTHONIOENCODING = "utf-8"

# 検証のみ
py -3.14 scripts/scroll_upload.py scrolls/{scroll_id}/ --dry-run

# preflight のみ
py -3.14 scripts/scroll_upload.py scrolls/{scroll_id}/ --preflight-only

# 本番（preflight → usage → sync → thumb webp → OGP → postflight）
py -3.14 scripts/scroll_upload.py scrolls/{scroll_id}/

# contact sheet 未作成で補正スキップ承認済みのときのみ
py -3.14 scripts/scroll_upload.py scrolls/{scroll_id}/ --ack-no-color-correction
```

本番 sync では thumb / OGP 生成が**既定 ON**（`--no-thumb` / `--no-ogp` で省略可）。

## 個別コマンド（デバッグ用）

```powershell
py -3.14 scripts/preflight_scroll.py scrolls/{scroll_id}/scroll_config.yaml
py -3.14 scripts/check_cloudinary_usage.py --warn-at 18 --fail-at 20 --no-save
py -3.14 scripts/sync_all.py scrolls/{scroll_id}/scroll_config.yaml --dry-run
py -3.14 scripts/sync_all.py scrolls/{scroll_id}/scroll_config.yaml
```

## PR / コミット範囲

**コミットする（本番反映）:**

- `src/data/image-metadata-cache/image-metadata-cache.json`
- `src/data/emaki-text-data/{titleen}.json`（词書あり）
- `public/thumb/{titleen}_thumb.webp`
- `public/ogp/{titleen}.jpg`

**コミットしない（gitignore）:**

- `scrolls/{scroll_id}/images/` および `scrolls/` 全体
- `scrolls/{scroll_id}/.upload-cache.json`
- 分析一時物: `analytics/hyakki_*`, `public/_tmp_hyakki_analysis/`, `scripts/_hyakki_*.py`

## Rules

- `--force-upload` / `--remote-check` を使わない
- 同じ絵巻で sync をループしない
- GitHub Actions から upload しない（ローカル sync のみ）
- `sync_scroll.py` 単体ではなく `sync_all.py` / `scroll_upload.py` を主経路とする
- UI コード（LazyImage 等）は触らない（レーン B 以外）
- **commit / push はユーザー明示指示まで行わない**
- `images/_raw/` があるのに `generate_contact_sheet.py` を飛ばして sync しない
- ユーザーの補正値 GO または「補正スキップ承認」無しで本番 sync しない
- 研究用語を `metadata.desc` に書かない（preflight が ERROR）

## Failure handling

| 失敗 | 対応 |
|------|------|
| preflight ERROR | YAML / 画像 / ID 重複 / desc 文案を修正して再実行 |
| usage `--fail-at 20` | 本番 sync 中止、理由を報告 |
| dry-run NG | 本番 sync は実行しない |
| thumb 生成失敗 | `emaki-thumb` スキルで手動生成後 `--no-thumb` で再 sync 可 |

## Output

sync 成功後に報告する更新ファイル一覧:

- `local-data/pipeline/dataEmakis.json`（git 管理外・sync ツール用）
- `src/data/image-metadata-cache/image-metadata-cache.json`
- `src/data/emaki-text-data/{titleen}.json`
- `public/thumb/{titleen}_thumb.webp`
- `public/ogp/{titleen}.jpg`

See [`scroll-pipeline.md`](../../../docs/operations/scroll-pipeline.md) for the full runbook.
