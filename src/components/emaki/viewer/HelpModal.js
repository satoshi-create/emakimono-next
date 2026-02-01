import styles from "@/styles/HelpModal.module.css";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "@/pages/_app";

/**
 * 内部ヘルプモーダル
 *
 * 設計原則:
 * - 絵巻閲覧文脈を分断しない（背景に絵巻を維持）
 * - 非言語ナッジ: アイコンベースで「見せる」形式
 * - 閉じ方: 背景クリック / Escapeキー / 閉じるボタン
 * - モーダル表示中は絵巻のスクロールを固定
 * - デバイスに応じたヘルプ内容の切り替え
 */
const HelpModal = () => {
  const { closeHelpModal } = useContext(AppContext);

  // タッチデバイス判定（画面幅ではなくデバイスの能力で判定）
  // フルスクリーン時に横向きになっても、タッチデバイスならモバイル用UIを表示
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // タッチデバイスかどうかを判定
    // navigator.maxTouchPoints: タッチポイントの最大数（0ならタッチ非対応）
    // 'ontouchstart' in window: タッチイベントがサポートされているか
    const checkTouchDevice = () => {
      const hasTouchPoints = navigator.maxTouchPoints > 0;
      const hasTouchEvent = 'ontouchstart' in window;
      return hasTouchPoints || hasTouchEvent;
    };

    setIsTouchDevice(checkTouchDevice());
  }, []);

  // Escapeキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeHelpModal();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeHelpModal]);

  // モーダル表示中は絵巻のスクロールを固定
  useEffect(() => {
    // ホイールイベントをブロック
    const blockWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // キーボードの矢印キーをブロック
    const blockArrowKeys = (e) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // タッチイベントをブロック（SP/TB用）
    const blockTouch = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // capture フェーズでイベントをブロック（他のリスナーより先に実行）
    document.addEventListener("wheel", blockWheel, { passive: false, capture: true });
    document.addEventListener("keydown", blockArrowKeys, { capture: true });
    document.addEventListener("touchmove", blockTouch, { passive: false, capture: true });

    return () => {
      document.removeEventListener("wheel", blockWheel, { capture: true });
      document.removeEventListener("keydown", blockArrowKeys, { capture: true });
      document.removeEventListener("touchmove", blockTouch, { capture: true });
    };
  }, []);

  return (
    <div className={styles.overlay}>
      {/* 背景クリックで閉じる */}
      <div className={styles.backdrop} onClick={closeHelpModal} />

      <div className={styles.modal}>
        <button
          className={styles.closeBtn}
          onClick={closeHelpModal}
          aria-label="ヘルプを閉じる"
        >
          <FontAwesomeIcon icon={faClose} />
        </button>

        <h3 className={styles.title}>絵巻の見方</h3>

        <div className={styles.content}>
          {isTouchDevice ? (
            // タッチデバイス（SP/TB）: スワイプ + 矢印キー
            <>
              <div className={styles.helpItem}>
                <div className={styles.iconWrapper}>
                  {/* スワイプアイコン */}
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    {/* 指のアイコン */}
                    <path
                      d="M12 14V6C12 4.89543 12.8954 4 14 4C15.1046 4 16 4.89543 16 6V12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M16 11C16 9.89543 16.8954 9 18 9C19.1046 9 20 9.89543 20 11V14C20 17.3137 17.3137 20 14 20H12C9.79086 20 8 18.2091 8 16V14"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    {/* 左右矢印（動き） */}
                    <path
                      d="M4 12L7 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <animate
                        attributeName="opacity"
                        values="1;0.3;1"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </path>
                    <path
                      d="M5 10L3 12L5 14"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <animate
                        attributeName="opacity"
                        values="1;0.3;1"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </svg>
                </div>
                <p className={styles.label}>スワイプで左右にスクロール</p>
              </div>

              <div className={styles.helpItem}>
                <div className={styles.iconWrapper}>
                  {/* 矢印キーアイコン */}
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M15 18L9 12L15 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 18L15 12L9 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      transform="translate(6, 0)"
                      opacity="0.4"
                    />
                  </svg>
                </div>
                <p className={styles.label}>矢印キーで移動できます</p>
              </div>
            </>
          ) : (
            // PC（非タッチデバイス）: ホイール + 矢印キー + スクロールバー
            <>
              <div className={styles.helpItem}>
                <div className={styles.iconWrapper}>
                  {/* マウスホイールアイコン */}
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="9"
                      y="6"
                      width="6"
                      height="12"
                      rx="3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <circle cx="12" cy="10" r="1.5" fill="currentColor">
                      <animate
                        attributeName="cy"
                        values="10;14;10"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </svg>
                </div>
                <p className={styles.label}>ホイールで左右にスクロール</p>
              </div>

              <div className={styles.helpItem}>
                <div className={styles.iconWrapper}>
                  {/* 矢印キーアイコン */}
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M15 18L9 12L15 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 18L15 12L9 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      transform="translate(6, 0)"
                      opacity="0.4"
                    />
                  </svg>
                </div>
                <p className={styles.label}>矢印キーでも移動できます</p>
              </div>

              <div className={styles.helpItem}>
                <div className={styles.iconWrapper}>
                  {/* スクロールバーアイコン */}
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    {/* スクロールバーのトラック */}
                    <rect
                      x="3"
                      y="18"
                      width="18"
                      height="3"
                      rx="1.5"
                      stroke="currentColor"
                      strokeWidth="1"
                      fill="none"
                    />
                    {/* スクロールバーのつまみ（左右に動く） */}
                    <rect
                      x="6"
                      y="18.5"
                      width="6"
                      height="2"
                      rx="1"
                      fill="currentColor"
                    >
                      <animate
                        attributeName="x"
                        values="6;12;6"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </rect>
                    {/* 左右矢印 */}
                    <path
                      d="M5 12L9 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M6 10L4 12L6 14"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M19 12L15 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M18 10L20 12L18 14"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className={styles.label}>横スクロールバーでも移動できます</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
