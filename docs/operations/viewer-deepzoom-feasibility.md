# ビューア ディープズーム統合（アプローチ2）実現可能性調査

- 作成日: 2026-09-17
- 種別: 調査レポート（**コード変更なし**。意思決定用）
- 対象: 絵巻ビューアのズーム機能を「アプローチ1（現行: DOM横スクロール + CSS/Canvas 変形）」から「アプローチ2（横並びスライスを単一ディープズーム空間へ統合 / OpenSeadragon・IIIF タイル型）」へ移行する場合の、適合性・影響範囲・実装コスト
- 参照必須: [`viewer-scroll-issues/retrospective.md`](./viewer-scroll-issues/retrospective.md), [`viewer-scroll-issues/viewer-image-fallback-hardening.md`](./viewer-scroll-issues/viewer-image-fallback-hardening.md)

> 本レポートの数値のうち、原寸解像度（`srcWidth` / `srcHeight`）は **未確認** です。§5 の Phase 0.5 で手動確認してください。

---

## 0. 結論サマリ

| 論点 | 判定 |
|---|---|
| 技術的実現可能性 | **可能**。ただし DZI / IIIF のタイル配信を Cloudinary 単体で完結させる道はない（§2-1） |
| 現行アーキテクチャとの親和性 | **低〜中**。位置の単一プリミティブが `scrollLeft`（RTL 負値空間）であり、OSD は正値ワールド座標。全面置換は「巻き戻り対策」で積んだ不変条件を作り直す |
| ただし既にハイブリッド構造 | `ZoomLayer` は `<article>` の**兄弟オーバーレイ**として実装済み。アプローチ2へは「全面置換」より「ZoomLayer の中身を OSD に差し替える」方が構造的に自然 |
| 最大のコスト要因 | 原寸解像度の天井（パイプラインは高さ 1080px 正規化）と、DZI タイル化した場合の Cloudinary 資産数爆発（195 → 数千） |
| 推奨 | **全面置換は今はやらない。** 計測 → 解像度監査 → ZoomLayer 内 OSD PoC の順。全面置換は最後の段階（§5） |

---

## 1. 現行アーキテクチャとの適合性・競合

### 1-1. 位置の単一プリミティブが `scrollLeft` である

現行ビューアの全ロジックは `article.scrollLeft` を唯一の真実として動く。

```js
// src/hooks/emaki/scrollPositionStore.js
export const scrollPositionStore = {
  scrollLeft: 0,
  scrollRatio: 0,
  restored: false,
  isTransitioning: false,
  emakiId: null,
};
```

