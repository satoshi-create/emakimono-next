# ボード機能仕様書（`viewer/board`）

## 1. 全体アーキテクチャとファイル構成

`viewer/polaroid/` からボード関連モジュールを `viewer/board/` へ分離し、権限・お題ルール・URL生成・ハブ解決を `polaroidBoardPolicy.js` に集約しました。さらに `PolaroidBoardView.jsx` からデータ同期・通信ロジックを `usePolaroidBoardSync.js` へ、キャンバスPan/Zoom・カードドラッグ処理を `usePolaroidBoardCanvas.js` へ分離しています。

```mermaid
graph TD
    Page["/board & /board/public<br/>(ボード画面・公開一覧)"] --> View["PolaroidBoardView.jsx<br/>(ボード画面統括・JSXレイアウト)"]
    View --> SyncHook["usePolaroidBoardSync.js<br/>(コラボ同期・共有URL復元・CRUD)"]
    View --> CanvasHook["usePolaroidBoardCanvas.js<br/>(キャンバスPan/Zoom・カードドラッグ)"]
    View --> MetaHook["usePolaroidBoardMeta.js<br/>(メタ状態・タブ・保存ハンドラ)"]
    View --> Header["PolaroidBoardHeader.jsx<br/>(ヘッダー・個人/公開切替)"]
    View --> Tabs["PolaroidBoardTabs.jsx<br/>(ボード/テーマタブ切替・作成)"]
    View --> InfoCard["PolaroidBoardInfoCard.jsx<br/>(ボード情報・お題バナー・メタ編集)"]
    View --> Card["PolaroidBoardCard.jsx<br/>(ボード座標配置・操作スロット・扇面プレビュー)"]
    Card --> CardView["PolaroidCardView.jsx<br/>(トップページ・ボード共通ポラロイドカードUI)"]

    InfoCard --> MetaHook
    SyncHook --> Policy["polaroidBoardPolicy.js<br/>(権限・お題ルール・URL生成・定数)"]
    CanvasHook --> Policy
    InfoCard --> Policy
    Card --> Policy
    MetaHook --> Policy

    SyncHook --> Storage["polaroidBoardStorage.js<br/>(個人ボード永続化・共有URLエンコード/デコード)"]
    CanvasHook --> Storage
    MetaHook --> Storage
    Card -.->|Offscreen Canvas描画| Renderer["../polaroid/polaroidCanvasRenderer.js"]
    View -.->|?slice=&cx=&cy=&cz= 遷移| SpotNav["useEmakiSpotNavigation.js"]
```

## 2. 主要ファイルと責務一覧

| ファイル | 種別 | 主な責務 |
|---------|------|----------|
| `PolaroidBoardView.jsx` | View / Orchestrator | ボード画面全体の統括、各カスタムフックとサブUIの統合レイアウト |
| `usePolaroidBoardSync.js` | Hook / Sync | 個人・共有URL・公開コラボボードのデータ取得・ポーリング同期、投稿・いいね・削除CRUD |
| `usePolaroidBoardCanvas.js` | Hook / Canvas | キャンバスPan/Zoom、初期自動フィット、ビューポートsessionStorage保存、カードドラッグ移動・座標永続化 |
| `PolaroidBoardHeader.jsx` | View | ボード上部ヘッダー、個人ボード／公開ボードモード切替 |
| `PolaroidBoardTabs.jsx` | View | タブ一覧表示、タブ選択、新規テーマ作成トリガー |
| `PolaroidBoardInfoCard.jsx` | View + State | ボードタイトル・説明・関連ハブ編集、お題バナー表示、`usePolaroidBoardMeta` 連携 |
| `PolaroidBoardCard.jsx` | View | ボード上の座標配置、削除・ルールバッジ・公開ピッカー等の操作スロット制御、`PolaroidCardView` への委譲 |
| `PolaroidCardView.jsx` | View | トップページ（`HomePublicBoards.jsx`）と個人/公開ボード共通のポラロイドカード純粋UI描画 |
| `usePolaroidBoardMeta.js` | Hook / State | 個人・公開ボードのメタ情報状態管理、`<!--hubs:...-->` パース/シリアライズ、保存ハンドラ |
| `polaroidBoardPolicy.js` | Pure Logic | 権限判定（`getBoardPermissions` / `getBoardCardPermissions`）、お題ルール（`parseOdaiMeta` / `computeCardRuleBadges`）、`buildSourceHref`、`resolveRelatedThemeHub`、ストレージキー定数 |
| `polaroidBoardStorage.js` | Storage | localStorage への個人ボードCRUD、共有URL用Base64URLエンコード/デコード |
| `PolaroidBoardView.module.css` | Style | ボードレイアウト・キャンバス・カード関連スタイル |

## 3. 主要データフロー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant View as PolaroidBoardView
    participant Sync as usePolaroidBoardSync
    participant Canvas as usePolaroidBoardCanvas
    participant Info as PolaroidBoardInfoCard
    participant Meta as usePolaroidBoardMeta
    participant Policy as polaroidBoardPolicy
    participant Storage as polaroidBoardStorage

    User->>View: ボード画面（/board?room=... 等）を開く
    View->>Sync: ルーム/共有URLからボードデータ取得・ポーリング開始
    Sync->>Policy: getBoardPermissions 等参照
    Sync->>Storage: 個人ボード読込・共有URLデコード
    View->>Canvas: キャンバス初期フィット・ビューポート復元
    Canvas->>Storage: sessionStorage ビューポート保存
    Info->>Meta: usePolaroidBoardMeta 呼び出し
    User->>Info: タイトル・説明・関連ハブを編集して保存
    Info->>Meta: 保存ハンドラ発火
    Meta->>Storage: 個人メタ更新（またはAPI更新）
    User->>Canvas: カードドラッグ・Pan/Zoom
    Canvas->>Storage: カード座標・ビューポート永続化
  User->>Sync: 投稿・いいね・削除
    Sync->>Storage: 個人ボードCRUD（またはAPI更新）
    User->>View: カードの「元絵巻・座標 →」をクリック
    View->>Policy: buildSourceHref(item) で ?slice=&cx=&cy=&cz= 生成
    Policy-->>User: 該当絵巻スポットへ遷移
```

## 4. 削除・統合済みレガシーファイル一覧

| 旧ファイル | 対応内容 | 統合先 / 備考 |
|-----------|----------|---------------|
| `polaroidBoardHelpers.js` | 削除（機能統合） | `polaroidBoardPolicy.js` に `ACTIVE_COLLAB_ROOM_KEY`・`AUTHOR_NAME_KEY`・`resolveRelatedThemeHub`・`buildSourceHref` を統合 |