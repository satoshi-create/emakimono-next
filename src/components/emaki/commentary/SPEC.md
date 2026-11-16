# SceneCommentaryBar 責務分離仕様（Clean-Arch & Safe-Delete v1.0 / Step 2）

## モジュール構成

```mermaid
graph TD
  SCB["SceneCommentaryBar.js<br/>オーケストレーター"]
  Shell["useCommentaryBarShell.js<br/>共通枠・DnD・CSS変数"]
  ByobuH["useByobuSpotCommentary.js<br/>屏風ロジック"]
  ByobuV["ByobuSpotCommentaryView.jsx<br/>屏風 UI"]
  EmakiH["useEmakiSceneCommentary.js<br/>絵巻ロジック"]
  EmakiV["EmakiSceneCommentaryView.jsx<br/>絵巻 UI"]
  SCB --> Shell
  SCB --> ByobuH
  SCB --> ByobuV
  SCB --> EmakiH
  SCB --> EmakiV
  Shell --> CSS["SceneCommentaryBar.module.css"]
  SCB --> CSS
```

## 責務一覧

| ファイル | 責務 |
|----------|------|
| `SceneCommentaryBar.js` | Props 不変の default export。ヘッダー（Like/Share）、共通カード枠、モード分岐、Folklore シート配置 |
| `useCommentaryBarShell.js` | `closed` / `expanded` / `viewMode` / `cardPos`、向き連動、フローティング DnD、Esc、`useCommentaryBarMetrics`（`--commentary-bar-full-h` / `--folklore-sheet-bottom`） |
| `useByobuSpotCommentary.js` | `isByobuSpotMode`、`activeByobuSpot*`、`spotIndexRows`、`spotDisplay`、`handleNavigateSpot` |
| `ByobuSpotCommentaryView.jsx` | スポット目次、カテゴリ行、未選択ガイド・詳細本文・他伝本リンク、前後ナビ |
| `useEmakiSceneCommentary.js` | `?ebiki`、段インデックス、詞書タブ、絵引、探索、`handleNavigate` / `handleFolkloreSelect` |
| `EmakiSceneCommentaryView.jsx` | 段目次、絵引リスト、モードタブ、`CommentaryTextView` / `CommentaryExploreView` |

## データフロー — 絵巻モード

```mermaid
sequenceDiagram
  participant EC as EmakiConteiner
  participant SCB as SceneCommentaryBar
  participant Emaki as useEmakiSceneCommentary
  participant Shell as useCommentaryBarShell
  participant G as gtag / handleToId

  EC->>SCB: navIndex, data.emakis, locale
  SCB->>Emaki: viewMode, handleToId
  Emaki->>Emaki: activeIndex, chapterTexts, textMode
  Note over SCB: 段変更で viewMode→commentary
  Emaki->>G: scene_text_mode_change
  Emaki->>G: Ebiki scroll + spotlight
  Shell->>EC: --commentary-bar-full-h on .entry-container
```

## データフロー — 屏風モード

```mermaid
sequenceDiagram
  participant EC as EmakiConteiner
  participant SCB as SceneCommentaryBar
  participant Byobu as useByobuSpotCommentary
  participant View as ByobuSpotCommentaryView

  EC->>SCB: selectedSpot, allSpots, onSelectSpot
  SCB->>Byobu: spotDisplay, spotIndexRows
  View->>EC: onSelectSpot (バッジ／目次／前後ナビ)
  Note over View: 他伝本 Link + モチーフハブ
```

## 外部契約（DOM / CSS 変数）

| 種別 | 名前 | 設定元 | 意味 |
|------|------|--------|------|
| `data-*` | `data-orientation` | バー root | `AppContext.orientation` |
| `data-*` | `data-fullscreen` | wrap / bar | フローティングカード時 `"true"` |
| `data-*` | `data-expanded` | `.bar` | 本文展開 |
| `data-*` | `data-text-mode` | `.bar` | 現テキストモード（絵巻） |
| CSS 変数 | `--commentary-bar-full-h` | `.entry-container` | バー実高さ（px） |
| CSS 変数 | `--folklore-sheet-bottom` | `.entry-container` | Folklore シート下端オフセット |
| イベント | `scene_modal_open` | 展開時 gtag | 仕様維持 |
| イベント | `scene_text_mode_change` | タブ切替 gtag | 仕様維持 |
| コールバック | `handleToId` | 絵引・段目次 | AppContext |
| コールバック | `onSelectSpot` / `onClearSelectedSpot` | 屏風スポット | EmakiConteiner |