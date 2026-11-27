# uploadScrollApi モジュール設計仕様書（SPEC.md）

## 1. 概要と目的
Devハブの絵巻アップロード／検証API（`src/pages/api/dev/upload-scroll.js`）における、YAML生成・パース、2階層パイプライン変換、およびローカル検証メタデータ生成の責務を分離したバックエンドモジュール群です。

* **リファクタリング目的**: 単一ファイル（約1,500行）の肥大化解消と保守性向上
* **構成ファイル数**: 4ファイル（APIハンドラー本体 1 + 内部モジュール 3）
* **制約事項**: 循環参照の排除（単方向依存の維持）および既存API入出力仕様の完全互換

---

## 2. ファイル構成と責務一覧

| ファイルパス | 行数目安 | 主な責務 | 依存先（Import） |
| :--- | :---: | :--- | :--- |
| `src/pages/api/dev/upload-scroll.js` | ~450行 | HTTPリクエスト受付・バリデーション・画像デコード・オーサリングファイル書き出し・パイプライン実行制御 | `yamlCodec.js`, `localVerification.js`, `@/libs/scroll-pipeline/runScrollPipeline` |
| `src/libs/dev/uploadScrollApi/yamlCodec.js` | ~425行 | `scroll_config.yaml` のシリアライズ（生成）、メタデータ抽出、ローカル検証用YAMLパース | Node標準 (`fs`, `path`) |
| `src/libs/dev/uploadScrollApi/localVerification.js` | ~480行 | ローカル配信用画像コピー（`public/dev-scroll-images/`）、画像寸法読み取り、`scroll-metadata/scrolls/{titleen}.json` 生成 | Node標準 (`fs`, `path`), `panelsPipeline.js` |
| `src/libs/dev/uploadScrollApi/panelsPipeline.js` | ~225行 | 2階層構造（`scenes` 章 + `panels` 場面）の正規化・`chapters`/`panels` 出力・`emakis` 配列構築（LTR・複数スライス範囲対応） | Node標準 (`fs`) ※他モジュールへの依存なし |

---

## 3. 依存関係図（単方向アーキテクチャ）

循環インポートを防止するため、依存方向は以下の単方向に固定しています。

```mermaid
graph TD
    API["src/pages/api/dev/upload-scroll.js<br/>(HTTP Handler / Validation / File Write)"]
    YAML["src/libs/dev/uploadScrollApi/yamlCodec.js<br/>(YAML Serialize & Local Parser)"]
    LOCAL["src/libs/dev/uploadScrollApi/localVerification.js<br/>(Local Delivery & Metadata JSON Builder)"]
    PANELS["src/libs/dev/uploadScrollApi/panelsPipeline.js<br/>(2-Tier Scenes & Panels Pipeline)"]

    API --> YAML
    API --> LOCAL
    LOCAL --> PANELS
panelsPipeline.js の独立性: 画像寸法読み取りヘルパー（readImageDimensions*）は panelsPipeline.js 内にローカル関数として自己完結させており、localVerification.js への逆依存を断ち切っています。

4. 各モジュールの主要エクスポート関数
4.1 yamlCodec.js
YAMLシリアライズ: yamlQuote, yamlScalar, yamlLine, serializeYamlValue, serializeYamlObjectBody, serializeYamlObject, serializeScene, buildScrollConfigYaml

識別子抽出: extractScrollIdFromRawYaml, extractTitleenFromRawYaml

ローカル用YAMLパース: unquoteYamlScalar, parseBracketArray, parseFlowObject, readYamlBlockScalar, readScrollConfigForLocal

4.2 panelsPipeline.js
2階層データ変換: getPanelsConfig, buildViewerChapters, buildPanelsForViewer

スライス・見出しマッピング: sceneFirstGlobalIndex, panelSlotMetadata, buildEmakisForPanelsLocal

各章（chapter_id）の先頭スライスのみに章見出し（cat: "ekotoba", chapter_pill: true）を1回出力し、後続スライスへの重複を防止。

1つの panel が複数スライス（slice_range: [start, end]）にまたがる場合、範囲内の全スライス画像（cat: "image"）にパネルメタデータを付与して展開。

4.3 localVerification.js
ローカル配信・画像処理: copyScrollImagesToPublicDev, defaultLocalThumbPublicPath, patchMetadataJsonDeliveryLocal, applyLocalDeliveryToSyncedMetadata, readImageDimensionsFromBuffer, readImageDimensions, listSortedScrollImages

検証JSON生成: sceneTextFields, executeLocalVerification

5. メンテナンス指針
新しいYAMLフィールドを追加する場合: yamlCodec.js のシリアライザ／パーサーおよび panelsPipeline.js のメタデータマッピング（panelSlotMetadata）を更新してください。

本番同期パイプラインとの整合: panelsPipeline.js の出力仕様（chapters, panels, emakis 構造）は、scripts/sync_scroll.py の build_emakis_for_panels と同一契約を維持してください。

既存リント注意事項: upload-scroll.js 内の ensureR2CanaryTitle 参照はリファクタリング前からの既存コードのため、R2カナリア機能改修時に別途整理対象とします。