| 対象 | 競合度 | 現行の依存 | OSD 側の置換 | 改修規模 |
|---|---|---|---|---|
| `useEmakiScroll.js` | **高** | `detectCurrentScene` は `section[id]` を `querySelectorAll` し `getBoundingClientRect()` でオフセットをキャッシュ → 以降は `scrollLeft` 差分の算術のみでシーン特定。`handleScroll` は `scrollWidth/clientWidth/scrollLeft` で端点判定。`ResizeObserver` でキャッシュ破棄 | ワールド座標が**配置時に既知**になるため `worldXToSceneIndex` の純関数へ置換可能（DOM 読み取り・キャッシュ・ResizeObserver がすべて不要） | 削除〜新規 約150行。**この部分は OSD 化で確実に簡素化される** |
| `useEmakiAutoPlay.js` | **高** | rAF ループで `el.scrollLeft -= speed * dt` を直接代入。`computeMinScrollLeft` は負値前提、端点は `isAtStartRef` / `isAtEndRef`、`lastSelfScrollLeft` とのズレで手動介入を検知 | `viewport.panBy` の継続呼び出し + `getBounds()` 比較。ただし「px/秒」は**ズーム倍率依存**のため「画像ピクセル/秒」定義への再設計が必要。OSD の `animation` ステートマシンとの競合に注意 | 約660行 → 200行前後。速度・端点・手動介入検知（`NUDGE_MANUAL_OVERRIDE_PX` 相当）は再実装 |
| `useEmakiPalmDrag.js` | 低（削除可） | `el.scrollLeft -= deltaX` の増分パン | OSD 標準ドラッグ。`suppressClickUntilRef` の click 抑止のみ移植 | 約100行ほぼ削除 |
| `scrollPositionStore.js` | 中 | `scrollLeft` + `scrollRatio` を module scope で保持（向き / フルスクリーン再マウント用） | `{ centerWorldX, zoom }` に置換。`beginScrollRestore` / `resetScrollPositionStore` の呼び出し側（`_app.js`）は維持可 | 小 |
| `emakiSceneDom.js` | 中 | `scene-N` section id ↔ URL hash `#N` ↔ 配列 index の結合点 | ハッシュ同期は「ワールド座標 → シーン index」に置換えれば維持可。**`ekotoba` 幅0マーカーを配列から消せない制約は継承** | 小 |
| `emakiContentWindow.js` | **低（最重要の資産）** | `sceneWidthPx(item, rowHeight) = (srcWidth/srcHeight) * rowHeight` | **これがそのままワールド座標系になる**（§1-2） | 変更不要。再利用が鍵 |
| `_app.js handleToId` | **中〜高** | `querySceneSection(id)` → `closest("article")` → `scrollTo({left})`。共有ハッシュ入場時は `ResizeObserver` で最大2.5秒 realign（`retrospective.md` 主因1） | `viewport.panTo` / `fitBounds`。**ジャンプ起因の巻き戻りバグ群が構造的に消滅する**（OSD 化の数少ない明確な勝ち筋） | `_app.js` L206–273 を書き換え。呼び出し側（nav / quiz / hash）のシグネチャは維持可 |
| `ZoomLayer.jsx` + `useEmakiZoomPan.js` | **低（差し替え点）** | 中央±1枚の3スライスを `flex-direction: row-reverse` で並べ CSS `transform: translate+scale`（fit 倍率〜3.0、pan は strip/stage 実寸から clamp） | ここだけ OSD に置換。`src/types/viewer.ts` の `UseEmakiZoomPanResult` 契約（`isZoomed/scale/panX/panY/zoomRef/stageRef/stripRef/openZoom/resetZoom/zoomIn/zoomOut/toggleZoom/handlers`）を保てば `EmakiConteiner.js` L632–651 / L1264–1276 の配線は無傷 | 契約保存型の差し替えが可能 |
| `LazyImage.js` | **高（隠れコスト）** | アダプティブタイムアウト、`IntersectionObserver(rootMargin:200px)`、`trackImageLoaded` / `trackImageFallback` / `trackImageLoadSlow`、`hydratedImageKeys` による blur 再発防止、`sizes` を vh から算出 | OSD の `tile-loaded` / `tile-load-failed` へ移行。**`image_load_fallback` は週次レビューの KPI 時系列（`kpi.yaml` の `fallback_by_reason` 等）なので、無計測期間を作ると比較不能**。スケルトン維持＝「白飛びさせない」不変条件（`viewer-image-fallback-hardening.md` §6-3）も再実装 | 中〜大 |
| 詞書 `OverlayEkotoba` | **高（唯一の本質的障壁）** | `<section>` 内の DOM 子要素として組版（縦書き等）。ワールド座標のタイルにはできない | OSD `addOverlay({x,y,width,height})` か、`viewport.pixelFromPoint` で毎フレーム追従する React portal。`cat:"ekotoba"` かつ `src` ありの「詞書画像」はタイル化可能 | 中 |
| `EndNudgeCard`（巻末ナッジ） | 中 | `<article>` の in-flow `position:sticky` 子要素 | オーバーレイ化し、表示条件を `getBounds()` ベースに | 小〜中 |
| PWA（`next-pwa`） | 中 | `runtimeCaching` は `_next/data` と navigate のみ NetworkOnly。**タイル URL は defaultPwaCache に落ちて Cache Storage に堆積する** | Cloudinary ドメイン用の NetworkOnly / 明示ルールを追加必須 | 小（見落とすと事故） |

### 1-2. 幾何モデルは既に OSD 互換

`sceneWidthPx` が「行高さ → シーン幅」を返すので、ワールド座標系は既存ユーティリティの流用で定義できる。

