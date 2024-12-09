import React, { useContext, useState } from "react";
import styles from "../styles/EmakiLandscapContent.module.css";
import { eraColor, ChaptersTitle } from "../libs/func";
import { AppContext } from "../pages/_app";
import {
  Box,
  VStack,
  HStack,
  Circle,
  Text,
  Button,
  Center,
} from "@chakra-ui/react";
import { FaRegCircle, FaMapMarkerAlt, FaBook, FaPlay } from "react-icons/fa";

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
          size="30px"
          bg={eraColor(era)}
          color="white"
          fontFamily="var(--text-font)"
          display="flex" // flexboxで配置
          alignItems="center" // 垂直方向に中央配置
          justifyContent="center" // 水平方向に中央配置
        >
          {/* {index + 1} */}
          <FaRegCircle />
          {/* ここでアイコンを表示 */}
        </Circle>
        <Text
          fontSize="lg"
          fontWeight="bold"
          fontFamily="var(--text-font)"
          color={eraColor(era)}
        >
          {ChaptersTitle(titleen, title, chapter)}
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
            onClick={() =>
              openDescModal({
                ekotobaId,
                index,
              })
            }
          >
            解説・現代文
          </Button>
        </Box>
      )}
    </VStack>
  );
};

export default ChapterTimeline;
