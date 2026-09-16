# 画像ローダー並列度抑制・タイムアウト再設計および空白化防止の振り返り

- 作成日: 2026-09-15
- 対象ブランチ: `fix/viewer-image-fallback-hardening`（後に `main` へマージ）
- 修正コミット: `fix(viewer): throttle eager lookahead and harden image fallback timeouts`
- マージ: `main`

---

## 1. 症状

2026-09-14 の週次アナリティクスレポートにおいて、以下の課題が検出された。

1. **フォールバックの極端な集中**:

- サイト全体の画像フォールバック（`image_load_fallback`）計 660 件のうち、**555 件（84.1%）が鳥獣人物戯画 甲巻（**`Chōjū-jinbutsu-giga_first`**）単一作品で発生**。

1. **デスクトップへの偏重**:

- 甲巻のフォールバック 555 件中、**551 件（99.3%）がデスクトップ（PC）環境**（モバイルは 3 件、タブレットは 1 件）。
- 内訳は `universal_timeout` が 443 件、`priority_timeout` が 108 件。

1. **フォールバック後の即離脱**:

- 閲覧継続比率（`eng ÷ fallback`）がモバイルの `1.56` に対し、デスクトップは `0.48` と極端に低く、フォールバック発生後にスクロールを中断して離脱していた。

---



## 2. 前提知識とデータ構造の特性



### 2-1. `LazyImage.js` のタイムアウト機構

- **アダプティブタイムアウト**: 過去の読み込み実測時間（`loadTimeSamples`）の平均 × 2.5 倍を動的閾値とする。
- **下限クランプ**: `TIMEOUT_BOUNDS` の `min` 値が下限として働き、`Math.max(bounds.min, avg * 2.5)` でクランプされる。



### 2-2. 絵巻データのスロット構成

- 絵巻データ（`image-metadata-cache.json`）には `cat: "image"` だけでなく `cat: "ekotoba"` が混在する。
- 甲巻には画像を持たない `cat: "ekotoba"` が 9 件存在するが、これは詞書（文字画像）ではなく幅ゼロの「段見出し（章題）マーカー」である。

---



## 3. 調査・検証のアプローチと判明した事実



### 3-1. ログのクロス集計分析

- ネットワーク回線ログ（`ga4_session_context_crosstab.json`）の分析により、デスクトップの接続環境は `4g` および `unknown`（光回線等）が大半で、`3g` は 4 件のみと判明。
- したがって「低速回線環境」ではなく、**「一般的なデスクトップ通信環境でローダーの判定を自ら踏み抜いている」** ことが確定した。



### 3-2. コード解析で特定された 4 つの構造欠陥

1. **下限張り付きと生存バイアス（逆転現象）**:

- `loadTimeSamples` が `localStorage` に単一キーで永続化されていた。
- キャッシュヒットによる数十ミリ秒の超高速完了や、詞書オーバーレイの軽量画像が混入する一方、遅延してタイムアウトした画像は完了ハンドラを通らないためサンプルに入らない（生存バイアス）。
- その結果、閲覧が進むほど閾値が最短の下限値（`universal`: 3.0s / `priority`: 1.5s）に張り付いていた。

1. **過剰な同時 eager 先読み × オフスクリーン即時計時**:

- `MANUAL_IMAGE_LOOKAHEAD = 6` により、初期表示時に 0〜6 の 7〜8 枚が一斉に `loading="eager"` でマウントされていた。
- critical な点として、**画面外（オフスクリーン）の画像であってもマウント時点で 3.0s のタイマーが起動していた**。
- HTTP/2 下で帯域が等分（1/N）され、画面外の画像が 3.0s 以内に受信完了できずタイムアウトを量産していた。

1. **デスクトップでの解像度過大要求（**`w_3840`**）**:

- Next.js の `images.deviceSizes` に `2560` が未定義だったため、横画面（`75vh` × DPR 2）で 2048px を超えると即座に最上位の `w_3840`（Cloudinary 原寸出力）が要求され、転送バイト数が跳ね上がっていた。

1. **フォールバック時の空白化バグ（離脱の真因）**:

- タイムアウト発火時に `setImageLoaded(true)` と `setSkeletonVisible(false)` が呼ばれ、実画像が未達であるにもかかわらずスケルトンを消去していた。
- 画面が真っ白な空白領域となり、ユーザーが「壊れている」と誤認して即離脱（`eng÷fallback = 0.48`）していた。



### 3-3. 誤証と再検証（反証による棄却）

- **仮説「座標混在（**`uniqueIndex` **と配列 index）が甲巻の前方を過剰に eager 化させている」の検証**:
- 実測の結果、座標ズレによる平均 eager 枚数はむしろ意図した値より少なくなっていた。
- 他巻（乙巻: ズレ15でフォールバック1件、丙巻: ズレ14で4件）との比較により、座標混在は甲巻突出（84%）の主因ではないと判明し、重み付けを撤回・修正した。
- **甲巻突出（4倍の残差）の真因**:
- 甲巻はサイト最大の一次着地（Direct Landing）ページであり、Cloudinary への `preconnect` がないコールドスタート状態で初期バースト通信（8枚同時）を食らっていたこと、および先頭スライスのアスペクト比が広く転送負荷が最大だったことが重なったためと判明。

---



## 4. 修正内容と実装ロジック



### 4-1. 先読み枠の縮小とオフスクリーン計時の抑止

ファイル: `src/libs/constants/viewerPlayback.js`、`src/components/emaki/viewer/LazyImage.js`

先読み枚数を絞り込み、画面外にある eager 画像のタイマー起動を阻止。

