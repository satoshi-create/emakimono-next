import {
  Box,
  Button,
  Circle,
  HStack,
  Text,
  useBreakpointValue,
  VStack,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, { useContext } from "react";
import { FaBook, FaMapMarkerAlt, FaRegCircle } from "react-icons/fa";
import { ChaptersTitle, eraColor } from "../libs/func";
import { AppContext } from "../pages/_app";

const ChapterTimeline = ({
  index,
  titleen,
  title,
  chapter,
  era,
  ekotobaId,
  kotobagaki,
  iconType,
}) => {
  const { handleToId, openDescModal } = useContext(AppContext);
  const { locale } = useRouter();

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
        align="center"
        spacing={2}
        _hover={{ bg: "gray.100" }}
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
          zIndex={2}
        >
          {/* {index + 1} */}
          <FaRegCircle
            size={useBreakpointValue({ base: "14px", md: "18px" })}
            zIndex={2}
          />
          {/* ここでアイコンを表示 */}
        </Circle>
        <Text
          fontSize={useBreakpointValue({ base: "sm", md: "lg" })} // テキストのサイズを変更
          fontWeight="bold"
          fontFamily="var(--text-font)"
          color={eraColor(era)}
        >
          {locale == "en"
            ? ChaptersTitle(titleen, title, chapter, "titleen")
            : ChaptersTitle(titleen, title, chapter, "title")}
        </Text>
      </HStack>
      {/* セクション間のボタン */}
      {kotobagaki && (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="flex-start"
          w="full"
        >
          <Button
            size="sm"
            bg="white"
            border={`2px solid ${eraColor(era)}`}
            color={eraColor(era)}
            fontFamily="var(--text-font)"
            _hover={{ bg: eraColor(era), color: "white" }}
            onClick={() => handleModalButtonClick(ekotobaId, index)}
          >
            解説・現代文
          </Button>
        </Box>
      )}
    </VStack>
  );
};

export default ChapterTimeline;
