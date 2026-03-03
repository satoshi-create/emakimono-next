# Sync scroll script

`sync_scroll.py` は `scroll_config.yaml` を読み、画像を Cloudinary にアップロードし、Supabase の `scene_titles` と `images` に upsert します。

## 命名規則

- **Cloudinary public_id**: `{scroll_id}_{volume_num}_{chapter:02d}_{ordinal:02d}`
  例: `choju-giga-yamazaki-hei_3_01_01`（`ordinal` は章内の通し番号、1枚目なら 01）
- **DB `images.index`**: YAML の `range` の値（グローバルなフレーム番号 1, 2, … 14）
- **新形式のローカルファイル名**: 上記 public_id と同じ（例: `choju-giga-yamazaki-hei_3_01_01.jpg`）

### 古いファイル名の自動紐付け（手動リネーム不要）

`images/{scroll_id}/` 以下を**再帰的に**走査し、次のパターンで連番を検出します。

- ファイル名中の `_NN-` または `_NN.`（例: `cyoujyuu_yamazaki_hei_01-375.jpg`）から数字を抽出
- その数字を YAML の `range` で指定された index（1〜14 など）と対応付け
- 同じ index に複数ファイルがある場合（例: `01-375.jpg` と `01-1080.jpg`）は、**解像度の高い方を優先**（1080 > 800 > 375）して 1 枚だけアップロード
- アップロード時は上記の構造化 public_id で Cloudinary に登録されるため、ローカルでリネームする必要はありません

## 使い方

```bash
pip install -r scripts/requirements-sync.txt

# 環境変数（必須）
export CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="..."

# オプション: 画像ディレクトリ（未設定時は images/<scroll_id>/）
export SCROLL_IMAGES_DIR=./images/choju-giga-yamazaki-hei

python scripts/sync_scroll.py                    # デフォルトで ./scroll_config.yaml
python scripts/sync_scroll.py path/to/config.yaml
python scripts/sync_scroll.py --dry-run           # アップロード・DB 更新なし
python scripts/sync_scroll.py --skip-upload        # Cloudinary はスキップ、DB のみ
```

## GitHub Actions

`.github/workflows/sync-scroll.yml` を利用します。

- **手動**: Actions → "Sync scroll to Cloudinary and Supabase" → Run workflow
- **自動**: `main` への push で `scroll_config.yaml` または `images/**` が変更されたとき

リポジトリの Secrets に以下を設定してください。

- `CLOUDINARY_URL`（または `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`）
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Supabase テーブル

upsert に必要なユニーク制約は `supabase-sync-constraints.sql` を参照し、必要に応じて SQL エディタで実行してください。

- `scene_titles`: `(scroll_id, volume_num, chapter)` でユニーク
- `images`: `(scroll_id, volume_num, chapter, index)` でユニーク
