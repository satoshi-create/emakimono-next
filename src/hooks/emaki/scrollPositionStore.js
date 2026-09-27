/**
 * Module-scope scroll position for fullscreen / orientation remount.
 * Kept out of EmakiConteiner so _app can reset without pulling the viewer graph.
 */

export const scrollPositionStore = {
  scrollLeft: 0,
  scrollRatio: 0,
  restored: false,
  isTransitioning: false,
  emakiId: null,
  /** handleToId ジャンプ中は連番拘束を一時解除 */
  isProgrammaticScroll: false,
};

/** Call from _app on emaki page transitions */
export const resetScrollPositionStore = () => {
  scrollPositionStore.scrollLeft = 0;
  scrollPositionStore.scrollRatio = 0;
  scrollPositionStore.restored = false;
  scrollPositionStore.isTransitioning = false;
  scrollPositionStore.emakiId = null;
  scrollPositionStore.isProgrammaticScroll = false;
};

/** Call before orientation change to avoid ratio=0 overwrite during remount */
export const beginScrollRestore = () => {
  scrollPositionStore.restored = false;
  scrollPositionStore.isTransitioning = true;
};