```js
// src/libs/constants/viewerPlayback.js
export const MANUAL_IMAGE_LOOKAHEAD = 2;   // 6 → 2（先頭2枚+可視近傍のみ eager）
export const PLAYBACK_IMAGE_LOOKAHEAD = 3; // 8 → 3
export const CONTENT_WINDOW_AHEAD = 6;     // 10 → 6（section 殻は維持、中身マウント数を抑制）
```

- `LazyImage.js` において、3 系統あったフォールバック effect を 1 本に統合。
- `isEager` であっても、マウント時点ではなくビューポート進入圏内（`rootMargin: "200px"`）に入った瞬間からフォールバック計時を開始するように改修。



### 4-2. 空白化の廃止とエラーハンドリング

ファイル: `src/components/emaki/viewer/LazyImage.js`

タイムアウト発火時に `setImageLoaded/setSkeletonVisible` を呼ぶ処理を撤廃。本画像が `onLoadingComplete` を迎えるまでスケルトンを維持し、ユーザーに空白を見せない仕様へ変更。さらに `<Image onError="{...}">` を追加して読み込み失敗時は `load_error` を送出。

### 4-3. タイムアウト判定の再設計とサンプル汚染防止

ファイル: `src/components/emaki/viewer/LazyImage.js`

- `localStorage` による永続化を撤廃し、セッション内（インメモリ）限定に修正。
- `loadTimeMs < 150ms`（キャッシュヒット/即 decode）および `emakiId` なしの画像をサンプル除外。
- 下限値（`min`）およびフォールバック閾値を引き上げ：
- `priority`: `{ min: 3000, max: 12000, fallback: 5000 }`
- `universal`: `{ min: 5000, max: 18000, fallback: 8000 }`
- `fullscreen`: `{ min: 4000, max: 15000, fallback: 6000 }`
- 死に設定となっていた `PER_EMAKI_TIMEOUT` のキーを `titleen` 体系へ修正（`Chōjū-jinbutsu-giga_first: 1.3` 等を追加）。



### 4-4. インフラ・解像度最適化と計測修正

- `src/pages/_document.js`: `res.cloudinary.com` への `<link rel="preconnect" ... />` を追加（一次着地の DNS/TLS 遅延解消）。
- `next.config.js`: `images.deviceSizes` に `2560` を追加（デスクトップでの 3840px 跳ね上がり防止）。
- `src/utils/cloudinaryUrl.js`: loader に `c_limit` を明示。
- `src/components/emaki/layout/EmakiConteiner.js`: `trackSessionContext` に URL 文字列長ではなく `cat === "image"` の実配列長を渡すよう修正。

---



## 5. 検証結果



### 5-1. ビルド検証

- `npm run build` 完走（所要時間: 11.7分 → **3.2分** へ大幅短縮）。
- TypeScript / ESLint エラー 0 件。



### 5-2. 実機・DevTools（Network タブ）検証

手元環境（PM2 / production）および本番環境（Vercel）にて以下を確認：

1. **初期リクエストの抑制**:

- 甲巻入場時の Cloudinary 初期リクエストが、従来の 7〜8 本から **先頭 3 本のみ**（`_01`, `_02`, `_03`）に激減。

1. **順次ロードとウォーターフォールの正常化**:

- スクロール進行に伴い、後続画像が 1〜2 本ずつ段階的に取得される挙動を確認。

1. **フォールバック発生ゼロ**:

- 先頭から末尾シーン（シーン30・31）への高速スクロール・長距離ジャンプ時も、`image_load_fallback` の発火は **0 件**。

1. **フォーマット最適化**:

- `f_auto` により、画像特性に応じて `jpeg`（190〜330KB）および `webp`（170KB 前後）が適切に選択され、無駄な大容量通信が排除された。

---



## 6. あとから見る人への注意点

1. **タイムアウトの下限値（**`min`**）は実質的な固定値になりやすい**:

動的算出ロジックを入れても、`Math.max(bounds.min, ...)` がある限り、高速なサンプルが混入すると容易に下限へ張り付く。サンプルのフィルタリング（キャッシュ除外等）と下限値の余裕設定が不可欠。
2. **オフスクリーン要素にフォールバックタイマーを持たせない**:
`loading="eager"` はブラウザへの先読み指示に留めるべきであり、可視領域（あるいは進入直前マージン）に達する前に JavaScript の離脱・障害判定タイマーを起動してはならない。
3. **フォールバック＝成功とみなしてプレースホルダーを消さない**:
画像が取得できていない状態でスケルトンを非表示にすると、UI は完全な「空白（抜け落ち）」になる。画像ローダーは必ず `onLoadingComplete` を唯一の表示完了トリガーとすること。
4. `cat: "ekotoba"` **のスロットを安易に配列から削除しない**:
画像を持たないマーカーであっても、DB（`scene_likes`）や共有ハッシュ（`#scene-${index}`）が配列インデックスに依存している場合、エントリの削除はデータのズレを招く。削除ではなく `!src` による非同期描画分岐で扱うこと。

---



## 参考: 関連ファイル


| ファイル                                            | 役割                                         |
| ----------------------------------------------- | ------------------------------------------ |
| `src/libs/constants/viewerPlayback.js`          | 先読み枚数（lookahead）・描画窓幅定数                    |
| `src/components/emaki/viewer/LazyImage.js`      | 画像ローダー・タイムアウト判定・スケルトン制御                    |
| `src/pages/_document.js`                        | Cloudinary への preconnect / dns-prefetch 設定 |
| `next.config.js`                                | 画像最適化の `deviceSizes` 設定                    |
| `src/utils/cloudinaryUrl.js`                    | Cloudinary 画像変換 URL ビルダー（`c_limit` 明示）     |
| `src/components/emaki/layout/EmakiConteiner.js` | 計測コンテキストへの画像総数渡し                           |


