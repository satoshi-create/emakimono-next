# 📓 Operation Guidelines

このプロジェクトでは、データ管理と運用フローに以下のルールを採用します。

---

## 1. データ管理構造

### scroll.csv（元データ）

- 人間が編集・更新するファイル
- 管理対象カラム：
  - `title`（作品タイトル）
  - `era`（時代）
  - `description`（短い解説）
  - `image_path`（画像パス）
  - `source`（出典元情報）

### metadata.json（変換データ）

- Viewer が読み込むデータファイル
- scroll.csv から自動生成する（手動編集禁止）

---

## 2. 画像保存ルール

### MVP フェーズ

- 画像はローカル（`/public/emaki-images/`配下）に保存
- `scroll.csv`の`image_path`にはローカルパスを記述
  - 例：`/emaki-images/genji/genji_01-1080.png`

### 公開・運用フェーズ

- Cloudinary などの CDN に画像をアップロード
- `scroll.csv`の`image_path`を Cloudinary URL に切り替え
- Viewer はローカルパス・URL どちらにも対応できる設計とする

---

## 3. ファイルパスの扱い

| ステータス        | 記述例                                                                                |
| :---------------- | :------------------------------------------------------------------------------------ |
| ローカル開発中    | `/emaki-images/genji/genji_01-1080.png`                                               |
| Cloudinary 移行後 | `https://res.cloudinary.com/your-cloud-name/image/upload/vXXXXXXXX/genji_01-1080.png` |

※ ローカルパスの先頭に `/` をつけること！

---

## 4. データ更新フロー

```plaintext
1. scroll.csv を編集する
2. csv → metadata.json を変換する（スクリプトを使用）
3. 変更内容をコミット・プッシュする
4. PR時には scroll.csv と metadata.json の両方を換える
```

### 変換スクリプトについて

- MVP 段階は簡易スクリプト（Node.js 等）を使用
- 将来的には GitHub Actions 等で自動変換も検討可能

---

## 5. 注意事項

- **metadata.json を直接編集しないでください。** 必ず scroll.csv から生成してください。
- **出典（source カラム）記述を忘れないようにしてください。**（フリー素材も必須）
- **ファイル命名規則（素材ルール参照）を守ってください。**

---

# 🔖 まとめ

> 「scroll.csv = 編集するもの」
> 「metadata.json = 自動生成して使うもの」

この役割分担を必ず守って、データ管理を進めてください！