```js
// worldRowHeight: ワールド座標での絵巻の高さ（例 1000 やスライス実高 1080）
const WORLD_H = 1000;
let cursor = 0;
const tileSources = [];
const sceneWorldCenter = []; // index → 中央 x（段ジャンプ・シーン検出用）

processedEmakis.forEach((item, index) => {
  if (item.cat !== "image" || !item.src) return; // 幅0マーカーは座標を持たない
  const w = sceneWidthPx(item, WORLD_H);        // ← 既存 util をそのまま流用
  tileSources.push({
    tileSource: {
      type: "image",
      url: buildCloudinaryUrl(item.src, [
        `w_${pickTier(item, index)}`,
        "f_auto",
        "q_auto:eco",
      ]),
      buildPyramid: false,
    },
    x: cursor,
    y: 0,
    width: w,
  });
  sceneWorldCenter[index] = cursor + w / 2;
  cursor += w;
});
```

つまり「12枚を横一列に結合した仮想1枚」は**配置時に座標が確定**するため、`handleToId` の DOM 計測・realign も `useEmakiScroll` の矩形キャッシュも不要になる。ここは OSD 化の正味のメリット。

### 1-3. 詞書・シーン解説の共存方針（推奨）

- **解説バー（`SceneCommentaryBar`）は触らない。** `liveSceneIndex` を供給するアダプタだけ差し替えれば、キャンバス外の DOM として無変更で共存する（現行も overlay ではなくキャンバスの兄弟）。
- **詞書オーバーレイは「タイルにしない」。** `addOverlay` は矩形しか持てず、縦書き・タブ・スクロールする長文の組版に不向き。推奨は「ワールド座標のプレースホルダを OSD overlay で確保し、中身は React 側の絶対配置レイヤで描く」二層方式。ズーム倍率が上がると文字が拡大される問題があるため、**ズーム時は詞書を非表示（または別パネル退避）**が実装・UX 両面で最も割り切れる（現行 `ZoomLayer` も画像のみで、この割り切りに近い）。
- 段ジャンプ UI（`EmakiNavigation` → `handleToId(linkId)`）は**シグネチャ据え置き**で内部だけワールド座標 `panTo` に置換。`linkId` は配列 index なので `sceneWorldCenter[linkId]` に飛ばすだけ。

---

## 2. 画像配信・前処理パイプラインの実現可能性

### 2-0. 実データ（`cloudinary-breakdown.json`）

| 事実 | 値 |
|---|---|
| Cloudinary 上の絵巻画像アセット総数 | **195 件 / 96.41 MB**（`jpg` のみ） |
| 1絵巻あたり | **4〜24 枚**（`choju-giga-yamazaki-kou` 24、`eshi-no-soshi` 17、`jigokusoushi-genke` 13 …） |
| 1枚あたり | avg 192〜1,719 KB、**max 2,890 KB** |
| パイプライン正規化 | **高さ 1080px 前後**（`process_figma_slices.py` → `_NN-1080.jpg`）、旧 375px 系、上限 10MB / 25MP（`scroll-pipeline.md` §3） |
| 配信 | Cloudinary のみ（Vercel は HTML/JS/CSS）。Free プラン、`credits.usage` 18 警告 / 20 失敗ゲート |

**これはアプローチ2の ROI を決める最重要ファクト。** スライスの原寸が高さ 1080px 級なら、3倍ズームはどの方式でも同じ「拡大補間」であり、タイル化しても絵は良くならない。逆に「1328×3642」が実寸なら 12枚で約 58MP のパノラマとなり、ディープズームの価値は十分ある。**着手前にトップ3絵巻の `srcWidth` / `srcHeight` を必ず実測すること。**

### 2-1. 選択肢A（DZI / IIIF タイル生成）

