/**
 * 絵巻 titleen に紐づく絵引（民俗）データを提供する。
 * 段単位（chapter = CSV scene_id）でアイテムを抽出する。
 */
import {
  folkloreByTitleen,
  getFolkloreItemById,
  getFolkloreItemsByChapter,
  getFolkloreItemsByTitleen,
} from "@/data/folklore/folkloreIndex";
import { useMemo } from "react";

/**
 * @param {string} titleen
 */
export default function useFolkloreForScroll(titleen) {
  const itemsForScroll = useMemo(
    () => getFolkloreItemsByTitleen(titleen),
    [titleen]
  );

  const chapterMap = useMemo(
    () => folkloreByTitleen[titleen] ?? {},
    [titleen]
  );

  const hasFolklore = itemsForScroll.length > 0;

  /**
   * @param {string|number} chapter
   */
  const getItemsForChapter = (chapter) =>
    getFolkloreItemsByChapter(titleen, chapter);

  return {
    hasFolklore,
    itemsForScroll,
    chapterMap,
    getItemsForChapter,
    getItemById: getFolkloreItemById,
  };
}
