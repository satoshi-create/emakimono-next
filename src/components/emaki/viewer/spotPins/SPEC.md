# SpotPins モジュール仕様

絵巻ビューア上の名所スポットピン（アノテーション）オーバーレイ。親 `section`（`position: relative`）内に x/y%（スライス左上原点）でタグを重ねる。

**公開コンポーネント:** `SpotPins.jsx` の `export default SpotPins`

---

## 1. ファイル構成

```mermaid
graph TD
  SpotPins["SpotPins.jsx<br/>閲覧表示オーケストレータ（作品非依存）"]
  Editor["useSpotPinsEditor.js<br/>編集状態・ドラッグ・削除ハンドラ"]
  Layout["useSpotLayout.js<br/>レイアウト計算"]
  EditOverlay["SpotEditOverlay.jsx<br/>rect リサイズ・十字ドラッグ・配置ドラフト"]
  SaveBar["SpotPinsEditSaveBar.jsx<br/>編集ツールバー（ポータル）"]
  Store["spotPinsEditStore.js<br/>編集 SSOT（pendingUpdates 等）"]
  Popup["SpotPlaceNamePopup.jsx<br/>名所選択 UI"]
  Preset["rakuchuSpotPreset.js<br/>洛中洛外図プリセット"]
  Resolver["resolveScrollSpotConfig.js<br/>作品別 spot 設定リゾルバ"]
  Geo["spotPinsGeometry.js<br/>計算・定数"]
  EditGeo["spotEditGeometry.js<br/>編集座標・リサイズ純関数"]
  DragHook["useSpotDragResize.js<br/>移動・リサイズポインタ"]

  SpotPins --> Layout
  SpotPins --> Editor
  SpotPins --> Geo
  SpotPins -->|"?editSpots=1 のみマウント"| EditOverlay
  SpotPins -->|"?editSpots=1 のみマウント"| SaveBar
  Editor --> Store
  EditOverlay --> Store
  EditOverlay --> EditGeo
  EditOverlay --> DragHook
  DragHook --> EditGeo
  DragHook --> Store
  EditOverlay --> Popup
  SaveBar --> Store
  Popup --> Store
  SpotPins --> AppContext["@/context/AppContext"]
  SpotPins --> Styles["SpotPins.module.css"]
  Resolver --> Preset
  Resolver -.->|"ZoomLayer / SwitcherEmaki / EmakiConteiner が Props 注入"| SpotPins
```

---

## 2. 責務一覧

