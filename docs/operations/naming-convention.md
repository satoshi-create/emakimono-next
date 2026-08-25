# 命名規則（B 形式 — 正規）

絵巻画像の Cloudinary public_id は **B 形式** に統一します。

## public_id（Cloudinary）

```
{scroll_id}__{scroll_id}_{volume}_{chapter:02d}__{ordinal:02d}
```

| パーツ | 説明 | 例 |
|--------|------|-----|
| `scroll_id` | 作品 ID（先頭プレフィックス） | `choju-giga-yamazaki-kou` |
| `volume` | 巻番号 | `1` |
| `chapter` | 段（scene id） | `01` |
| `ordinal` | 段内の通し番号 | `01`, `02` |

**具体例**:

```
choju-giga-yamazaki-kou__choju-giga-yamazaki-kou_1_01__01
choju-giga-yamazaki-kou__choju-giga-yamazaki-kou_1_01__02
choju-giga-yamazaki-kou__choju-giga-yamazaki-kou_1_02__01
```

Cloudinary 上のフルパス:

```
emakimono/choju-giga-yamazaki-kou__choju-giga-yamazaki-kou_1_01__01.jpg
```

キャッシュ `src` 形式（**必須・CDN バスティング**）:

```
v1775033725/emakimono/choju-giga-yamazaki-kou__choju-giga-yamazaki-kou_1_01__01.jpg
```

- `sync_scroll.py` は upload / resource 応答の `version` を `src` 先頭に埋め込む
- ビューアは `buildCloudinaryUrl` で `.../upload/{transforms}/v{version}/emakimono/...` を組み立てる
- **version なしの `emakimono/...` だけだと、overwrite 後も変換 CDN キャッシュが旧のまま残る**
- upload 時は `overwrite=true` に加え **`invalidate=true`**（派生キャッシュ掃除）

## 識別子の役割

| 識別子 | 用途 | 形式 |
|--------|------|------|
| `scroll_id` | Cloudinary / `scrolls/` フォルダ名 | kebab-case（ハイフン） |
| `titleen` | URL スラッグ / JSON キー | レガシー可（アンダースコア等） |
| `theme_id` | テーマグループ | kebab-case |
| `metadata.id` | dataEmakis.json 数値 ID | 整数 |

**`scroll_id` と `titleen` は別物** — 混同しないこと。

## ローカル画像ファイル名

アップロード前は **柔軟に許容** します。`sync_scroll.py` が連番で拾います。

```
anything_01-1080.jpg   → global index 1
anything_02.jpg        → global index 2
```

事前リネームは不要。アップロード時に B 形式の public_id が付与されます。

## YAML scenes → public_id

```yaml
scenes:
  - id: 2              # chapter = 02
    range: [2, 3]      # global index 2,3 → ordinal 1,2
```

| global index | chapter | ordinal | public_id 末尾 |
|---|---|---|---|
| 2 | 2 | 1 | `..._1_02__01` |
| 3 | 2 | 2 | `..._1_02__02` |

## 廃止済み形式

| 形式 | 状態 |
|------|------|
| A: `cyoujyuu_yamazaki_kou_01-1080_xxx.jpg`（ルート直下） | 削除済み |
| C: `{scroll_id}_{vol}_{ch}_{ord}`（単一アンダースコア） | 非推奨。`sync_scroll.py` は B 形式を生成 |

## 実装

生成ロジック: `scripts/sync_scroll.py` の `image_public_id()`

```python
def image_public_id(scroll_id, volume_num, chapter, ordinal):
    key = f"{scroll_id}_{volume_num}_{chapter:02d}"
    return f"{scroll_id}__{key}__{ordinal:02d}"
```

## 参考

- ワークフロー: [`scroll-pipeline.md`](./scroll-pipeline.md)
- 旧リネームスクリプト（非推奨）: `src/script/rename.py`
