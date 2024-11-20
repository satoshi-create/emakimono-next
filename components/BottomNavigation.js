import React, { useEffect, useContext } from "react";
import {
  Box,
  Flex,
  Text,
  useColorModeValue,
  useMediaQuery,
} from "@chakra-ui/react";
import {
  FaHome,
  FaScroll,
  FaCrown,
  FaSearch,
  FaEllipsisH,
} from "react-icons/fa";
import { useRouter } from "next/router";
import { AppContext } from "../pages/_app";

const BottomNavigation = () => {
  const { stickyClass, setStickyClass } = useContext(AppContext);

  useEffect(() => {
    const stickNavbar = () => {
      let windowHeight = window.scrollY;
      windowHeight > 80 ? setStickyClass("header-fixed") : setStickyClass("");
    };
    window.addEventListener("scroll", stickNavbar);
  }, [setStickyClass]);

  const bgColor = useColorModeValue("white", "gray.800");
  const iconColor = useColorModeValue("gray.600", "gray.300");
  const activeColor = useColorModeValue("blue.500", "blue.300");
  const router = useRouter();

  // 画面幅が768px以上かを判定
  const [isLargerThan768] = useMediaQuery("(min-width: 768px)");

  const navItems = [
    { label: "ホーム", icon: <FaHome />, path: "/" },
    { label: "絵巻一覧", icon: <FaScroll />, path: "/type/emaki" },
    { label: "絵巻ランキング", icon: <FaCrown />, path: "/ranking" },
    { label: "その他", icon: <FaEllipsisH />, path: "/more" },
  ];

  const handleNavigation = (path) => {
    router.push(path);
  };

  // 幅768px以上の場合は何もレンダリングしない
  if (isLargerThan768) return null;

  return (
    <Box
      position="fixed"
      bottom="0"
      width="100%"
      bg={bgColor}
      boxShadow="0 -2px 10px rgba(0, 0, 0, 0.1)"
      zIndex="1000"
      display={stickyClass === "header-fixed" ? "block" : "none"}
    >
      <Flex justify="space-around" align="center" py={2}>
        {navItems.map((item) => (
          <Flex
            key={item.label}
            direction="column"
            align="center"
            justify="center"
            onClick={() => handleNavigation(item.path)}
            cursor="pointer"
          >
            <Box
              color={router.pathname === item.path ? activeColor : iconColor}
              fontSize="20px"
            >
              {item.icon}
            </Box>
            <Text
              fontSize="10px"
              fontFamily={"Zen Maru Gothic, sans-serif"}
              color={router.pathname === item.path ? activeColor : iconColor}
              mt="1"
            >
              {item.label}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};

export default BottomNavigation;