| 層 | ファイル | 責務 | 主要な公開 API |
|----|----------|------|----------------|
| **閲覧・合成（オーケストレータ）** | `../SpotPins.jsx` | 通常閲覧のピン描画・選択・いいね操作。`useSpotLayout` / `useSpotPinsEditor` の配線。編集モード時のみ `SpotPinsEditSaveBar` と `SpotEditOverlay` を合成マウント。作品固有定数は持たない | **Props:** `spots`, `linkId`, `zoomScale`, `sliceIndex`, `masterSpots`, `getSpotKindClass`, `slugOverride`, `apiEndpoint`（default: `"/api/dev/update-spot"`）<br/>**Export:** `export default SpotPins` |
| **編集ロジック（フック）** | `useSpotPinsEditor.js` | `isEditMode` 判定（`?editSpots=1` + development）。ストア購読（`quizOnlyEdit`, `placeMode`, `pendingUpdates`, `discard`）、`mergedSpots` 合成、ピン移動・削除ハンドラを `SpotPins` へ返す | `useSpotPinsEditor`（`mergedSpots`, 編集ハンドラ群, `isEditMode` 等） |
| **レイアウト** | `useSpotLayout.js` | スライス要素とオーバーレイの座標同期、リサイズ・`zoomScale` に追従するレイアウト実測 | `useSpotLayout`（section 参照・ピン座標用メトリクス等） |
| **状態（SSOT）** | `spotPinsEditStore.js` | スポット編集の未保存差分（`pendingUpdates`）、配置モード（`placeMode`）、`quizOnlyEdit` を slug 単位で保持・通知 | `getPlaceModeEnabled`, `setPlaceModeEnabled`, `subscribePlaceMode`, `registerNewSpot`, `mergePendingUpdate`, `getAddedSpotsForSlug`, `getPlacedSpotIdsForSlug`, `registerSliceSpotIds`, `subscribePendingUpdates`, `subscribeDiscard` |
| **計算・定数** | `spotPinsGeometry.js` | バッジ余白、エッジマージン、スライス画像名抽出、フォールバックオフセット、slug 解決、transform-origin | `BADGE_GAP`, `EDGE_MARGIN`, `extractSliceImageName`, `fallbackOffset`, `getSlugFromPath`, `transformOriginFor` |
| **編集ジオメトリ** | `spotEditGeometry.js` | 編集専用の座標変換・右下リサイズ（左上固定）・パノラマ保存パッチ組み立て | `computeBottomRightResize`, `panoramaStorePatch`, `buildSpotCommitPayload`, `resolveCrossSliceTarget` |
| **編集ポインタ** | `useSpotDragResize.js` | 十字／枠ドラッグの掴みオフセット、リサイズ、ドロップ時 `commitSpotTransform` → `mergePendingUpdate` | `useSpotDragResize`, `makeAnchorHandlers`, `makeRectFrameHandlers`, `makeResizeHandlers` |
| **設定リゾルバ** | `resolveScrollSpotConfig.js` | `data` から `usePanoramaStrip` / `masterSpots` / `getSpotKindClass` を解決。ビューア親はここだけ import する | `resolveScrollSpotConfig(data)` |
| **プリセット（洛中洛外のみ）** | `rakuchuSpotPreset.js` | 洛中洛外向け名所マスター・種別スタイル。`resolveScrollSpotConfig` 経由でのみ `SpotPins` へ届く | `DEFAULT_SPOT_MASTERS`, `getRakuchuSpotKindClass` |
| **UI 表示（編集オーバーレイ）** | `SpotEditOverlay.jsx` | 編集 UI の宣言的描画。ポインタ処理は `useSpotDragResize` に委譲 | **Props:** `SpotPins` が `isEditMode` 時に委譲 |
| **UI 表示** | `SpotPlaceNamePopup.jsx` | 編集時の名所マスターからの選択ポップアップ | **Props:** 親から `masterSpots` 等を受け取り store と連携 |
| **UI 表示（編集ツールバー）** | `SpotPinsEditSaveBar.jsx` | ポータル描画の編集ツールバー。クイズ枠のみ表示切替・JSON 一括保存・破棄 | **Props:** `slugOverride`, `apiEndpoint` 等（`SpotPins` が `isEditMode` 時に直結） |

---

## 3. データフロー（開発編集 `?editSpots=1`）

前提: `NODE_ENV === "development"` かつ URL クエリ `editSpots=1`。slug は `slugOverride` または `getSlugFromPath(router.asPath)`。

```mermaid
sequenceDiagram
  actor Dev as 開発者
  participant SpotPins as SpotPins.jsx
  participant Editor as useSpotPinsEditor.js
  participant Overlay as SpotEditOverlay.jsx
  participant Store as spotPinsEditStore
  participant Popup as SpotPlaceNamePopup
  participant SaveBar as SpotPinsEditSaveBar
  participant API as /api/dev/update-spot

  Dev->>SpotPins: ?editSpots=1 でビューア表示
  SpotPins->>Editor: useSpotPinsEditor 初期化
  Editor->>Store: subscribe（quizOnlyEdit / placeMode / pendingUpdates / discard）
  SpotPins->>SpotPins: isEditMode 時のみ Overlay・SaveBar マウント

  Dev->>Overlay: ドラッグ / rect リサイズ / 配置クリック
  Overlay->>Store: mergePendingUpdate（座標・rect 等）
  Dev->>SpotPins: 閲覧ピン移動・削除
  SpotPins->>Editor: 移動・削除ハンドラ
  Editor->>Store: mergePendingUpdate / 削除反映

  Store-->>Editor: 更新通知
  Store-->>SpotPins: 全スライス上の SpotPins / Editor が mergedSpots 同期

  Dev->>Popup: 名所マスターから選択（新規配置）
  Popup->>Store: mergePendingUpdate（id・座標）

  Dev->>SaveBar: 一括保存
  SaveBar->>Store: subscribePendingUpdates の差分取得
  SaveBar->>API: POST（apiEndpoint、slug + 更新配列）
  API-->>SaveBar: 成功 / エラー
  SaveBar->>Store: 保存成功時に破棄 or 同期（subscribeDiscard）
  Store-->>Editor: discard 通知 → 全スライス再同期
```