- **Cloudinary に DZI / IIIF Image API のネイティブ配信機能はない**（公式ドキュメントに `info.json` / タイル配信の記載なし）。IIIF を名乗るには `/{id}/{region}/{size}/{rotation}/{quality}.{format}` + `info.json` を返すサーバが必要で、Cloudinary 単体では成立しない。
- 現実的な解は「ローカルで `libvips dzsave`（`layout=dzi` / `iiif3`）または sharp でピラミッド生成 → タイルを1アセットずつ Cloudinary へ上げる、あるいは静的ホスティングに置く」。
- **資産数の試算（12枚・合成 15,936×3,642 のパノラマを 512px タイル想定）**: レベル0: 32×8=256、L1: 16×4=64、L2: 8×2=16、L3: 4×1=4 → **約340タイル/絵巻**。15絵巻で **約5,000アセット**（現行195の約26倍）。タイル30〜60KBとして **+150〜300MB**。
- 影響:
  - `check_cloudinary_usage.py` の credits ゲート、Admin API 500回/月、`analyze_cloudinary_assets.py` / `prune_cloudinary_assets.py`、`.upload-cache.json` の設計がすべて作り直し。
  - タイルを Vercel `public/` に置く代替は、**「画像帯域は Cloudinary、Vercel には載せない」という現在のコスト分離（`scroll-pipeline.md` §1）を崩す**インフラ判断になる（git 容量・ビルド時間の悪化・Hobby の Fast Data Transfer 消費）。
- 結論: **技術的には可能だが、フロントエンド改修ではなくインフラ移行プロジェクト。** 原寸が小さい現状では投資対効果が最も悪い。

### 2-2. 選択肢B（既存スライスの Multi-image placement）

**可能**。OSD は `tileSources` の各要素に `x, y, width`（または `height`）を指定して同一ワールド空間に配置でき、`type:'image'` の素の JPEG と DZI を混在させられる。

```js
tileSources: [
  { tileSource: { type: "image", url: "slice-01.jpg" }, x: 0,    y: 0, width: 1000 },
  { tileSource: { type: "image", url: "slice-02.jpg" }, x: 1030, y: 0, width: 1000 },
]
```

| 項目 | 内容 |
|---|---|
| 帯域削減効果 | **ゼロ**。`type:'image'` は画像全体を1回DLする。深いズームの精細さは「要求した `w_`」と原寸で決まる |
| `buildPyramid: true`（既定） | クライアント側で canvas により内部ピラミッドを構築。**CORS 必須**（Cloudinary は CORS ヘッダあり＝可）だが、フル画像のデコードに加え倍のメモリを消費 |
| メモリ試算 | RGBA = w×h×4。1328×3642 の1枚で **約19.3MB デコード**、12枚で **約232MB** + ピラミッド。iOS Safari の canvas メモリ上限（歴史的に約224MB）は超過リスク大 |
| リスク回避策 | `buildPyramid:false` + **中心付近のみ `addTiledImage` / 遠方は `w_` を下げた低解像度版**（Cloudinary 変換で自由に階層を作れる＝手作りピラミッド）。ただし結果として「表示窓の出し入れ」問題が再登場する |
| 帯域の実効 | 遠景を `w_600` 等に落とせば、現行の「全スライス等倍先読み」より総バイトはむしろ下がり得る |

Cloudinary の per-request 変換は初回生成後キャッシュされるため、階層数を絞れば credits への影響は限定的。

---

## 3. 実装アプローチ別コスト比較

工数は人日（1人・調査 / 実装 / 回帰確認込み）の目安。

