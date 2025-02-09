import React, { useEffect, useContext } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Grid,
  GridItem,
  IconButton,
  Text,
  useColorModeValue,
  useMediaQuery,
  Button,
} from "@chakra-ui/react";
import { AppContext } from "../pages/_app";
import LikeButton from "./LikeButton";
import { TableOfContents, Play } from "lucide-react";
import styles from "../styles/MiddleNavigation.module.css";

const MiddleNavigation = ({ title, edition, author }) => {
    const { handleFullScreen } = useContext(AppContext);

  const { locale } = useRouter();
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

  const style = {
    container: {
      position: "fixed",
      // bottom: '50px',
      bottom: stickyClass === "header-fixed" ? "50px" : "-100px", // 隠れる位置: 画面外 (-100px)
      width: "100%",
      backgroundColor: bgColor,
      boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.1)",
      zIndex: "999",
      transform:
        stickyClass === "header-fixed" ? "translateY(0)" : "translateY(100%)",
      transition: "transform 0.5s ease-in-out",
      padding: "1rem 0.5rem",
    },
  };

  return (
    <Box style={style.container}>
      <Grid
        templateColumns="1fr auto"
        templateRows={2}
        alignItems="center"
        gap={4}
      >
        {/* タイトル: 左寄せ */}
        <GridItem gridRow={1} gridColumn={1}>
          <Text fontSize="lg" fontWeight="bold" color={iconColor}>
            {title} {edition && edition}
          </Text>
        </GridItem>
        {/* ボタン: 右寄せ */}
        <GridItem display="flex" gap={2} gridRow={1} gridColumn={2}>
          <LikeButton
            title={title}
            edition={edition}
            author={author}
            ort={"prt"}
          />
          <IconButton
            aria-label="メニュー"
            icon={<TableOfContents />}
            variant="ghost"
            color={iconColor}
            onClick={() => openModal(0)}
          />
        </GridItem>
        <GridItem gridRow={2} gridColumn="1 / span 2" justifyItems={"center"}>
          <button
            type="button"
            value="Lock Landscape"
            onClick={() => handleFullScreen("landscape")}
            className={styles.linkedbutton}
          >
            <Play />
            {locale === "en"
              ? "Enjoy the picture scroll in full screen"
              : "フルスクリーンで絵巻を楽しむ"}
          </button>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default MiddleNavigation;
