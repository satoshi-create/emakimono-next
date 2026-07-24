# scrolls — 絵巻同期ワークスペース

新規絵巻を追加するときは、このディレクトリ以下に **1 scroll = 1 フォルダ** で配置します。

## 次に読む

**[scroll-pipeline.md](../docs/operations/scroll-pipeline.md)** — 自動化パイプラインの**正本**（手順・preflight・CI・運用方針）

| 用途 | ドキュメント |
|------|-------------|
| YAML 草案（汎用 AI プロンプト） | [`ai-scroll-config-prompt.md`](../docs/operations/ai-scroll-config-prompt.md) |
| Cursor Agent 用 sync プロンプト | [`cursor-scroll-sync-prompt.md`](../docs/operations/cursor-scroll-sync-prompt.md) |
| Cloudinary B 形式命名 | [`naming-convention.md`](../docs/operations/naming-convention.md) |

## ディレクトリ構成

```
scrolls/
├── README.md                 ← このファイル
├── _template/                ← 新規作成用テンプレート
│   ├── scroll_config.yaml
│   └── images/
├── _examples/                ← 完成例（参考用）
│   ├── choju-giga-yamazaki-tei/
│   └── eshi-no-soshi/        ← explicit + slots（絵師草紙型）
└── {scroll_id}/              ← 本番用（例: jigokusoushi-anzyuin/）
    ├── scroll_config.yaml
    └── images/
        ├── _01-1080.jpg      ← 旧ファイル名でも可
        └── ...
```

### 词書レイアウト（3 パターン）

| モード | 用途 | 例 |
|--------|------|-----|
| `alternating` | 词書・絵画が交互（地獄草紙型） | `jigokusoushi-anzyuin/` |
| 省略（default） | 空 ekotoba + 絵のみ（餓鬼草紙型） | `gakisoushi-kawamoto/` |
| `explicit` + `scenes[].slots` | 任意配置（絵師草紙型） | `eshi-no-soshi/` · [`_examples/eshi-no-soshi/`](_examples/eshi-no-soshi/scroll_config.yaml) |

詳細: [`scroll-pipeline.md` §4](../docs/operations/scroll-pipeline.md#词書scenestext)

## クイックスタート

詳細は [`scroll-pipeline.md` §3](../docs/operations/scroll-pipeline.md#3-レーン-a1-絵巻追加) を参照。

```powershell
$env:PYTHONIOENCODING = "utf-8"

# 1. テンプレートをコピー
Copy-Item -Recurse scrolls\_template scrolls\my-new-scroll

# 2. scroll_config.yaml を編集、images/ に画像を配置

# 3. 検証
py -3.14 scripts/preflight_scroll.py scrolls/my-new-scroll/scroll_config.yaml
py -3.14 scripts/check_cloudinary_usage.py --warn-at 18 --fail-at 20 --no-save
py -3.14 scripts/sync_all.py scrolls/my-new-scroll/scroll_config.yaml --dry-run

# 4. 本番 sync（.env.local に CLOUDINARY_URL）
py -3.14 scripts/sync_all.py scrolls/my-new-scroll/scroll_config.yaml
```

PR では `validate-scroll.yml` が preflight + dry-run を自動実行します。
