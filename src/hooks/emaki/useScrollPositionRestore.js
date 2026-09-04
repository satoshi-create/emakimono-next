/**
 * フルスクリーン / 向き切替時のスクロール位置復元。
 *
 * - 向き変更前に beginScrollRestore() で isTransitioning を立て、再マウント中の ratio 上書きを防ぐ
 * - 画像読込で scrollWidth が伸びる間（RESTORE_WINDOW_MS）は ResizeObserver で ratio を再適用
 * - unmount cleanup では isTransitioning を落とさない（新旧インスタンスのレース防止）
 * - ratio が無い／復元失敗時は navIndex へ handleToId フォールバック
 * - navIndex 変化では再実行しない（ref で最新値のみ参照）
 */
import { useEffect, useRef } from "react";

const RESTORE_WINDOW_MS = 2000;

const useScrollPositionRestore = ({
  articleRef,
  dataId,
  toggleFullscreen,
  orientation,
  scrollPositionStore,
  navIndex = 0,
  handleToId,
}) => {
  const navIndexRef = useRef(navIndex);
  const handleToIdRef = useRef(handleToId);
  navIndexRef.current = navIndex;
  handleToIdRef.current = handleToId;

  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;

    const hasRatio = scrollPositionStore.scrollRatio > 0;
    const sameEmaki =
      scrollPositionStore.emakiId === null ||
      scrollPositionStore.emakiId === dataId;

    // 初回マウントかつ保存なし → スキップ（入場 hash は handleToId 側）
    if (!hasRatio && !scrollPositionStore.isTransitioning) return;
    if (!sameEmaki) return;

    scrollPositionStore.restored = false;
    scrollPositionStore.isTransitioning = true;

    const applyRatio = () => {
      const maxScrollLeft = el.scrollWidth - el.clientWidth;
      if (maxScrollLeft <= 0 || scrollPositionStore.scrollRatio <= 0) {
        return false;
      }
      el.scrollLeft = -(scrollPositionStore.scrollRatio * maxScrollLeft);
      return true;
    };

    const startedAt = Date.now();

    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        applyRatio();
      });
    });

    const ro = new ResizeObserver(() => {
      if (Date.now() - startedAt > RESTORE_WINDOW_MS) return;
      applyRatio();
    });
    ro.observe(el);

    const doneTimer = setTimeout(() => {
      const ok = applyRatio();
      scrollPositionStore.restored = true;
      scrollPositionStore.isTransitioning = false;

      const sceneId = navIndexRef.current;
      const toId = handleToIdRef.current;
      const stuckAtStart =
        scrollPositionStore.scrollRatio > 0.05 && Math.abs(el.scrollLeft) < 8;
      if (typeof toId === "function" && sceneId > 0 && (!ok || stuckAtStart)) {
        toId(sceneId);
      }
    }, RESTORE_WINDOW_MS);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      clearTimeout(doneTimer);
      // isTransitioning は落とさない（次インスタンスの begin〜restore に引き継ぐ）
    };
  }, [toggleFullscreen, orientation, dataId, articleRef, scrollPositionStore]);
};

export default useScrollPositionRestore;