| | ① 完全置換（OSD 委譲） | ② ハイブリッド（ZoomLayer を OSD 化） | ③ 現行 DOM 拡張（react-zoom-pan-pinch 等） |
|---|---|---|---|
| 内容 | キャンバスを OSD に。ナビ・段ジャンプを OSD API に書き直し | 通常閲覧は現行 DOM のまま。`ZoomLayer` の中身を OSD（全スライス配置）へ | 現行 `useEmakiZoomPan` を薄いライブラリに置換、境界判定を磨く |
| 工数 | **25〜40 人日** | **13〜16 人日** | **3〜5 人日** |
| 内訳 | PoC 3–5 / 幾何アダプタ 2–3 / フック書き換え 5–8 / 詞書オーバーレイ 3–5 / UI・全画面・a11y 3–4 / 計測再実装 2–3 / PWA・パイプライン 3–5 / 回帰検証・ロールバック 4–6 | PoC 2 / OSD ビューア 3–4 / モーダル UI・i18n 2 / スライス段階ロード・メモリ対策 3–4 / 計測 1 / 回帰・手順書 2 | ライブラリ評価 1 / 差し替え 1–2 / 境界・ピンチ調整 1–2 |
| メリット | 段ジャンプ / シーン検出が座標算術になり、`handleToId` の realign と矩形キャッシュが消える。巻き戻り系バグの構造的排除。将来 IIIF 化の土台 | 既存フック・不変条件・計測を一切壊さない。`UseEmakiZoomPanResult` 契約を保てる。段ジャンプは本来こう動くべき UX にできる | 最小差分 |
| デメリット | 週次 KPI の `image_load_*` 時系列が断絶。PWA・Cloudinary 運用・詞書組版が総作り直し。モバイル Safari のメモリ事故リスク | 「ディープズーム空間」はモーダル内に閉じる（通常閲覧は DOM のまま） | **タイル / ピラミッドが無いのでアプローチ2に到達しない。** 既存 `useEmakiZoomPan`（カーソル基準ズーム・ピンチ復帰・pan clamp）と機能が重複気味 |
| 主リスク | 回帰が広範で検証コストが読めない。原寸が小さいと投資が無駄になる | モーダル全スライス読込時のメモリ / Cloudinary 変換コスト | 「やったのに何も変わらない」 |
| 推奨 | 将来（条件付き） | **次にやるならこれ** | 非推奨（現行実装の方が高機能） |

---

## 4. 総合評価

**「アプローチ2 へ全面移行」は今は推奨しない。** まずアプローチ1の完成度を上げ、計測と解像度監査の結果でアプローチ2の範囲を決める。

1. **測れていない**: `src/libs/api/measurementUtils.js` と `analytics/kpi.yaml` に **ズーム系イベントが1つも存在しない**（`image_loaded` / `image_load_fallback` / `manual_scroll_detected` / `image_load_slow` のみ）。ズーム需要の根拠がなく、25〜40人日の投資判断はできない。
2. **原寸の天井**: 正規化が高さ 1080px なら、タイル化しても情報量は増えない。数値確認だけで判断がつく（0.5人日）。
3. **既にハイブリッド構造**: `ZoomLayer` が兄弟オーバーレイで、`sceneWidthPx` がワールド座標として再利用できる。全面置換は「既に到達している段階」を飛び越える。
4. **Cloudinary Free の制約**: 現行195アセット / 96MB。DZI は資産数26倍であり、Free プランのゲート運用と矛盾する。

---

## 5. 移行ロードマップ

| Phase | 内容 | 工数 | 完了条件 / ゲート |
|---|---|---|---|
| **0. 計測** | ズーム計測を追加: `zoom_open`（source: button/pinch/wheel/dblclick）, `zoom_change`（最終 scale・滞在ms）, `zoom_depth_histogram`。`kpi.yaml` の `events_summary` に追加 | 1–2日 | 2〜4週間のデータ。**ズーム実施率・平均倍率・離脱率**が出る |
| **0.5. 解像度監査** | トップ3絵巻の `srcWidth` / `srcHeight` を実測し「等倍 = 原寸1px : 1CSS px」で最大有効倍率を算出 | 0.5日 | **有効上限が約2倍以下なら Phase 3 は中止**し、現行 `ZoomLayer` の磨き込み（±2枚化・プリロード）で終了 |
| **1. PoC（非公開ルート）** | `/lab/deepzoom`（`noindex`、`dynamic(..., {ssr:false})`、環境フラグ）。既存スライスを Multi-image placement で全結合。`buildPyramid:false` と `w_` 階層を比較。計測: 初期表示ms、`performance.memory` ピーク、総転送バイト、iOS Safari / Android Chrome、現行 `ZoomLayer` との比較 | 2–3日 | メモリ上限内・体感が現行以上。数値は `docs/operations/viewer-scroll-issues/` に新規1本として記録 |
| **2. ZoomLayer 差し替え** | `UseEmakiZoomPanResult` 契約を保持したまま中身を OSD 化（`EmakiConteiner.js` L632–651 / L1264–1276 は無傷）。中心±2〜3枚に拡大、遠方は `w_` 低階層、簡易ミニマップ追加。`tile-loaded` / `tile-load-failed` を既存の `trackImageLoaded` / `trackImageFallback` へ**置換**して時系列を継続 | 5–8日 | 既存フック・計測・PWA・詞書は無変更で通る。ここが「アプローチ2の8割」 |
| **3. 全面置換（条件付き）** | Phase 2 の計測で「モーダル外でも常時パン / ズームしたい」需要が証明された場合のみ。`useEmakiScroll` → `useEmakiViewport`、`useEmakiAutoPlay` 書き換え、`useEmakiPalmDrag` 削除、`_app.handleToId` → `panTo` / `fitBounds`、詞書は OSD overlay + React 二層、`next-pwa` に Cloudinary NetworkOnly 追加。低トラフィック1絵巻で `?viewer=osd` フラグ並走 | 15–25日 | 現行経路を常時残しロールバック可能。`viewer-scroll-issues` の2本の回帰ケースを全通過 |
| **4. タイル化（任意）** | Phase 3 後に原寸が十分大きく、Cloudinary / Vercel のコスト試算が通った場合のみ DZI / IIIF へ | インフラ判断 | — |