---

## 4. 汎用利用ガイド（他絵巻・他コンテンツ）

`SpotPins.jsx` は作品非依存。親は `resolveScrollSpotConfig(data)` の結果を `masterSpots` / `getSpotKindClass` に渡す（`ZoomLayer` / `SwitcherEmaki` / `EmakiConteiner` が統一配線）。

### 基本配置

```jsx
import SpotPins from "@/components/emaki/viewer/SpotPins";
import { resolveScrollSpotConfig } from "@/components/emaki/viewer/spotPins/resolveScrollSpotConfig";

const spotConfig = resolveScrollSpotConfig(data);

<SpotPins
  spots={spotsForThisSlice}
  linkId={scrollLinkId}
  sliceIndex={sliceIndex}
  zoomScale={zoomScale}
  masterSpots={spotConfig.masterSpots}
  getSpotKindClass={spotConfig.getSpotKindClass}
/>
```

未指定時の `SpotPins` デフォルトは `masterSpots=[]` / `getSpotKindClass=undefined`（手入力フォーム即開き・種別クラスなし）。

### 汎用 Props

| Prop | 型 | デフォルト | 用途 |
|------|-----|----------|------|
| `masterSpots` | 配列 | `[]` | 編集モードの名所候補。作品別解決は `resolveScrollSpotConfig`。 |
| `getSpotKindClass` | `function \| undefined` | `undefined` | `(spot, styles) => string`。洛中洛外のみリゾルバが `getRakuchuSpotKindClass` を返す。 |
| `slugOverride` | `string` | 未定義 | メタ JSON / API の scroll slug を URL から取れない場合に明示指定。SaveBar・store のキーにも使用。 |
| `apiEndpoint` | `string` | `"/api/dev/update-spot"` | 開発用一括保存先。別プロジェクト用エンドポイントに差し替え可能。 |

### 種別スタイル（`getSpotKindClass`）

- **未指定:** 種別用 CSS Module クラスを付けない（汎用最小表示）。
- **関数:** 返したクラス名をピン `button` に付与。洛中洛外は `getRakuchuSpotKindClass` を渡す。
- **`null`:** 種別クラスを付けない（最小表示）。

### 後方互換

- Props 名は上記のとおり。**export 名は `SpotPins`（default）のみ。**
- 洛中洛外プリセットは `resolveScrollSpotConfig` → `rakuchuSpotPreset.js` のみ。`SpotPins` 本体に作品既定値はない。
- 本番ビルドでは `editSpots` クエリがあっても `isEditMode` は development 限定のため、編集 UI は本番に出ない。

### 他コンテンツチェックリスト

1. スポット JSON 形式を既存 `spots` エントリ（`id`, `name`, `x`, `y`, …）に合わせる。
2. `masterSpots` に編集用候補一覧を渡す（開発時のみ参照）。
3. 保存 API が `slug` + 更新配列を受け取れることを確認し、必要なら `apiEndpoint` を変更。
4. URL が `[slug]` パターンでない場合は `slugOverride` を必須化。

---

## 5. 編集オーバーレイの座標・ポインタ仕様（`spotEditGeometry` / `useSpotDragResize`）

| 操作 | 挙動 |
|------|------|
| **右下リサイズ** | 枠の左上（中心 − 半幅/半高）を固定。`minW` はパノラマ 0.3%・通常 2%、`minH` 1.5%。右下ハンドルはポインタに 1:1 追従（中心基準 2 倍伸びは廃止）。 |
| **枠・十字移動** | ポインタダウン時の `(pointer − spot中心)` をオフセット保持し、ドラッグ中も枠がカーソル下に飛ばない。 |
| **パノラマ保存** | `spot.stripBounds` がある旧パノラマのみ `unmapStripCoordToPanorama`。`panels` 全体ストリップ（バイユー等）は strip % を `round2` でそのまま `pendingUpdates` / `dragOverrides` に保存。 |
| **確定** | `onPointerUp` の patch 生成は `buildSpotCommitPayload` → `commitSpotTransform` に一元化。 |