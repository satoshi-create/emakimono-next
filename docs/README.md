# docs / ドキュメント

プロジェクト内に散逸していたドキュメントを整理したディレクトリです。

## 絵巻同期パイプライン（入口）

| 用途 | ドキュメント |
|------|-------------|
| **手順・CI・運用（正本）** | [`operations/scroll-pipeline.md`](./operations/scroll-pipeline.md) |
| Cursor Agent 用 sync プロンプト | [`operations/cursor-scroll-sync-prompt.md`](./operations/cursor-scroll-sync-prompt.md) |
| YAML 草案（汎用 AI プロンプト） | [`operations/ai-scroll-config-prompt.md`](./operations/ai-scroll-config-prompt.md) |
| Cloudinary B 形式命名 | [`operations/naming-convention.md`](./operations/naming-convention.md) |
| ワークスペース入口 | [`scrolls/README.md`](../scrolls/README.md) |

以下は **`scroll-pipeline.md` に統合済み**（リダイレクト stub のみ）:

- `sync-workflow.md`
- `sustainable-content-and-ui-workflow.md`
- `sync-scroll.md`

旧 Supabase 時代の手順: [`archive/github-actions-sync-manual.md`](./archive/github-actions-sync-manual.md)

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
│   ├── scroll-pipeline.md    ← 絵巻同期パイプライン（正本）
│   ├── cursor-scroll-sync-prompt.md  ← Cursor Agent 用 sync プロンプト
│   ├── ai-scroll-config-prompt.md  ← 汎用 AI 用 YAML 作成プロンプト
│   ├── naming-convention.md  ← Cloudinary 命名規則（B 形式）
│   ├── sync-workflow.md      ← → scroll-pipeline.md へ
│   ├── sustainable-content-and-ui-workflow.md  ← → scroll-pipeline.md へ
│   ├── sync-scroll.md        ← → scroll-pipeline.md 付録 A へ
│   └── github-actions-sync-manual.md  ← → archive へ
├── content/                  ← 作品解説コンテンツ（.md + .pdf）
│   ├── genji-emaki-hikime.md
│   ├── heian-hockey-mariuchi.md
│   ├── ansei-daijishin-saika-emaki.md
│   ├── gyoretsu-emaki-yuwaku.md
│   └── zouri-wo-uru-shounen.md
└── archive/                  ← アーカイブ
    ├── genji-source.md
    └── github-actions-sync-manual.md  ← 旧 Supabase 時代（非推奨）
```

## 移動元マッピング

| 現在のパス | 元のパス |
|-----------|---------|
| `docs/architecture/viewer-architecture-analysis.md` | `src/docs/絵巻物ビューアー：構造分析書.md` ← 英字リライト |
| `docs/architecture/zukan-overview.md` | `src/zukan/README.md` |
| `docs/architecture/zukan-character-schema.md` | `src/zukan/templates/character-template.md` |
| `docs/architecture/zukan-tool-schema.md` | `src/zukan/templates/tool-template.md` |
| `docs/architecture/scrolls-data-model.md` | `src/zukan/3_scrolls/README.md` |
| `docs/operations/scroll-pipeline.md` | `sync-workflow.md` + `sustainable-content-and-ui-workflow.md` + `sync-scroll.md` を統合 |
| `docs/operations/ai-scroll-config-prompt.md` | （新規）汎用 AI 用 YAML 作成プロンプト |
| `docs/operations/naming-convention.md` | （新規）B 形式命名規則 |
| `docs/archive/github-actions-sync-manual.md` | `docs/operations/github-actions-sync-manual.md` |
| `docs/content/*.md` | `src/docs/note_archive_post/*.md` |
| `docs/archive/genji-source.md` | `src/libs/_archive_unused_data/genji/source.md` |

## ルート直下に残したドキュメント

以下のファイルは GitHub の標準規約に従い、プロジェクトルートに残しています：

- `README.md` / `README_ja.md` — プロジェクト概要（GitHubが自動表示）
- `CONTRIBUTING.md` — コントリビューションガイド
- `CODE_OF_CONDUCT.md` — 行動規範
- `SECURITY.md` — セキュリティポリシー
