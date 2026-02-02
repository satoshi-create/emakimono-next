import ActionButton from "@/components/emaki/viewer/ActionButton";
import { AppContext } from "@/pages/_app";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useEffect, useState } from "react";

const CarouselComponent = ({ articleRef, isAtStart, isAtEnd, isAutoScrolling, isUIVisible }) => {
  const { orientation } = useContext(AppContext);

  const con = articleRef.current;

  // 教育現場向けUI: 初回のみ「次へ進む」ボタンを強調表示
  const [highlightNext, setHighlightNext] = useState(true);

  // 初回のレンダリング時に次に進むボタンを強調
  useEffect(() => {
    setHighlightNext(true);

    // アニメーションが終わったらフラグをfalseに戻す
    const timer = setTimeout(() => {
      setHighlightNext(false);
    }, 10000); // 2秒後に強調を解除

    return () => clearTimeout(timer); // クリーンアップ
  }, []);

  // 教育現場向けUI: 次に進むボタン - 状態更新なし（scroll イベントで自動更新）
  const handleNextClick = () => {
    if (con) {
      con.scrollTo({
        left:
          orientation === "landscape"
            ? con.scrollLeft - 800
            : con.scrollLeft - 300,
        behavior: "smooth",
      });
    }
  };

  // 教育現場向けUI: 元に戻るボタン - 状態更新なし（scroll イベントで自動更新）
  const handlePrevClick = () => {
    if (con) {
      con.scrollTo({
        left:
          orientation === "landscape"
            ? con.scrollLeft + 800
            : con.scrollLeft + 300,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      {/* 教育現場向けUI: 次へ進むボタン（終了位置では非表示） */}
      {!isAtEnd && (
        <ActionButton
          icon={
            <FontAwesomeIcon
              icon={faChevronLeft}
              style={{ fontSize: "1.5em" }}
            />
          }
          label="次へ"
          description="次へ"
          pos="absolute"
          top="50%"
          left="calc(10px + env(safe-area-inset-left, 0px))"
          zIndex="100"
          variant="carousel"
          onClick={handleNextClick}
          highlightNext={highlightNext}
          isUIVisible={isUIVisible}
        />
      )}

      {/* 教育現場向けUI: 元に戻るボタン（開始位置または自動スクロール中は非表示） */}
      {!isAtStart && !isAutoScrolling && (
        <ActionButton
          icon={
            <FontAwesomeIcon
              icon={faChevronRight}
              style={{ fontSize: "1.5em" }}
            />
          }
          label="前へ"
          description="前へ"
          pos="absolute"
          top="50%"
          right="calc(10px + env(safe-area-inset-right, 0px))"
          zIndex="100"
          variant="carousel"
          onClick={handlePrevClick}
          isUIVisible={isUIVisible}
        />
      )}
    </>
  );
};

export default CarouselComponent;
