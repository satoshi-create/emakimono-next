// =============================================================================
// 1. ボードカード配置計算（Pure Logic）
// =============================================================================

const CARD_HORIZONTAL_STEP = 265;
const INITIAL_BOARD_X = -260;
const INITIAL_BOARD_Y = -160;

/**
 * 既存アイテム一覧をもとに、新規カードの初期配置座標（boardX, boardY）を算出する
 * - 明示的に boardX / boardY が指定されている場合はその値を優先
 * - 未指定かつ既存カードがある場合は、最右端カードのすぐ右隣へ配置して座標乖離を防ぐ
 * - 0枚の場合は初期原点付近（-260, -160）へ配置
 */
type BoardCardItem = {
  boardX?: number | string | null;
  boardY?: number | string | null;
};
type BoardCardPositionRequest = { boardX?: number | string; boardY?: number | string };

export function computeNextBoardCardPosition(
  existingItems: BoardCardItem[] = [],
  requested: BoardCardPositionRequest = {}
): { boardX: number; boardY: number } {
  let defaultX = INITIAL_BOARD_X;
  let defaultY = INITIAL_BOARD_Y;

  if (Array.isArray(existingItems) && existingItems.length > 0) {
    let rightMost = existingItems[0];
    for (const item of existingItems) {
      if ((Number(item?.boardX) || 0) > (Number(rightMost?.boardX) || 0)) {
        rightMost = item;
      }
    }
    defaultX = Math.round(Number(rightMost?.boardX) || 0) + CARD_HORIZONTAL_STEP;
    defaultY = Math.round(Number(rightMost?.boardY) || 0);
  }

  const boardX =
    requested.boardX !== undefined
      ? Math.round(Number(requested.boardX)) || 0
      : defaultX;
  const boardY =
    requested.boardY !== undefined
      ? Math.round(Number(requested.boardY)) || 0
      : defaultY;

  return { boardX, boardY };
}