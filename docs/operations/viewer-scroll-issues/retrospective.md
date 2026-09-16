# 巻き戻り現象（横スクロール中のリワインド）解析・修正の振り返り

- 作成日: 2026-09-08
- 対象ブランチ: `perf/dev-viewer-load-cleanup`（後に `main` へマージ）
- 修正コミット: `c30de45f` fix: stop palm-drag and scrollbar rewind via deferred scene commit
- マージ: `0f052c41` Merge branch 'perf/dev-viewer-load-cleanup'（main）

---

## 1. 症状

絵巻ビューアーを PC で閲覧中、以下の操作をすると「巻き戻り」が発生する。

- 左クリック長押し（手のひらドラッグ）で横スクロール
- スクロールバーで横スクロール

具体的な症状:

1. スクロール中に、到達した位置が突然シーン先頭付近へ巻き戻る（例: シーン2 の中間 `-10520px` → シーン2 先頭 `-2338px`）
2. スムーズに動かず「角ばった」動きになる
3. 素早くスクロールすると特に顕著（遅延読込の追い付かなさが原因に見えたが、本体は別にあった）

補足: 自動再生（初回ナッジ）が復活した後の確認で、ナッジと手動スクロールの競合も疑われたが、最終的には複合要因だった。

---

## 2. 前提知識（RTL レイアウトの scrollLeft）

絵巻は RTL（`row-reverse` 的レイアウト）のため、`scrollLeft` は **負値空間** を取る。

- `scrollLeft = 0` … 右端（最初）
- `scrollLeft < 0` … 先へ進むほど負の値が大きくなる（例: `-10520` は `-2338` より先）

つまり「先へ進む」=「より負へ増える」。検証ログでは負の値が 0 方向へ戻る挙動を「巻き戻り」と呼ぶ。

---



## 3. 調査アプローチ



### 3-1. DevTools コンソールプローブ（scrollLeft の書き込み監視）

原因が「誰かが scrollLeft を書き換えている」「再マウントされている」「ブラウザ内部でリセットされている」のどれかを切り分けるため、`Element.prototype.scrollLeft` の setter をフックするスニペットを実行した。

```js
// プローブ例: scrollLeft への書き込みを発火元スタック付きで記録
const TARGET = "article.scrollbar"; // スクロールコンテナ
const desc = Object.getOwnPropertyDescriptor(Element.prototype, "scrollLeft");
const origGet = desc.get, origSet = desc.set;
Object.defineProperty(Element.prototype, "scrollLeft", {
  get() { return origGet.call(this); },
  set(v) {
    const el = this;
    if (el.matches(TARGET)) {
      const prev = origGet.call(el);
      const delta = v - prev;
      if (Math.abs(delta) > 1) {
        console.log(
          `[WRITE] ${prev.toFixed(0)} -> ${v.toFixed(0)} (d=${delta.toFixed(0)})`,
          (new Error().stack || "").split("\n").slice(2, 6).join(" | ")
        );
      }
    }
    return origSet.call(el, v);
  },
});
```

注意点（実地で踏んだ罠）:

- `scrollLeft` は `HTMLElement.prototype` ではなく `Element.prototype` に定義されている。`HTMLElement.prototype` をフックすると `Cannot read properties of undefined` になる。
- `v - prev` が小さい代入（丸め等）はノイズなので無視する。



### 3-2. ログで判明した事実

- 巻き戻りが起きる瞬間に、コードからの `scrollLeft` setter 呼び出しや `scrollTo` が必ずしも記録されないケースがあった → 「再マウント」または「ハッシュ追従 effect」の関与が疑われた。
- `MutationObserver` で DOM 変化を監視し、pointer 系イベント・click も記録。
- イベントログから、ドラッグ**中**ではなくドラッグとドラッグの**間**（静止後）に巻き戻りが起きていることが判明。
- 最終的に、`_app.js` の `handleToId` → `scrollContainer.scrollTo({ left: シーン先頭 })` の呼び出しが、**ユーザーのドラッグ操作中に**発火しているログを捕捉した。`[MOVED]`（ユーザーが動かした位置）と強制位置の乖離が「巻き戻り」として知覚されていた。

---



## 4. 根本原因（複合要因）



### 主因 1: 共有ハッシュ入場 effect の再実行（最大の巻き戻し源）

`EmakiConteiner.js` の「共有リンク入場」effect は、URL の `#シーン番号` を見て `handleToId(hash, { realign: true })` を実行する。

修正前のコードは「ハッシュが無い状態で入場した場合」に `didApplyEntryHashRef.current = true` が**実行されない**構造だった（hashflag が 0 なら return してしまうため）。

すると:

1. ユーザーがドラッグでスクロール → スクロール検出が `navIndex` を更新
2. `liveSceneIndex` 追従 effect が自分で URL に `#シーン番号` を書き込む
3. 上記 effect が `navIndex` / hash の変化で**再実行**され、今度は hashflag が入っている
4. 「入場時の hash（例 `#1`）≠ 現在の navIndex（例 2）」のズレで `handleToId(hash, { realign: true })` が発火 → `scrollTo(シーン先頭)`
5. `realign: true` のため `handleToId` 内の `ResizeObserver` が最大 2.5 秒間 `scrollTo` を繰り返し適用

