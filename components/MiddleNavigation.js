import React, { useEffect, useContext, useState } from "react";
import {
  Box,
  Grid,
  GridItem,
  IconButton,
  Text,
  useColorModeValue,
  useMediaQuery,
} from "@chakra-ui/react";
import { FaHeart, FaBars } from "react-icons/fa";
import { AppContext } from "../pages/_app";
import LikeButton from "./LikeButton";

const MiddleNavigation = ({ title, edition, author }) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const iconColor = useColorModeValue("gray.600", "gray.300");

  const { stickyClass, setStickyClass, openModal, setisModalOpen } =
    useContext(AppContext);

  useEffect(() => {
    const stickNavbar = () => {
      let windowHeight = window.scrollY;
      windowHeight > 80 ? setStickyClass("header-fixed") : setStickyClass("");
    };
    window.addEventListener("scroll", stickNavbar);
  }, [setStickyClass]);

  useEffect(() => {
    setisModalOpen(false);
  }, [setisModalOpen]);

  // 画面幅が768px以上かを判定
  const [isLargerThan768] = useMediaQuery("(min-width: 768px)");

  // 幅768px以上の場合は何もレンダリングしない
  if (isLargerThan768) return null;

  return (
    <Box
      position="fixed"
      bottom="50px" // ボトムナビゲーションの上
      width="100%"
      bg={bgColor}
      boxShadow="0 -2px 10px rgba(0, 0, 0, 0.1)"
      zIndex="999"
      display={stickyClass === "header-fixed" ? "block" : "none"}
    >
      <Grid templateColumns="1fr auto" alignItems="center" px={4} py={2}>
        {/* タイトル: 左寄せ */}
        <GridItem>
          <Text fontSize="lg" fontWeight="bold" color={iconColor}>
            {title} {edition && edition}
          </Text>
        </GridItem>

        {/* ボタン: 右寄せ */}
        <GridItem display="flex" gap={2}>
          <LikeButton
            title={title}
            edition={edition}
            author={author}
            ort={"prt"}
          />
          <IconButton
            aria-label="メニュー"
            icon={<FaBars />}
            variant="ghost"
            color={iconColor}
            onClick={() => openModal(0)}
          />
        </GridItem>
      </Grid>
    </Box>
  );
};

export default MiddleNavigation;
