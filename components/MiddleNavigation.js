import { AppContext } from "@/pages/_app";
import {
  Box,
  Grid,
  GridItem,
  IconButton,
  Text,
  useColorModeValue,
  useMediaQuery,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import { FaBars } from "react-icons/fa";
import LikeButton from "./LikeButton";

const MiddleNavigation = ({ title, titleen, edition, author }) => {
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

  const styles = {
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
    },
  };

  return (
    <Box style={styles.container}>
      <Grid templateColumns="1fr auto" alignItems="center" px={4} py={2}>
        {/* タイトル: 左寄せ */}
        <GridItem>
          <Text fontSize="lg" fontWeight="bold" color={iconColor}>
            {locale == "en" ? titleen : title} {locale == "ja" && edition}
          </Text>
        </GridItem>

        {/* ボタン: 右寄せ */}
        <GridItem display="flex" gap={2}>
          <LikeButton
            title={title}
            p
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
