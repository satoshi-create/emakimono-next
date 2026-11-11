# SPEC.md: 絵巻ビューア Discovery レール開閉・同期動的仕様

## 1. 責務境界（Who Owns What）

| モジュール名 | レイヤー | 所有する状態・責務 | 触ってはいけない領域（安全契約） |
| --- | --- | --- | --- |
| `useViewerDiscoveryRailState.js` | 状態層 | `railOpen`（開閉真偽値）、`suppressRailTheaterRef`（誤動作抑止タイムスタンプ）、`railPinFromExpandRef`（展開ピン留めフラグ）、`railPinScrollLeftRef`（展開時スクロール基底位置）、`theaterDismissedAtRef` | DOM スクロール実測やスクロール位置の直接操作は行わない。 |
| `useEmakiRailSync.js` | 同期層 | `article` 上のポインタ・タッチ・ホイールの入力検知、親コールバック（`onUserScrollStart`, `onReachStartBoundary`）へのルーティング | `railOpen` の値を直接変更しない（親へのコールバック通知のみ）。 |
| `useEmakiScroll.js` | 幾何層 | DOM 実測値に基づく `isAtStart`（先頭判定）/ `isAtEnd`（末尾判定）の算出と更新、シーン中央判定 | レールの開閉状態や CSS クラスの操作には関知しない。 |
| `EmakiLandscapContent.js` | UI 統合層 | 全体レイアウト（2列グリッド／`.theater` 全幅モード）の切り替え、`<aside>` レール要素のクリック/ポインタ配置 | スクロールイベント内部の幾何計算や差分検出は行わない。 |
| `EmakiConteiner.js` | ビューア描画層 | 絵巻スライスの描画窓管理、横スクロールコンテナ（`<article>`）のレンダリング | レール開閉判定のためのタイマーやクールダウン時間を独自に保持しない。 |
| `EmakiLandscapContent.module.css` | スタイル層 | グリッドトラック（`grid-template-columns`）、sticky 配置、シアター時アニメーション（`transform: translateY`） | JS 側フラグの介入なしに自己判断でレイアウト構造を変更しない。 |

---

### コンポーネント・モジュール階層構造

```mermaid
graph TD
    classDef ui fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,color:#01579b;
    classDef hook fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#4a148c;
    classDef style fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#e65100;
    classDef sub fill:#ede7f6,stroke:#512da8,stroke-dasharray: 5 5,color:#311b92;

    %% 最上位コンポーネント
    Page["ページコンポーネント<br/>(pages/[slug].js)"]:::ui

    %% UI統合層
    Land["EmakiLandscapContent.js<br/>【UI統合層】<br/>全体レイアウト・グリッド制御"]:::ui
    CSS["EmakiLandscapContent.module.css<br/>【スタイル層】<br/>grid / sticky / translateY"]:::style

    %% 状態層フック
    HookLand["useViewerDiscoveryRailState.js<br/>【状態層】<br/>railOpen / サプレス / ピン留め"]:::hook

    %% サイドバーUI
    RailUI["ViewerDiscoveryRail.js<br/>【サイドバーUI】<br/>aside.discoveryRail"]:::ui

    %% ビューア描画層
    Container["EmakiConteiner.js<br/>【ビューア描画層】<br/>仮想描画窓・article ホスト"]:::ui

    %% Conteiner配下のフック群
    HookSync["useEmakiRailSync.js<br/>【同期層】<br/>ユーザー入力・境界通知ルーティング"]:::hook
    HookScroll["useEmakiScroll.js<br/>【幾何層】<br/>スクロール実測・端点判定(isAtStart)"]:::hook
    HookOther["その他の機能フック<br/>(useEmakiAutoPlay / useEmakiZoomPan 等)"]:::sub

    %% 階層関係の結合
    Page --> Land
    Land --> CSS
    Land -- "呼出・所有" --> HookLand
    Land -- "子要素描画" --> RailUI
    Land -- "子コンポーネント" --> Container

    Container -- "呼出・所有" --> HookSync
    Container -- "呼出・所有" --> HookScroll
    Container -- "呼出・所有" --> HookOther