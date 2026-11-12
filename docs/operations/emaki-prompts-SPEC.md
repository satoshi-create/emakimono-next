# 絵巻ビューア・プルプロンプト仕様（中盤 / 巻末）

中盤の `ViewerPullPrompt`（共有・中盤フィードバック）と巻末の `ScrollFeedbackEndPrompt` の責務境界とデータフローを定義する。現行挙動を維持し、自動消去タイマー等の UX 変更は本書のスコープ外とする。

## 1. 全体アーキテクチャと親子階層マップ

```mermaid
graph TD
  subgraph ParentScope["EmakiConteiner（ParentScope）"]
    EC[EmakiConteiner]
    UEP[useEmakiPrompts]
    VPP[ViewerPullPrompt]
    SFEP[ScrollFeedbackEndPrompt]
    UES[useEmakiScroll]
    UEI[useEmakiIdleUI]
  end

  SS_SESSION[(sessionStorage)]
  SS_PULL[viewerPullSession]
  SS_FB[scrollFeedbackSession]

  EC --> UEP
  EC --> UES
  EC --> UEI
  EC --> VPP
  EC --> SFEP

  UEP --> SS_PULL
  UEP --> SS_FB
  UEP -.->|isUIVisible| UEI
  UEP -.->|isAtEnd, scroll| UES
  SFEP -->|onDismiss のみ| UEP
  VPP -->|onPrimary / onDismiss| UEP

  SS_PULL --> SS_SESSION
  SS_FB --> SS_SESSION

  classDef bugZone fill:#7c2d12,stroke:#f59e0b,color:#fef3c7;
  VPP:::bugZone
  SFEP:::bugZone
```

**警戒ゾーン（bugZone）:** 一度表示条件を満たすと、現行実装では自動消去タイマーがなく、ユーザーが × またはプライマリアクションを実行するまで UI が残留しうる。`dismiss` フラグと `sessionStorage` が同期されるまで再トリガーは抑止されるが、表示中の長時間滞留は既知の観測ポイントとする。

## 2. 外部・内部モジュールの責務一覧

| レイヤー | モジュール名 | 主要責務 | 入力（Data In） | 出力・作用（Data Out / Side Effect） |
|---------|-------------|---------|----------------|-------------------------------------|
| UI 親 | `EmakiConteiner.js` | プロンプトのマウント条件（`scroll`）、パネル `ScrollFeedbackPanel` の開閉 state 配線 | `data`, スクロール端点, `isUIVisible` | 子プロンプトへの props 渡し |
| フック | `useEmakiPrompts.js` | dismiss 状態・比率バケット・表示条件・ハンドラ・デバッグログ | `emakiId`, `articleRef`, `isAtEnd`, `isUIVisible`, `isScrollFeedbackOpen` | 真偽値 3 種 + ハンドラ群 |
| UI | `ViewerPullPrompt.js` | 共有 / 中盤 FB の文言・CTA・× 表示（presentation のみ） | `mode`, `isVisible`, `onPrimary`, `onDismiss` | クリックイベントを親へ委譲 |
| UI | `ScrollFeedbackEndPrompt.js` | 巻末の共有ボタン群・フィードバック導線・× | `emakiId`, `onDismiss`, `onOpenFeedback` | × は `onDismiss` のみ（永続化はフック側） |
| フック | `useEmakiScroll` | 横スクロール・端点 `isAtEnd` | `articleRef` | `isAtEnd` 更新 |
| フック | `useEmakiIdleUI` / AutoPlay 連携 | `isUIVisible`（無操作で UI 非表示） | ユーザーアクティビティ | プロンプト表示ゲート |
| 永続化 | `viewerPullSession.js` | 中盤プル dismiss（share / mid_feedback） | `emakiId`, `kind` | `sessionStorage` 読書 |
| 永続化 | `scrollFeedbackSession.js` | 巻末 FB 送信済み・巻末 dismiss | `emakiId`, feedback key | `sessionStorage` 読書 |

## 3. 動的データフロー（シーケンス図）

```mermaid
sequenceDiagram
  autonumber
  participant User
  participant EC as EmakiConteiner
  participant UEP as useEmakiPrompts
  participant SS as sessionStorage
  participant VPP as ViewerPullPrompt
  participant SFEP as ScrollFeedbackEndPrompt
  participant Panel as ScrollFeedbackPanel

  EC->>UEP: mount(emakiId)
  UEP->>SS: hasDismissed / hasSubmitted / isFeedbackDismissed
  SS-->>UEP: 復元結果
  Note over UEP: [Prompt:Init] ログ

  User->>EC: 横スクロール（30% 到達）
  UEP->>UEP: scrollRatioBucket >= 0.3
  Note over UEP: showSharePullPrompt = true
  EC->>VPP: mode=share 表示

  User->>VPP: 共有 CTA
  VPP->>UEP: handleSharePromptCopy
  UEP->>SS: markPullPromptDismissed(share)
  Note over UEP: [Prompt:Action]

  User->>EC: スクロール継続（55% 到達）
  Note over UEP: showMidFeedbackPrompt = true
  EC->>VPP: mode=mid_feedback 表示

  User->>VPP: フィードバック CTA
  VPP->>UEP: handleMidFeedbackPrimary
  UEP->>SS: markPullPromptDismissed(mid_feedback)
  UEP->>EC: setIsScrollFeedbackOpen(true)
  EC->>Panel: パネル表示

  User->>EC: 巻末到達
  Note over UEP: isAtEnd, showScrollFeedbackEndPrompt
  EC->>SFEP: 巻末プロンプト表示

  alt × で閉じる（巻末）
    User->>SFEP: close
    SFEP->>UEP: onDismiss (= dismissEndPrompt)
    UEP->>SS: dismissFeedback(scroll_end key)
  else フィードバック送信完了
    Panel->>UEP: handleScrollFeedbackSubmitted
    UEP->>SS: dismissFeedback + 状態フラグ更新
  end
```
