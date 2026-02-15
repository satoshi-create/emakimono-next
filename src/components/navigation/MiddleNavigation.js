import LikeButton from "@/components/emaki/metadata/LikeButton";
import { AppContext } from "@/pages/_app";
import {
  Box,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Text,
  useColorModeValue,
  useMediaQuery,
} from "@chakra-ui/react";
import { faEye, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useMemo } from "react";
import { FaBars } from "react-icons/fa";
import { useTranslation } from "next-i18next";

const MiddleNavigation = ({ title, titleen, edition, author }) => {
  const { locale } = useRouter();
  const { t } = useTranslation("common");
  const bgColor = useColorModeValue("white", "gray.800");
  const iconColor = useColorModeValue("gray.600", "gray.300");

  const { stickyClass, setStickyClass, openModal, setisModalOpen, rankingData } =
    useContext(AppContext);

  // ランキング順位・閲覧数を検索
  const rankInfo = useMemo(() => {
    const index = rankingData.findIndex((item) => item.titleen === titleen);
    if (index < 0) return null;
    return { rank: index + 1, pageView: rankingData[index].pageView };
  }, [rankingData, titleen]);

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
        {/* タイトル + ランキング: 左寄せ */}
        <GridItem overflow="hidden">
          <Text fontSize="lg" fontWeight="bold" color={iconColor} noOfLines={1}>
            {locale == "en" ? titleen : title} {locale == "ja" && edition}
          </Text>
          {rankInfo && (
            <Link href="/ranking">
              <a>
                <HStack spacing={1} mt={0.5}>
                  <FontAwesomeIcon
                    icon={faTrophy}
                    style={{ fontSize: "0.6rem", color: "#daa520" }}
                  />
                  <Text fontSize="0.7rem" fontWeight={500} color="#b8860b">
                    {locale === "en"
                      ? `#${rankInfo.rank}`
                      : `${rankInfo.rank}位`}
                  </Text>
                  <Text fontSize="0.7rem" fontWeight={200} color="gray.300">
                    |
                  </Text>
                  <FontAwesomeIcon
                    icon={faEye}
                    style={{ fontSize: "0.55rem", color: "#b8b8b8" }}
                  />
                  <Text fontSize="0.7rem" fontWeight={100} color="gray.400">
                    {Number(rankInfo.pageView).toLocaleString()}
                  </Text>
                </HStack>
              </a>
            </Link>
          )}
        </GridItem>

        {/* ボタン: 右寄せ */}
        <GridItem display="flex" gap={2}>
          <LikeButton
            title={title}
            titleen={titleen}
            edition={edition}
            author={author}
            ort={"prt"}
          />
          <IconButton
            aria-label={t("navigation.menu")}
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
