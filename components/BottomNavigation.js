import {
  Box,
  Flex,
  Text,
  useColorModeValue,
  useMediaQuery,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, { useContext, useState } from "react";
import { FaCrown, FaHome, FaScroll, FaSearch } from "react-icons/fa";
import { AppContext } from "../pages/_app";

const BottomNavigation = () => {
  const { locale } = useRouter();
  const [activeMenu, setActiveMenu] = useState(null);
  const { stickyClass, openSearchModalOpen, closeSearchModal } =
    useContext(AppContext);

  const bgColor = useColorModeValue("white", "gray.800");
  const iconColor = useColorModeValue("gray.600", "gray.300");
  const activeColor = useColorModeValue("blue.500", "blue.300");
  const router = useRouter();

  // 画面幅が768px以上かを判定
  const [isLargerThan768] = useMediaQuery("(min-width: 768px)");

  // const navItems = [
  //   { label: "ホーム", icon: <FaHome />, path: "/" },
  //   { label: "絵巻物一覧", icon: <FaScroll />, path: "/type/emaki" },
  //   { label: "絵巻物ランキング", icon: <FaCrown />, path: "/ranking" },
  // ];

  const navItems = [
    {
      label: "ホーム",
      labelen: "Home",
      icon: <FaHome />,
      path: "/",
    },
    {
      label: "絵巻物一覧",
      labelen: "Emaki List",
      icon: <FaScroll />,
      path: "/type/emaki",
    },
    {
      label: "絵巻物ランキング",
      labelen: "Emaki Ranking",
      icon: <FaCrown />,
      path: "/ranking",
    },
  ];

  const handleNavigation = (menuLabel, path) => {
    setActiveMenu(menuLabel);
    router.push(path);
    closeSearchModal();
  };

  const handleOpenSearchModalOpen = () => {
    setActiveMenu("検索");
    openSearchModalOpen();
  };

  // 幅768px以上の場合は何もレンダリングしない
  if (isLargerThan768) return null;

  const styles = {
    container: {
      position: "fixed",
      bottom: "0",
      width: "100%",
      backgroundColor: bgColor,
      boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.1)",
      zIndex: "1000",
      transform:
        stickyClass === "header-fixed" ? "translateY(0)" : "translateY(100%)",
      transition: "transform 0.5s ease-in-out",
    },
  };

  return (
    <Box style={styles.container}>
      <Flex justify="space-evenly" align="center" py={2}>
        {navItems.map((item) => {
          const { label, labelen, icon, path } = item;
          console.log(labelen);

          return (
            <Flex
              key={label}
              direction="column"
              align="center"
              justify="center"
              onClick={() => handleNavigation(label, path)}
              cursor="pointer"
            >
              <Box
                color={activeMenu === label ? activeColor : iconColor}
                fontSize="20px"
              >
                {icon}
              </Box>
              <Text
                fontSize="10px"
                fontFamily={"Zen Maru Gothic, sans-serif"}
                color={activeMenu === label ? activeColor : iconColor}
                // mt="1"
              >
                {locale == "en" ? labelen : label}
              </Text>
            </Flex>
          );
        })}
        <Flex
          direction="column"
          align="center"
          justify="center"
          // onClick={() => handleNavigation(item.path)}
          onClick={() => handleOpenSearchModalOpen()}
          cursor="pointer"
        >
          <Box
            color={activeMenu === "検索" ? activeColor : iconColor}
            fontSize="20px"
          >
            <FaSearch />
          </Box>
          <Text
            fontSize="10px"
            fontFamily={"Zen Maru Gothic, sans-serif"}
            color={activeMenu === "検索" ? activeColor : iconColor}
            // mt="1"
          >
            {locale == "en" ? "Search" : "検索"}
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
};

export default BottomNavigation;
