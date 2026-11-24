# ポラロイド・扇面作成モーダル仕様書（`viewer/polaroid`）

## 1. 全体アーキテクチャとファイル構成

`viewer/polaroid/` はポラロイドおよび扇面（`layoutMode: "senmen"`）の切り抜き・Pan/Zoom・Canvas描画・共有/保存モーダルに特化した構成とし、ボード画面・ポリシー・永続化モジュールは `viewer/board/` へ分離しています。

```mermaid
graph TD
    Parent["絵巻ビューア本体<br/>(EmakiConteiner / useEmakiZoomBridge / useEmakiSpotNavigation)"] -->|Props・初期Pan/Zoom| Modal["PolaroidModal.js<br/>(%座標 cx,cy,cz 算出・モーダル制御)"]

    Modal <-->|Pan/Zoom状態・操作| PanZoom["usePolaroidPanZoom.js"]
    Modal -->|シーン情報| Meta["usePolaroidChapterMetadata.js"]
    Modal -->|isOpen / frameRef| ScrollLock["usePolaroidScrollLock.js"]
    Modal -->|メタ・座標・テーマ| Export["usePolaroidExport.js"]
    Modal -->|切り抜き枠・扇面プレビュー| PreviewFrame["PolaroidPreviewFrame.jsx"]
    Modal -->|シート表示・フォーマット選択| ShareSheet["PolaroidShareSheet.jsx"]
    Modal -->|保存・ボード追加操作| Footer["PolaroidModalFooter.jsx"]

    PreviewFrame --> Renderer["polaroidCanvasRenderer.js<br/>(Offscreen Canvas描画・扇面ジオメトリ)"]
    Export --> Renderer
    PanZoom --> Renderer
    Footer -->|appendBoardItem| BoardStorage["../board/polaroidBoardStorage.js"]
```

## 2. 主要ファイルと責務一覧

| ファイル | 種別 | 主な責務 |
| --- | --- | --- |
| PolaroidModal.js | View / Orchestrator | モーダル描画、実描画領域からの % 座標（cx, cy, cz）算出、各フック・サブUIの統合 |
| PolaroidPreviewFrame.jsx | View | ポラロイド／扇面（senmen）レイアウトの写真表示フレーム、扇面SVG逆抜きマスク、3スライスパノラマストリップ描画 |
| usePolaroidPanZoom.js | Hook | ホイール／ドラッグ／ピンチ操作による Pan・Zoom 更新とクランプ |
| usePolaroidChapterMetadata.js | Hook | 詞書・章タイトル・作品名メタデータの解決 |
| usePolaroidScrollLock.js | Hook | モーダル表示中の body スクロール固定とカード外 wheel イベント遮断 |
| usePolaroidExport.js | Hook | 4:5 / 9:16 / 動画などの Canvas 合成・ダウンロード・共有制御 |
| polaroidCanvasRenderer.js | Pure Logic / Canvas | テーマテクスチャ・扇面ジオメトリ（getSenmenFanGeometry）・Canvasピクセル描画 |
| PolaroidShareSheet.jsx | View | 保存・SNS/Shorts 共有フォーマット選択 UI |
| PolaroidModalFooter.jsx | View | フッターアクション（ボードへ追加・保存・共有トリガー） |
| PolaroidModal.anim.module.css | Style | ポラロイドモーダルのアニメーション・レイアウトスタイル |

## 3. 主要データフロー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Modal as PolaroidModal
    participant PanZoom as usePolaroidPanZoom
    participant Export as usePolaroidExport
    participant Footer as PolaroidModalFooter
    participant BoardStorage as ../board/polaroidBoardStorage

    User->>Modal: 切り抜き位置を調整（ドラッグ / ホイール / ピンチ）
    Modal->>PanZoom: 操作イベント委譲
    PanZoom-->>Modal: pan / zoom 更新
    User->>Footer: 「ボードに貼る」を押下
    Modal->>Modal: cx, cy, cz（%座標）を算出
    Footer->>BoardStorage: appendBoardItem 呼び出し
```

## 4. viewer/board/ へ移管・統合済みファイル一覧

以下のファイルは `viewer/polaroid/` から `viewer/board/` へ移管、または `polaroidBoardPolicy.js` へ統合されました。

- `viewer/board/PolaroidBoardView.jsx`
- `viewer/board/PolaroidBoardHeader.jsx`
- `viewer/board/PolaroidBoardTabs.jsx`
- `viewer/board/PolaroidBoardInfoCard.jsx`
- `viewer/board/PolaroidBoardCard.jsx`
- `viewer/board/PolaroidBoardView.module.css`
- `viewer/board/usePolaroidBoardMeta.js`
- `viewer/board/polaroidBoardPolicy.js`（旧 `polaroidBoardHelpers.js` の定数・ヘルパーを統合）
- `viewer/board/polaroidBoardStorage.js`