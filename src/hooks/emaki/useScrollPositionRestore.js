/**
 * フルスクリーン切り替え時のスクロール位置復元。
 *
 * toggleFullscreen / orientation 変化時に、保存済みの scrollRatio を使って
 * スクロール位置を復元する（フルスクリーン切替で再マウントしても位置を維持）。
 *
 * - 初回マウント時・別絵巻へ遷移中はスキップ
 * - rAF 2回でレイアウト確定後に1回だけ復元、ResizeObserver で画像読込後の再試行、
 *   300ms フォールバックタイマーで必ず終了
 *
 * 抽出元: EmakiConteiner.js の「フルスクリーン切り替え時のスクロール位置復元」useEffect。
 */
import { useEffect } from "react";

const useScrollPositionRestore = ({
  articleRef,
  dataId,
  toggleFullscreen,
  orientation,
  scrollPositionStore,
}) => {
  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;

    // 初回マウント時はスキップ（スクロール位置が保存されていない）
    if (scrollPositionStore.scrollRatio === 0) return;

    // 別絵巻へ遷移中は復元しない（旧 scrollRatio の誤適用防止）
    if (
      scrollPositionStore.emakiId !== null &&
      scrollPositionStore.emakiId !== dataId
    ) {
      return;
    }

    scrollPositionStore.restored = false;
    scrollPositionStore.isTransitioning = true;

    const restoreScrollPosition = () => {
      if (scrollPositionStore.restored) return;

      const scrollWidth = el.scrollWidth;
      const clientWidth = el.clientWidth;
      const maxScrollLeft = scrollWidth - clientWidth;

      if (maxScrollLeft <= 0) return;

      if (scrollPositionStore.scrollRatio > 0) {
        el.scrollLeft = -(scrollPositionStore.scrollRatio * maxScrollLeft);
        scrollPositionStore.restored = true;
        scrollPositionStore.isTransitioning = false;
      }
    };

    // レイアウト確定後に1回だけ復元（複数 setTimeout によるジャンプを防止）
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(restoreScrollPosition);
    });

    const ro = new ResizeObserver(() => {
      if (!scrollPositionStore.restored) {
        restoreScrollPosition();
      }
    });
    ro.observe(el);

    const fallbackTimer = setTimeout(() => {
      restoreScrollPosition();
      scrollPositionStore.isTransitioning = false;
    }, 300);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      clearTimeout(fallbackTimer);
      scrollPositionStore.isTransitioning = false;
    };
  }, [toggleFullscreen, orientation, dataId]);
};

export default useScrollPositionRestore;
