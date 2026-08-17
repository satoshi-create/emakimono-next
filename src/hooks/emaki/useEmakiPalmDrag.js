/**
 * 手のひらモード（PC限定）: マウス押下で手のひらアイコン・grabカーソルを表示し、
 * ドラッグで絵巻を横スクロール（パン）させる。
 *
 * - Pointer Events の pointerType でマウスのみ判定（タッチ端末では無効）
 * - リスナー再登録を避けるため依存配列は空で、判定はすべて ref 経由
 * - suppressClickUntilRef: ドラッグ直後の click（sidebar を閉じる onClick）を短時間抑止する期限
 *
 * 抽出元: EmakiConteiner.js の「手のひらモード」useEffect。
 */
import { useEffect, useRef, useState } from "react";

const useEmakiPalmDrag = (articleRef) => {
  const [isPalmMode, setIsPalmMode] = useState(false); // UI用: バッジ・カーソル表示
  const palmActiveRef = useRef(false); // ハンドラ用: パン中フラグ（即時反映）
  const dragRef = useRef(null); // { startX, startScrollLeft }
  const didDragRef = useRef(false); // ドラッグ実行済みか
  const suppressClickUntilRef = useRef(0); // ドラッグ直後のclick抑止期限（ms）

  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;

    // ボタン・リンク上の押下は無効化（クリック操作を維持）
    const isInteractive = (target) =>
      target && target.closest && target.closest("a, button, [role='button']");

    // 画像のネイティブドラッグを常時抑止（パン操作と競合するため）
    // 押下ごとに draggable を切替えると、押下→再描画の間に
    // ネイティブドラッグが発動する競合が起きる
    const preventNativeDrag = (e) => e.preventDefault();
    el.addEventListener("dragstart", preventNativeDrag);

    const handlePointerDown = (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if (isInteractive(e.target)) return;

      didDragRef.current = false;
      dragRef.current = { startX: e.clientX, startScrollLeft: el.scrollLeft };
      palmActiveRef.current = true;
      setIsPalmMode(true); // 手のひらアイコン・grabカーソルを表示
      try {
        el.setPointerCapture(e.pointerId); // ドラッグ中の要素外追従を保証
      } catch {
        /* ignore */
      }
    };

    const handlePointerMove = (e) => {
      if (!dragRef.current) return;

      const dx = e.clientX - dragRef.current.startX;
      if (Math.abs(dx) > 3) didDragRef.current = true;

      // 押下中は常にパン。
      // RTL（row-reverse）では scrollLeft が負値空間（0=右端/最初、負=先へ進む）。
      // 紙を掴んで動かす直感（右ドラッグ=絵巻も右へ=進む）に合わせ、
      // マウス変位を減算して scrollLeft を減少（より負へ）させる
      el.scrollLeft = dragRef.current.startScrollLeft - dx;
    };

    const finishDrag = (e) => {
      if (dragRef.current) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      dragRef.current = null;
      palmActiveRef.current = false;
      setIsPalmMode(false); // 手のひらアイコンを非表示

      // ドラッグ実行後は click（sidebar を閉じる onClick）を短時間抑止。
      // click が発火しないケース（pointercancel 等）でも期限で自然に解除される。
      if (didDragRef.current) {
        suppressClickUntilRef.current = Date.now() + 200;
        didDragRef.current = false;
      }
    };

    el.addEventListener("dragstart", preventNativeDrag);
    el.addEventListener("pointerdown", handlePointerDown);
    el.addEventListener("pointermove", handlePointerMove);
    el.addEventListener("pointerup", finishDrag);
    el.addEventListener("pointercancel", finishDrag);
    return () => {
      el.removeEventListener("dragstart", preventNativeDrag);
      el.removeEventListener("pointerdown", handlePointerDown);
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("pointerup", finishDrag);
      el.removeEventListener("pointercancel", finishDrag);
    };
  }, []);

  return { isPalmMode, suppressClickUntilRef };
};

export default useEmakiPalmDrag;
