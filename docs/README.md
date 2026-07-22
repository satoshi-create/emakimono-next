# docs / ドキュメント

プロジェクト内に散逸していたドキュメントを整理したディレクトリです。

## 構成

```
docs/
├── README.md                 ← このファイル（目次）
├── architecture/             ← システム設計・データスキーマ
│   ├── viewer-architecture-analysis.md
│   ├── zukan-overview.md
│   ├── zukan-character-schema.md
│   ├── zukan-tool-schema.md
│   └── scrolls-data-model.md
├── operations/               ← 運用手順
│   ├── sync-workflow.md      ← 絵巻同期ワークフロー（メイン）
│   ├── ai-scroll-config-prompt.md  ← 汎用 AI 用 YAML 作成プロンプト
│   ├── naming-convention.md  ← Cloudinary 命名規則（B 形式）
│   ├── sync-scroll.md        ← sync_scroll.py CLI
│   └── github-actions-sync-manual.md  ← 旧手順（参考）
├── content/                  ← 作品解説コンテンツ（.md + .pdf）
│   ├── genji-emaki-hikime.md
│   ├── heian-hockey-mariuchi.md
│   ├── ansei-daijishin-saika-emaki.md
│   ├── gyoretsu-emaki-yuwaku.md
│   └── zouri-wo-uru-shounen.md
└── archive/                  ← アーカイブデータの記録
    └── genji-source.md
```

## 移動元マッピング

| 現在のパス | 元のパス |
|-----------|---------|
| `docs/architecture/viewer-architecture-analysis.md` | `src/docs/絵巻物ビューアー：構造分析書.md` ← 英字リライト |
| `docs/architecture/zukan-overview.md` | `src/zukan/README.md` |
| `docs/architecture/zukan-character-schema.md` | `src/zukan/templates/character-template.md` |
| `docs/architecture/zukan-tool-schema.md` | `src/zukan/templates/tool-template.md` |
| `docs/architecture/scrolls-data-model.md` | `src/zukan/3_scrolls/README.md` |
| `docs/operations/sync-workflow.md` | （新規）統合同期ワークフロー |
| `docs/operations/ai-scroll-config-prompt.md` | （新規）汎用 AI 用 YAML 作成プロンプト |
| `docs/operations/naming-convention.md` | （新規）B 形式命名規則 |
| `docs/operations/sync-scroll.md` | `scripts/README-sync.md` |
| `docs/content/*.md` | `src/docs/note_archive_post/*.md` |
| `docs/archive/genji-source.md` | `src/libs/_archive_unused_data/genji/source.md` |

## ルート直下に残したドキュメント

以下のファイルは GitHub の標準規約に従い、プロジェクトルートに残しています：

- `README.md` / `README_ja.md` — プロジェクト概要（GitHubが自動表示）
- `CONTRIBUTING.md` — コントリビューションガイド
- `CODE_OF_CONDUCT.md` — 行動規範
- `SECURITY.md` — セキュリティポリシー
