/**
 * 自動スクロール制御（初回ナッジ + 再生モード）。
 *
 * - 初回ナッジ: 初回表示時のみ、横スクロール可能性を緩やかな自動スクロールで認知させる
 *   （hash付きURLで開いた場合はスキップ）
 * - 再生モード: ユーザー任意の自動スクロール（▶/停止ボタン）
 * - 両者は同一の rAF スクロールループを使う（スクロール速度: PC 2.4 / Tablet 1.6 / Mobile 1.2）
 * - 静止UI耐性（useEmakiIdleUI）を内部合成し、isUIVisible / showUI も提供する
 *
 * 抽出元: EmakiConteiner.js の「初回ナッジ」useEffect + 再生モード関数群。
 * 依存: lastDetectedSceneRef / isAtStartRef / isAtEndRef / isScrollingRef 等は
 * 呼び出し側（EmakiConteiner）から ref を受け取る。
 */
import { useEffect, useRef, useState } from "react";
import {
  trackAutoScrollStarted,
  trackAutoScrollInterrupted,
  trackInitialLoadWithHash,
  getDeviceType,
} from "@/libs/api/measurementUtils";
import useEmakiIdleUI from "./useEmakiIdleUI";

const useEmakiAutoPlay = ({
  articleRef,
  dataId,
  emakiId,
  navIndex,
  setnavIndex,
  lastDetectedSceneRef,
  isAtStartRef,
  isAtEndRef,
  setIsAtStart,
  setIsAtEnd,
  isScrollingRef,
  setIsScrolling,
}) => {
  const [isAutoScrolling, setIsAutoScrolling] = useState(false); // 自動スクロール中か（初回ナッジ用）
  const [isPlayMode, setIsPlayMode] = useState(false);
  const playModeAnimationRef = useRef(null); // 再生モードのアニメーションID

  const { isUIVisible, showUI } = useEmakiIdleUI({
    emakiId,
    isAutoScrolling,
    isPlayMode,
  });

  // 教育現場向けUI: 初回表示時のみ、横スクロール可能性を
  // 緩やかな自動スクロールで認知させるナッジ（操作説明なし）
  useEffect(() => {
    const keyName = `visited_${dataId}`;
    const isFirstVisit = !sessionStorage.getItem(keyName);

    // 絵巻ハイパーリンク: hash付きURL（シーン指定リンク）で開いた場合はナッジをスキップ
    // ユーザーが特定シーンを共有した意図を尊重し、該当シーンから閲覧開始
    const hasHashInUrl = typeof window !== "undefined" && window.location.hash;

    // 計測: hash付きURLでの初期表示
    if (hasHashInUrl && isFirstVisit) {
      const hashSceneIndex = parseInt(window.location.hash.replace("#", ""), 10);
      if (!isNaN(hashSceneIndex)) {
        trackInitialLoadWithHash(emakiId, hashSceneIndex);
      }
    }

    if (isFirstVisit && !hasHashInUrl) {
      const el = articleRef.current;
      if (!el) return;

      // デバイスタイプに応じたスクロール速度を設定
      // PC: 2.4px/frame, Tablet: 1.6px/frame, Mobile: 1.2px/frame
      const width = window.innerWidth;
      const scrollSpeed = width >= 1024 ? 2.4 : width >= 768 ? 1.6 : 1.2;

      let animationId = null;
      let stopped = false;

      // CSS scroll-behavior の干渉を防ぐため一時的に無効化
      const originalScrollBehavior = el.style.scrollBehavior;
      el.style.scrollBehavior = "auto";

      const stopAutoScroll = (interruptMethod = null) => {
        if (stopped) return;
        stopped = true;

        // 計測: 自動スクロール中断（ユーザー操作による場合）
        if (interruptMethod) {
          const scrollWidth = el.scrollWidth;
          const clientWidth = el.clientWidth;
          const maxScrollLeft = scrollWidth - clientWidth;
          const scrollRatio = maxScrollLeft > 0 ? Math.abs(el.scrollLeft) / maxScrollLeft : 0;
          trackAutoScrollInterrupted(emakiId, interruptMethod, scrollRatio);
        }

        // 教育現場向けUI: 自動スクロール停止を通知
        // これにより「戻る」ボタンが表示可能になる
        setIsAutoScrolling(false);

        // 自動再生中に抑制していた端点 state を同期
        setIsAtStart(isAtStartRef.current);
        setIsAtEnd(isAtEndRef.current);

        // 自動再生中は navIndex を止めていたため、停止時に現在シーンへ同期する
        if (lastDetectedSceneRef.current !== navIndex) {
          setnavIndex(lastDetectedSceneRef.current);
        }

        // スクロール停止を通知（自動再生中はタイマーをスキップしているため明示的にリセット）
        isScrollingRef.current = false;
        setIsScrolling(false);

        if (animationId) cancelAnimationFrame(animationId);
        el.style.scrollBehavior = originalScrollBehavior;
        el.removeEventListener("mousedown", handleMousedown);
        el.removeEventListener("wheel", handleWheel);
        el.removeEventListener("touchstart", handleTouchstart);
        document.removeEventListener("click", handleClick);
      };

      // 計測用: 各操作種別のハンドラー
      const handleMousedown = () => stopAutoScroll("mousedown");
      const handleWheel = () => stopAutoScroll("wheel");
      const handleTouchstart = () => stopAutoScroll("touch");
      const handleClick = () => stopAutoScroll("click");

      const autoScroll = () => {
        if (stopped) return;

        const currentScrollLeft = el.scrollLeft;
        const newScrollLeft = currentScrollLeft - scrollSpeed;

        // スクロール範囲の端（左端）に到達したら停止（毎フレーム再計算）
        const minScrollLeft = -(el.scrollWidth - el.clientWidth);

        if (newScrollLeft < minScrollLeft) {
          stopAutoScroll();
          return;
        }

        el.scrollLeft = newScrollLeft;
        animationId = requestAnimationFrame(autoScroll);
      };

      // ユーザー操作（ドラッグ／ホイール／タッチ／クリック）で即座に停止
      el.addEventListener("mousedown", handleMousedown, { once: true });
      el.addEventListener("wheel", handleWheel, { once: true });
      el.addEventListener("touchstart", handleTouchstart, { once: true });
      document.addEventListener("click", handleClick, { once: true });

      // 初期描画・レイアウト確定後に自動スクロール開始
      const timerId = setTimeout(() => {
        // 絵巻ハイパーリンク: ナッジ開始直前に再度hashをチェック
        // SSG/hydration完了後にhashが正しく取得できるようになるため
        // useEffect冒頭のチェックだけでは不十分
        const hasHashNow = window.location.hash;
        if (hasHashNow) {
          stopped = true;
          el.style.scrollBehavior = originalScrollBehavior;
          return;
        }

        if (!stopped) {
          // 教育現場向けUI: 自動スクロール開始を通知
          // これにより「戻る」ボタンが非表示になる
          setIsAutoScrolling(true);

          // 計測: 初回自動スクロール開始
          trackAutoScrollStarted(emakiId, getDeviceType());

          sessionStorage.setItem(keyName, true);

          // レイアウト確定を待ってから開始（画像 decode 前の scrollWidth 変動を軽減）
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (stopped) return;
              animationId = requestAnimationFrame(autoScroll);
            });
          });
        }
      }, 500);

      return () => {
        clearTimeout(timerId);
        stopAutoScroll();
      };
    }
  }, [dataId, emakiId]);

  // 教育現場向けUI: 再生モード - 停止関数
  // playModeAnimationRef.currentをnullにすることでアニメーションループを終了させる
  const stopPlayMode = () => {
    if (playModeAnimationRef.current) {
      cancelAnimationFrame(playModeAnimationRef.current);
      playModeAnimationRef.current = null;
    }

    setIsPlayMode(false);

    // 自動再生中は navIndex を止めていたため、停止時に現在シーンへ同期する
    // （解説バー・ナビの現在段表示を再生中の最終位置に合わせる）
    if (lastDetectedSceneRef.current !== navIndex) {
      setnavIndex(lastDetectedSceneRef.current);
    }

    // スクロール停止を通知（自動再生中はタイマーをスキップしているため明示的にリセット）
    isScrollingRef.current = false;
    setIsScrolling(false);

    // UI復帰: 静止UI耐性のタイマーに委ねる
    showUI();
  };

  // 教育現場向けUI: 再生モード - 開始関数
  const startPlayMode = () => {
    const el = articleRef.current;
    if (!el) return;

    // 既に再生中、または初回ナッジ中は開始しない
    if (playModeAnimationRef.current || isAutoScrolling) return;

    setIsPlayMode(true);

    // デバイスタイプに応じたスクロール速度（初回ナッジと同じ）
    const width = window.innerWidth;
    const scrollSpeed = width >= 1024 ? 2.4 : width >= 768 ? 1.6 : 1.2;

    // CSS scroll-behavior の干渉を防ぐため一時的に無効化
    const originalScrollBehavior = el.style.scrollBehavior;
    el.style.scrollBehavior = "auto";

    const playScroll = () => {
      // 停止されていたら終了（refがnullなら停止済み）
      if (playModeAnimationRef.current === null) {
        el.style.scrollBehavior = originalScrollBehavior;
        return;
      }

      const currentScrollLeft = el.scrollLeft;
      const newScrollLeft = currentScrollLeft - scrollSpeed;

      // スクロール範囲の端（左端）に到達したら停止（毎フレーム再計算）
      const minScrollLeft = -(el.scrollWidth - el.clientWidth);

      if (newScrollLeft < minScrollLeft) {
        setIsPlayMode(false);
        showUI(); // UI復帰
        setIsAtStart(isAtStartRef.current);
        setIsAtEnd(isAtEndRef.current);
        // 末尾到達時も現在シーンへ同期（再生中の navIndex 抑制のため）
        if (lastDetectedSceneRef.current !== navIndex) {
          setnavIndex(lastDetectedSceneRef.current);
        }
        el.style.scrollBehavior = originalScrollBehavior;
        playModeAnimationRef.current = null;
        return;
      }

      el.scrollLeft = newScrollLeft;
      playModeAnimationRef.current = requestAnimationFrame(playScroll);
    };

    playModeAnimationRef.current = requestAnimationFrame(playScroll);
  };

  // 教育現場向けUI: 再生モード - クリーンアップ
  useEffect(() => {
    return () => {
      if (playModeAnimationRef.current) {
        cancelAnimationFrame(playModeAnimationRef.current);
        playModeAnimationRef.current = null;
      }
    };
  }, []);

  return {
    isAutoScrolling,
    isPlayMode,
    startPlayMode,
    stopPlayMode,
    playModeAnimationRef,
    // 絵巻切替リセット effect・ホイール停止ハンドラが Conteiner 側から直接呼ぶ
    setIsPlayMode,
    isUIVisible,
    showUI,
  };
};

export default useEmakiAutoPlay;
