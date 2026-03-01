// libs/api/scrollService.ts
import { supabase } from '@/libs/supabaseClient';
import type { ScrollResponse, ScrollMetadata } from '@/types/scroll';

/**
 * 指定した scroll_id のメタデータを取得する（scrolls/[id] 詳細ページ用）
 */
export const getScrollData = async (scrollId: string): Promise<ScrollResponse | null> => {
  const { data, error } = await supabase.rpc('get_scroll_metadata', {
    target_id: scrollId,
  });

  if (error) {
    console.error('データ取得に失敗しました:', error.message);
    return null;
  }

  return data as ScrollResponse;
};

/**
 * 指定した数値 id のメタデータを取得する（[slug] ビューアーで scroll_id 解決用）
 * RPC の target_id が数値 id の場合はこちらを使用する
 */
export const getScrollMetadataById = async (id: number): Promise<ScrollResponse | null> => {
  const { data, error } = await supabase.rpc('get_scroll_metadata', {
    target_id: id,
  });

  if (error) {
    console.error('メタデータ取得に失敗しました:', error.message);
    return null;
  }

  return data as ScrollResponse;
};

/**
 * 一覧用：全作品メタデータを取得（トップページ等）
 * SQL で id 昇順になっている前提でそのまま返す
 */
export const getScrollList = async (): Promise<ScrollMetadata[]> => {
  const { data, error } = await supabase.rpc('get_all_scroll_metadata');

  if (error) {
    console.error('一覧取得に失敗しました:', error.message);
    return [];
  }

  return (data ?? []) as ScrollMetadata[];
};
