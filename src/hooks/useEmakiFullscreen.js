/**
 * フルスクリーン制御（入/切 + ブラウザ主導の状態同期 + Fキーショートカット）。
 *
 * - handleFullScreen(orientation): ボタン操作による入/切。入時に画面向きをロック
 * - fullscreenchange: ESC・ブラウザUIでの解除を state へ同期（計測: esc_or_browser）
 * - Fキー: /[slug] ページでのみ有効（入力欄フォーカス中は無効）
 * - isFullscreenTransitioningRef: 切り替え中フラグ（scrollDialog / handleToId 抑制用）
 * - exitFullscreenForNavigation: 別絵巻遷移時のフルスクリーン解除（routeChangeStart で呼ぶ）
 *
 * 抽出元: _app.js のフルスクリーン関連ブロック。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  trackFullscreenEnter,
  trackFullscreenExit,
} from "@/libs/api/measurementUtils";

const useEmakiFullscreen = (navIndex) => {
  const router = useRouter();

  const [toggleFullscreen, setToggleFullscreen] = useState(false);
  // P0改修: フルスクリーン切り替え中フラグ（scrollDialog抑制用）
  // useRef を使用することで、state更新を待たずに即座に値が反映される
  const isFullscreenTransitioningRef = useRef(false);
  // Step B修正: フラグ解除タイマーIDをuseRefで管理
  // useEffect再実行によるクリーンアップでタイマーがキャンセルされる問題を回避
  const fullscreenTransitionTimerRef = useRef(null);
  // 計測用: ボタン操作での終了計測済みフラグ
  const fullscreenExitTrackedRef = useRef(false);

  // キーボードショートカット（F: 全画面入/切）用に最新の handleFullScreen を保持
  // handleFullScreen は毎レンダーで再生成されるため、ref 経由で最新版を参照する
  const handleFullScreenRef = useRef(null);

  const handleFullScreen = async (orientation) => {
    // P0改修: フルスクリーン切り替え開始時点でフラグを立てる
    // （scrollDialogの抑制を確実にするため、handleFullScreen内でも設定）
    isFullscreenTransitioningRef.current = true;

    const de = document.documentElement; // ドキュメントのルート要素
    const isFullscreen =
      !!document.fullscreenElement || !!document.webkitFullscreenElement;

    // 計測用: 絵巻IDをURLから取得
    const emakiSlug = router.asPath.split("#")[0].replace("/", "");

    try {
      if (!isFullscreen) {
        // フルスクリーンを開始
        if (de.requestFullscreen) {
          await de.requestFullscreen();
        } else if (de.webkitRequestFullscreen) {
          await de.webkitRequestFullscreen(); // iOS Safari対応
        } else {
          throw new Error("Fullscreen API is not supported on this browser.");
        }

        document.documentElement.classList.add("fullscreen-enabled");
        setToggleFullscreen(true);

        // 計測: フルスクリーン開始
        trackFullscreenEnter(emakiSlug, navIndex);

        // 画面の向きをロック
        try {
          await screen.orientation.lock(orientation);
        } catch (orientationError) {
          console.warn(`Failed to lock orientation: ${orientationError}`);
        }
      } else {
        // フルスクリーンを解除
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen(); // iOS Safari対応
        }

        document.documentElement.classList.remove("fullscreen-enabled");
        setToggleFullscreen(false);

        // 計測: フルスクリーン終了（ボタン操作）
        trackFullscreenExit(emakiSlug, "button");
        fullscreenExitTrackedRef.current = true; // 重複計測防止
      }
    } catch (fullscreenError) {
      console.error(`Fullscreen error: ${fullscreenError}`);
      // Step B修正: エラー時はfullscreenchangeイベントが発火しない可能性があるため
      // フラグを即座に解除（スクロール操作がブロックされ続けることを防ぐ）
      isFullscreenTransitioningRef.current = false;
    }
  };

  // レンダーごとに最新の handleFullScreen を ref へ反映
  handleFullScreenRef.current = handleFullScreen;

  // キーボードショートカット: Fキーで全画面入/切
  // 絵巻ビューアページ（/[slug]）でのみ有効
  useEffect(() => {
    if (router.pathname !== "/[slug]") return;

    const handleFullscreenShortcut = (e) => {
      // 素のFキーのみ（Ctrl/Cmd+F のブラウザ検索・テキスト入力とは競合しない）
      if (e.key !== "f" && e.key !== "F") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // 検索欄・フォーム入力中は無効化
      const tag = e.target?.tagName;
      if (tag && /^(INPUT|TEXTAREA|SELECT)$/i.test(tag)) return;

      e.preventDefault();
      handleFullScreenRef.current?.("landscape");
    };

    document.addEventListener("keydown", handleFullscreenShortcut);
    return () => document.removeEventListener("keydown", handleFullscreenShortcut);
  }, [router.pathname]);

  // P0改修: ブラウザ主導のフルスクリーン状態変化を監視
  // ESCキーやブラウザUIでのフルスクリーン解除時にstateを同期
  useEffect(() => {
    const handleFullscreenChange = () => {
      // ブラウザの実際のフルスクリーン状態を取得（Single Source of Truth）
      const isActuallyFullscreen =
        !!document.fullscreenElement || !!document.webkitFullscreenElement;

      // 全画面用 CSS クラス（article サイズ・overflow 制御）
      document.documentElement.classList.toggle(
        "fullscreen-enabled",
        isActuallyFullscreen
      );

      // 計測: ESC/ブラウザ主導のフルスクリーン終了
      // ボタン操作での終了は handleFullScreen で計測済みなのでスキップ
      if (!isActuallyFullscreen && toggleFullscreen && !fullscreenExitTrackedRef.current) {
        const emakiSlug = router.asPath.split("#")[0].replace("/", "");
        trackFullscreenExit(emakiSlug, "esc_or_browser");
      }
      // フラグをリセット
      fullscreenExitTrackedRef.current = false;

      // フルスクリーン切り替え中フラグを立てる（scrollDialog抑制用）
      isFullscreenTransitioningRef.current = true;

      // アプリのstateをブラウザの実状態に同期
      setToggleFullscreen(isActuallyFullscreen);

      // Step B修正: タイマーIDをuseRefで管理
      // useEffectの再実行（setToggleFullscreenによる）でクリーンアップが走っても
      // タイマーがキャンセルされないようにする
      if (fullscreenTransitionTimerRef.current) {
        clearTimeout(fullscreenTransitionTimerRef.current);
      }
      fullscreenTransitionTimerRef.current = setTimeout(() => {
        isFullscreenTransitioningRef.current = false;
        fullscreenTransitionTimerRef.current = null;
      }, 500); // 500ms: requestAnimationFrame × 2 + 余裕
    };

    // 標準イベント + WebKit prefix（Safari対応）
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    // クリーンアップ: イベントリスナーの削除のみ
    // Step B修正: タイマーはuseRefで管理されており、useEffect再実行時にキャンセルしない
    // （フラグ解除を確実に完了させるため）
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, [toggleFullscreen, router.asPath]);

  // 別絵巻遷移（routeChangeStart）時のフルスクリーン解除
  const exitFullscreenForNavigation = useCallback(async () => {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl) {
      void (async () => {
        try {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
          }
          setToggleFullscreen(false);
          if (screen.orientation?.unlock) {
            screen.orientation.unlock();
          }
        } catch {
          setToggleFullscreen(false);
        }
      })();
    }
  }, []);

  return {
    toggleFullscreen,
    setToggleFullscreen,
    handleFullScreen,
    isFullscreenTransitioningRef,
    exitFullscreenForNavigation,
  };
};

export default useEmakiFullscreen;
