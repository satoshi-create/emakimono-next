import { AppContext } from "@/pages/_app";
import { ChaptersTitle, eraColor } from "@/utils/func";
import {
  Button,
  Circle,
  HStack,
  Text,
  useBreakpointValue,
  VStack,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useContext, useEffect, useRef } from "react";
import { FaBook, FaMapMarkerAlt, FaRegCircle } from "react-icons/fa";

const ChapterTimeline = ({
  index,
  titleen,
  title,
  chapter,
  era,
  ekotobaId,
  kotobagaki,
  iconType,
  isActive,
  scrollOnActive,
}) => {
  const { handleToId, openDescModal } = useContext(AppContext);
  const { locale } = useRouter();
  const rowRef = useRef(null);

  useEffect(() => {
    if (!isActive || !scrollOnActive || !rowRef.current) return;
    const el = rowRef.current;
    let scrollParent = el.parentElement;
    while (scrollParent) {
      const { overflowY } = getComputedStyle(scrollParent);
      if (overflowY === "auto" || overflowY === "scroll") break;
      scrollParent = scrollParent.parentElement;
    }
    if (!scrollParent) return;
    const parentRect = scrollParent.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offset =
      elRect.top - parentRect.top - (parentRect.height - elRect.height) / 2;
    scrollParent.scrollTo({
      top: scrollParent.scrollTop + offset,
      behavior: "auto",
    });
  }, [isActive, scrollOnActive]);

  let icon;
  switch (iconType) {
    case "location":
      icon = <FaMapMarkerAlt />;
      break;
    case "book":
      icon = <FaBook />;
      break;
    default:
      icon = <FaRegCircle />;
  }

  const handleModalButtonClick = (ekotobaId, index) => {
    openDescModal({
      ekotobaId,
      index,
    });
    handleToId(index);
  };

  return (
    <VStack align="start" spacing={6} w="100%">
      {/* タイムラインのノード */}
      <HStack
        ref={rowRef}
        align="center"
        spacing={2}
        bg={isActive ? "gray.100" : "transparent"}
        _hover={{ bg: "gray.200" }}
        w="full"
        p={2}
        cursor={"pointer"}
        borderRadius={10}
        onClick={() => handleToId(index)}
      >
        <Circle
          size={useBreakpointValue({ base: "24px", md: "30px" })} // レスポンシブでCircleのサイズを変更
          bg={eraColor(era)}
          color="white"
          fontFamily="var(--text-font)"
          display="flex" // flexboxで配置
          alignItems="center" // 垂直方向に中央配置
          justifyContent="center" // 水平方向に中央配置
          // zIndex={2}
        >
          {/* {index + 1} */}
          <FaRegCircle
            size={useBreakpointValue({ base: "14px", md: "18px" })}
            // zIndex={2}
          />
          {/* ここでアイコンを表示 */}
        </Circle>
        <Text
          fontSize={useBreakpointValue({ base: "sm", md: "lg" })} // テキストのサイズを変更
          fontWeight="bold"
          fontFamily="var(--text-font)"
          color={eraColor(era)}
          textTransform={"capitalize"}
        >
          {locale == "en"
            ? ChaptersTitle(titleen, title, chapter, "titleen")
            : ChaptersTitle(titleen, title, chapter, "title")}
        </Text>
      </HStack>
      {/* セクション間のボタン */}
      {kotobagaki && (
        <Button
          display="flex"
          alignItems="center"
          justifyContent="center"
          // w="fu"
          border={`2px solid ${eraColor(era)}`}
          size="sm"
          bg="white"
          color={eraColor(era)}
          onClick={() => handleModalButtonClick(ekotobaId, index)}
          whiteSpace={"pre-wrap"}
          padding={"1rem"}
          _hover={{ bg: eraColor(era), color: "white" }}
        >
          {locale == "en"
            ? "Translation and Notes / Annotated Translation"
            : "解説・現代文"}
        </Button>
      )}
    </VStack>
  );
};

export default ChapterTimeline;
