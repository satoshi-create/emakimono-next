# scrolls — 絵巻同期ワークスペース

新規絵巻を追加するときは、このディレクトリ以下に **1 scroll = 1 フォルダ** で配置します。

## ディレクトリ構成

```
scrolls/
├── README.md                 ← このファイル
├── _template/                ← 新規作成用テンプレート
│   ├── scroll_config.yaml
│   └── images/               ← 画像をここに置く
├── _examples/                ← 完成例（参考用）
│   └── choju-giga-yamazaki-tei/
└── {scroll_id}/              ← 本番用（例: jigokusoushi-anzyuin/）
    ├── scroll_config.yaml
    └── images/
        ├── _01-1080.jpg      ← 旧ファイル名でも可
        └── ...
```

## クイックスタート

```powershell
# 1. テンプレートをコピー
Copy-Item -Recurse scrolls\_template scrolls\my-new-scroll

# 2. scroll_config.yaml を編集（scroll_id, metadata, scenes）

# 3. 画像を scrolls/my-new-scroll/images/ に配置

# 4. ドライラン
$env:PYTHONIOENCODING = 'utf-8'
py -3.14 scripts/preflight_scroll.py scrolls/my-new-scroll/scroll_config.yaml
python scripts/sync_scroll.py scrolls/my-new-scroll/scroll_config.yaml --dry-run

# 5. アップロード + JSON 更新
python scripts/sync_all.py scrolls/my-new-scroll/scroll_config.yaml
```

## 命名規則（概要）

| 識別子 | 用途 | 形式 |
|--------|------|------|
| `scroll_id` | Cloudinary / フォルダ名 | kebab-case（ハイフン） |
| `titleen` | URL スラッグ | レガシー形式可 |
| Cloudinary public_id | 画像 ID（B 形式） | `{scroll_id}__{scroll_id}_{vol}_{ch}__{ord}` |

詳細: [`docs/operations/naming-convention.md`](../docs/operations/naming-convention.md)

YAML 作成（汎用 AI）: [`docs/operations/ai-scroll-config-prompt.md`](../docs/operations/ai-scroll-config-prompt.md)

Free プラン向けの段階的追加・UI 並行運用: [`docs/operations/sustainable-content-and-ui-workflow.md`](../docs/operations/sustainable-content-and-ui-workflow.md)

## Cursor 自動化（将来）

プロンプト例:

> `scrolls/jigokusoushi-anzyuin/scroll_config.yaml` を確認し、images/ の画像枚数に合わせて scenes を更新してから `sync_all.py` をドライランしてください。
