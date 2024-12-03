import React, { useRef,useEffect, useState } from "react";
import { Box, Button, Flex, IconButton } from "@chakra-ui/react";
import { ArrowBackIcon, ArrowForwardIcon } from "@chakra-ui/icons";
import ActionButton from "./ActionButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAnglesLeft,
  faAnglesRight,
  faChevronLeft,
  faChevronRight,
  faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

const CarouselComponent = ({ scrollNextRef, scrollPrevRef, articleRef }) => {
  const con = articleRef.current;

  const [nextClicked, setNextClicked] = useState(false);
  const [highlightNext, setHighlightNext] = useState(false); // 強調するフラグ

  // 初回のレンダリング時に次に進むボタンを強調
  useEffect(() => {
    setHighlightNext(true);

    // アニメーションが終わったらフラグをfalseに戻す
    const timer = setTimeout(() => {
      setHighlightNext(false);
    }, 10000); // 2秒後に強調を解除

    return () => clearTimeout(timer); // クリーンアップ
  }, []);

  console.log(nextClicked);

  // 次に進むボタンがクリックされたときの処理
  const handleNextClick = () => {
    setNextClicked(true); // 次に進むボタンをクリックしたら、状態を更新
    if (con) {
      // 横スクロール（右方向）
      con.scrollTo({
        left: con.scrollLeft - 1000,
        behavior: "smooth",
      });
    }
  };

  // 元に戻るボタンがクリックされたときの処理
  const handlePrevClick = () => {
    // setNextClicked(false); // 元に戻るボタンをクリックしたら、状態を更新
    if (con) {
      // 横スクロール（右方向）
      con.scrollTo({
        left: con.scrollLeft + 1000,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      {/* 左ボタン */}
        <ActionButton
          // ref={scrollNextRef}
          icon={
            <FontAwesomeIcon
              icon={faChevronLeft}
              style={{ fontSize: "1.5em" }}
            />
          }
          label="絵巻を次へ進める"
          description="絵巻を次へ進める"
          pos="absolute"
          top="50%"
          left="10px"
          zIndex="100"
          variant="carousel"
          onClick={handleNextClick}
          highlightNext={highlightNext}
        />
      {/* 右ボタン */}
      {nextClicked && (
        <ActionButton
          // ref={scrollPrevRef}
          icon={
            <FontAwesomeIcon
              icon={faChevronRight}
              style={{ fontSize: "1.5em" }}
            />
          }
          label="絵巻を巻き戻して再鑑賞"
          description="絵巻を巻き戻して再鑑賞"
          pos="absolute"
          top="50%"
          right="10px"
          zIndex="100"
          variant="carousel"
          onClick={handlePrevClick}
        />
      )}
    </>
  );
};

export default CarouselComponent;