---

## 6. 引き継ぐべき不変条件

- 位置・スライス配列は `ekotoba` 幅0マーカーを含む **配列 index に DB（`scene_likes`）と共有ハッシュ `#N` が依存**。OSD ワールド座標に移しても index → 座標の写像で必ず維持（`viewer-image-fallback-hardening.md` §6-4）。
- 「プレースホルダを消して空白を見せない」不変条件は OSD 移行後も対象。`overflow-anchor: none` 相当の再発防止も新実装で要検討（`retrospective.md` §5-3(c)）。
- `src/components/_archive_unused/` と `local-data/pipeline/` は参照しない。

---

## 7. 前提・未確認事項

| 項目 | 状態 |
|---|---|
| スライス原寸（`srcWidth` / `srcHeight`） | **未確認**。§5 Phase 0.5 で確認 |
| ズーム機能の利用実態 | **未計測**。§5 Phase 0 で計測を追加 |
| OSD バンドルサイズの実測 | 未確認（min ~250KB / gzip ~75KB 想定）。`dynamic(..., {ssr:false})` で遅延読込必須 |
| Cloudinary の DZI / IIIF 非対応 | 公式ドキュメントの記載ベース（タイル / `info.json` 配信の記載なし） |
| Next.js 12 / React 18 との互換 | OSD はフレームワーク非依存の vanilla 実装。手動統合を推奨（`EmakiConteiner.js` の既存 `dynamic()` パターンを流用） |

## 参考: 関連ファイル

| ファイル | 役割 |
|---|---|
| `src/hooks/emaki/useEmakiScroll.js` | スクロール処理・シーン検出（OSD 化の最大の改修対象） |
| `src/hooks/emaki/useEmakiAutoPlay.js` | 初回ナッジ・再生モードの rAF ループ |
| `src/hooks/emaki/useEmakiPalmDrag.js` | 手のひらドラッグ（OSD 化で削除可） |
| `src/hooks/emaki/scrollPositionStore.js` | 向き / フルスクリーン復元用スクロール位置 |
| `src/hooks/emaki/useEmakiZoomPan.js` | 現行ズーム & パン（差し替え点） |
| `src/utils/emakiContentWindow.js` | `sceneWidthPx` / 描画窓。ワールド座標系の基礎 |
| `src/utils/emakiSceneDom.js` | `scene-N` id ↔ hash ↔ 配列 index |
| `src/pages/_app.js` | `handleToId`（DOM ジャンプ + realign） |
| `src/components/emaki/layout/EmakiConteiner.js` | ビューア本体・ズーム配線・描画窓 |
| `src/components/emaki/viewer/ZoomLayer.jsx` | 現行ズームオーバーレイ（差し替え対象） |
| `src/components/emaki/viewer/LazyImage.js` | 画像ローダー・フォールバック計測 |
| `src/types/viewer.ts` | `UseEmakiZoomPanResult` などフック契約 |
| `cloudinary-breakdown.json` | 絵巻別アセット数・容量 |
| `analytics/kpi.yaml` | 週次レビューのイベント一覧（ズーム系なし） |