→ ユーザーの到達位置が古い hash シーン先頭へ強制的に戻される = **巻き戻り**。

### 主因 2: パームドラッグ中のシーン確定（setnavIndex）

`useEmakiScroll.js` の `detectCurrentScene` はスクロール停止 150ms 後に最寄りシーンを判定し `setnavIndex()` を呼ぶ。パームドラッグ中（長押ししている間）にもこの判定が走ると:

- `navIndex` 更新 → `EmakiConteiner` 全体の再レンダー（殻 → 中身マウント・eager 再評価）
- 入力フレームに再レンダーが割り込む → 「角ばった」動き
- さらに主因 1 の effect を間接的に誘発 → 巻き戻り連鎖



### 副次要因


| 要因                                      | 内容                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `contentWindowCenter` の毎フレーム `setState` | スクロールの scroll イベント毎に React state 更新 → 再レンダー多発。ドラッグ中の追い付き不全の一因            |
| ドラッグ方式が「開始位置基準の絶対値代入」                   | `pointerdown` 時点の `startScrollLeft` が古いと基準値へ飛ぶ（スナップバック）                  |
| ブラウザの scroll anchoring                  | コンテンツ伸長時にブラウザが scrollLeft を自動調整 → RTL では巻き戻りに見える                         |
| ナッジ（自動再生）と手動スクロールの取り合い                  | ナッジが自分の rAF で scrollLeft を書き続け、scrollbar 操作等では discrete イベントで検知できず即停止しない |


---



## 5. 修正内容と修正後のロジック



### 5-1. 共有ハッシュ入場 effect を「初回で確定」にする

ファイル: `src/components/emaki/layout/EmakiConteiner.js`（L403–423）

修正後は effect の冒頭（hashflag を読む前）で `didApplyEntryHashRef.current = true` にし、**入場処理は初回実行の 1 回だけ**と確定する。

```js
const didApplyEntryHashRef = useRef(false);
useEffect(() => {
  if (!scroll || didApplyEntryHashRef.current) return;
  didApplyEntryHashRef.current = true; // 初回で確定（hashflag が 0 でも true にする）
  const hashflag = Number(String(window.location.hash || "").replace("#", ""));
  if (!hashflag) return;
  // ... handleToId(hashflag, { realign: true }) ...
}, [scroll, data.id, handleToId, navIndex]);
```

- 以後、スクロール検出で自分が書いた hash と navIndex がズレても `handleToId` は再実行されない → **主因 1 の巻き戻し連鎖を断つ**。
- 向き変更による再マウント時は新しいインスタンスになるため、共有リンク入場の再適用は従来どおり機能する（機能は維持）。



### 5-2. パームドラッグ中はシーン確定を保留し、離した直後に 1 回だけ確定



#### `useEmakiPalmDrag.js`: パン中フラグ `palmActiveRef` を公開

もともと内部で持っていた `palmActiveRef`（pointerdown〜finishDrag の間 true）を戻り値に追加した。

```js
return { isPalmMode, suppressClickUntilRef, palmActiveRef };
```



#### `useEmakiScroll.js`: `detectCurrentScene` がパン中はシーン確定をスキップ

`detectCurrentScene` が「最寄りシーンを確定して `setnavIndex()`」する直前で、パン中なら return する。ドラッグ中はユーザーが位置を選んでいる最中なので確定しない。

```js
// パームドラッグ中はシーン確定を保留する（...）。ドラッグ終了時（Conteiner 側）に最終1回だけ検出する。
if (palmActiveRef?.current) {
  return;
}
```



#### `EmakiConteiner.js`: ドラッグ終了（pointerup）後に最終シーンを 1 回確定

`isPalmMode` が true → false に変わった直後（+120ms）、`detectCurrentSceneRef.current()` を 1 回だけ呼ぶ。ドラッグ中は debounce(150ms) が発火済みで最後の scroll イベント後に走らないケースがあるため、終了時に必ず確定する。

```js
const wasPalmActiveRef = useRef(false);
useEffect(() => {
  if (isPalmMode) {
    wasPalmActiveRef.current = true;
    return undefined;
  }
  if (!wasPalmActiveRef.current) return undefined;
  wasPalmActiveRef.current = false;
  const t = setTimeout(() => {
    if (typeof detectCurrentSceneRef.current === "function") {
      detectCurrentSceneRef.current();
    }
  }, 120);
  return () => clearTimeout(t);
}, [isPalmMode]);
```

→ ドラッグ中に `navIndex` 更新由来の再レンダーとハッシュ追従が発生しなくなり、**主因 2（角ばり + 巻き戻り連鎖）を解消**。型定義 `src/types/viewer.ts` の `UseEmakiPalmDragResult` にも `palmActiveRef: RefObject<boolean>` を追加済み。

