# ボード機能仕様書（`viewer/board`）

## 1. 全体アーキテクチャとファイル構成

`viewer/polaroid/` からボード関連モジュールを `viewer/board/` へ分離し、権限・お題ルール・URL生成・ハブ解決を `polaroidBoardPolicy.js` に集約しました。また、`PolaroidBoardInfoCard.jsx` 内で `usePolaroidBoardMeta` を直接利用することで、`PolaroidBoardView.jsx` からの過剰なメタ関連Propsバケツリレーを削減しています。

```mermaid
graph TD
    Page["/board & /board/public<br/>(ボード画面・公開一覧)"] --> View["PolaroidBoardView.jsx<br/>(キャンバスPan/Zoom・カード配置・操作制御)"]
    View --> Header["PolaroidBoardHeader.jsx<br/>(ヘッダー・個人/公開切替)"]
    View --> Tabs["PolaroidBoardTabs.jsx<br/>(ボード/テーマタブ切替・作成)"]
    View --> InfoCard["PolaroidBoardInfoCard.jsx<br/>(ボード情報・お題バナー・メタ編集)"]
    View --> Card["PolaroidBoardCard.jsx<br/>(カード描画・扇面レイアウト・操作)"]

    InfoCard --> MetaHook["usePolaroidBoardMeta.js<br/>(メタ状態・保存ハンドラ)"]
    View --> Policy["polaroidBoardPolicy.js<br/>(権限・お題ルール・URL生成・定数)"]
    InfoCard --> Policy
    Card --> Policy
    MetaHook --> Policy

    View --> Storage["polaroidBoardStorage.js<br/>(個人ボード永続化・共有URLエンコード/デコード)"]
    MetaHook --> Storage
    Card -.->|Offscreen Canvas描画| Renderer["../polaroid/polaroidCanvasRenderer.js"]
    View -.->|?slice=&cx=&cy=&cz= 遷移| SpotNav["useEmakiSpotNavigation.js"]
```

## 2. 主要ファイルと責務一覧

| ファイル | 種別 | 主な責務 |
|---------|------|----------|
| `PolaroidBoardView.jsx` | View / Orchestrator | ボード画面全体の統括、キャンバスPan/Zoom、カードドラッグ/選択、共有ボードの個人保存 |
| `PolaroidBoardHeader.jsx` | View | ボード上部ヘッダー、個人ボード／公開ボードモード切替 |
| `PolaroidBoardTabs.jsx` | View | タブ一覧表示、タブ選択、新規テーマ作成トリガー |
| `PolaroidBoardInfoCard.jsx` | View + State | ボードタイトル・説明・関連ハブ編集、お題バナー表示、`usePolaroidBoardMeta` 連携 |
| `PolaroidBoardCard.jsx` | View | 単体カード（ポラロイド／扇面 `layoutMode: "senmen"`）描画、いいね・共有・公開投稿・元絵巻リンク |
| `usePolaroidBoardMeta.js` | Hook / State | 個人・公開ボードのメタ情報状態管理、`<!--hubs:...-->` パース/シリアライズ、保存ハンドラ |
| `polaroidBoardPolicy.js` | Pure Logic | 権限判定（`getBoardPermissions` / `getBoardCardPermissions`）、お題ルール（`parseOdaiMeta` / `computeCardRuleBadges`）、`buildSourceHref`、`resolveRelatedThemeHub`、ストレージキー定数 |
| `polaroidBoardStorage.js` | Storage | localStorage への個人ボードCRUD、共有URL用Base64URLエンコード/デコード |
| `PolaroidBoardView.module.css` | Style | ボードレイアウト・キャンバス・カード関連スタイル |

## 3. 主要データフロー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant View as PolaroidBoardView
    participant Info as PolaroidBoardInfoCard
    participant Meta as usePolaroidBoardMeta
    participant Policy as polaroidBoardPolicy
    participant Storage as polaroidBoardStorage

    User->>View: ボード画面（/board?room=... 等）を開く
    View->>Policy: getBoardPermissions / parseOdaiMeta 参照
    Info->>Meta: usePolaroidBoardMeta 呼び出し
    User->>Info: タイトル・説明・関連ハブを編集して保存
    Info->>Meta: 保存ハンドラ発火
    Meta->>Storage: 個人メタ更新（またはAPI更新）
    User->>View: カードの「元絵巻・座標 →」をクリック
    View->>Policy: buildSourceHref(item) で ?slice=&cx=&cy=&cz= 生成
    Policy-->>User: 該当絵巻スポットへ遷移
```

## 4. 削除・統合済みレガシーファイル一覧

| 旧ファイル | 対応内容 | 統合先 / 備考 |
|-----------|----------|---------------|
| `polaroidBoardHelpers.js` | 削除（機能統合） | `polaroidBoardPolicy.js` に `ACTIVE_COLLAB_ROOM_KEY`・`AUTHOR_NAME_KEY`・`resolveRelatedThemeHub`・`buildSourceHref` を統合 |