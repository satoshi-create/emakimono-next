# Sync scroll script

`sync_scroll.py` は `scroll_config.yaml` を読み、画像を Cloudinary にアップロードします。  
統合パイプラインは [`sync-workflow.md`](./sync-workflow.md) を参照。

## 命名規則（B 形式 — 正規）

- **Cloudinary public_id**: `{scroll_id}__{scroll_id}_{volume}_{chapter:02d}__{ordinal:02d}`
  例: `choju-giga-yamazaki-kou__choju-giga-yamazaki-kou_1_01__01`
- **DB `images.index`**: YAML の `range` の値（グローバルなフレーム番号 1, 2, …）
- **ローカルファイル名**: 旧形式（`_01-1080.jpg`）でも可。連番で自動紐付け

### 古いファイル名の自動紐付け（手動リネーム不要）

画像ディレクトリを**再帰的に**走査し、次のパターンで連番を検出します。

- ファイル名中の `_NN-` または `_NN.`（例: `cyoujyuu_yamazaki_hei_01-375.jpg`）から数字を抽出
- その数字を YAML の `range` で指定された index と対応付け
- 同じ index に複数ファイルがある場合は、**解像度の高い方を優先**（1080 > 800 > 375）

## 画像ディレクトリの自動検出

優先順:

1. `SCROLL_IMAGES_DIR` 環境変数（`{dir}/{scroll_id}/` または `{dir}/`）
2. config と同じフォルダの `images/`
3. `scrolls/{scroll_id}/images/`
4. `images/{scroll_id}/`
5. `public/images/{scroll_id}/`

## 使い方

```bash
pip install -r scripts/requirements-sync.txt

export CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"

python scripts/sync_scroll.py scrolls/my-scroll/scroll_config.yaml
python scripts/sync_scroll.py scrolls/my-scroll/scroll_config.yaml --dry-run
python scripts/sync_scroll.py scrolls/my-scroll/scroll_config.yaml --skip-upload
```

## GitHub Actions

`.github/workflows/sync-scroll.yml` を利用します（**手動実行のみ**）。

- **手動**: Actions → "Sync scroll to Cloudinary" → Run workflow
- **config_path**: 必須（例: `scrolls/my-scroll/scroll_config.yaml`）
- **skip_upload**: デフォルト `true`（JSON のみ）。CI からアップロードする場合のみ `false`
- Secrets: `CLOUDINARY_URL`（upload 時のみ）

`scroll_config.yaml` の push では workflow は **起動しません**（ローカル sync + JSON commit を正とする）。

## 関連

- 命名規則: [`naming-convention.md`](./naming-convention.md)
- 統合ワークフロー: [`sync-workflow.md`](./sync-workflow.md)