### 5-3. 副次要因への対応（巻き戻りの見え方を抑える補助修正）



#### (a) ドラッグを「増分スクロール」方式に変更（スナップバック防止）

`useEmakiPalmDrag.js` L58–64。従来は `el.scrollLeft = startScrollLeft - dx`（開始位置基準の絶対値代入）だったため、pointerdown 時点の位置が古い（直前の慣性・画像ロードで動いた後）と基準値へ飛んでいた。pointermove ごとに直前クライアント座標との差だけを加算する方式へ変更。

```js
const deltaX = e.clientX - dragRef.current.lastClientX;
dragRef.current.lastClientX = e.clientX;
el.scrollLeft -= deltaX;
```



#### (b) `contentWindowCenter` の state 反映をアイドル時へ集約

`useEmakiScroll.js` L243–274, L81, L427–433。描画窓中心の state 更新は rAF で ref を進めつつ、React state への反映は `requestIdleCallback`（未対応環境は 200ms タイマー）に 1 回へ集約。パンドラッグのフレーム内で `EmakiConteiner` の再レンダーが割り込まないようにし、入力 → 描画の追い付き不全による「ジャンプ感」を抑える。

#### (c) ブラウザの scroll anchoring を無効化

`src/styles/EmakiConteiner.module.css` L39 に `overflow-anchor: none;` を追加。殻 → 中身のマウントや画像デコードでブラウザが scrollLeft を自動調整すると RTL では巻き戻りに見えるため、自動調整を無効化。

#### (d) ナッジ（自動再生）と手動スクロールの競合を解消

`useEmakiAutoPlay.js`。ナッジ実行中にスクロールバー等の「discrete イベントでは検知できない手動操作」が入った場合も即停止できるよう、scroll イベント監視を追加した。

- `lastSelfScrollLeft`: ナッジ自身が書き込んだ直後の scrollLeft を毎フレーム記録
- `handleScroll`（scroll リスナー）: 現在の scrollLeft が `lastSelfScrollLeft` から `NUDGE_MANUAL_OVERRIDE_PX = 8px` 以上離れていたら「手動操作」とみなし `stopAutoScroll("scrollbar")` を実行
- あわせて `sessionStorage.setItem(keyName, true)`（＝初回ナッジを実施済みにする記録）を、従来の「リスナー登録時」から「ナッジ開始時 / 中断時」へ移動し、自動再生が再訪時に実行されない不具合（前回セッションで発生した退行）を修正

---



## 6. 検証結果

修正後、PC（マウス長押しドラッグ・スクロールバー）で以下を確認し、いずれも解消した:

- ドラッグ中に巻き戻らない（途中で止めてもその位置に留まる）
- 滑らかに追従する（角ばらない）
- 止めた位置と URL の `#シーン番号` が一致する
- 初回ナッジの自動再生も正常に動作する

ユーザー確認により「問題はすべて解決しました」を得て、`perf/dev-viewer-load-cleanup` にコミット → push → `main` へマージ済み。

---



## 7. あとから見る人への注意点

1. **「巻き戻り」は単一原因ではなかった**。主因は「共有ハッシュ入場 effect の再実行 → handleToId(realign)」で、ドラッグ中のシーン確定・アンカリング・ナッジ競合はそれを増幅・別症状化していた。
2. デバッグの決め手は「scrollLeft 書き込みのスタック付きフック + MutationObserver + イベント記録」の組み合わせ。setter が見えないリセットは「再マウント / effect 再実行」を疑うこと。
3. `scrollLeft` フックは `Element.prototype` が正しい（`HTMLElement.prototype` ではない）。
4. RTL 環境では「先へ進む = scrollLeft がより負へ」を常に意識する。
5. ナッジの `lastSelfScrollLeft` 方式は「自分が書いた位置からのズレ」で手動操作を検知する汎用パターン。scrollbar / 矢印キー / 慣性など discrete イベントで取れない操作の検知に使える。



## 参考: 関連ファイル


| ファイル                                            | 役割                                          |
| ----------------------------------------------- | ------------------------------------------- |
| `src/components/emaki/layout/EmakiConteiner.js` | 入場ハッシュ effect の初回確定・パン終了時のシーン確定・フラグ配線       |
| `src/hooks/emaki/useEmakiScroll.js`             | シーン検出（パン中スキップ）・描画窓 state の idle 集約          |
| `src/hooks/emaki/useEmakiPalmDrag.js`           | 増分スクロール・`palmActiveRef` 公開                  |
| `src/hooks/emaki/useEmakiAutoPlay.js`           | ナッジの手動操作検知と即停止・sessionStorage 記録タイミング修正     |
| `src/styles/EmakiConteiner.module.css`          | `overflow-anchor: none`                     |
| `src/types/viewer.ts`                           | `UseEmakiPalmDragResult.palmActiveRef` の型追加 |


