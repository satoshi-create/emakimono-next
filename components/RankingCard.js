import React, { useContext } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Badge,
  Flex,
  Link as ChakraLink,
  Button,
  Grid,
  GridItem,
  Stack
} from "@chakra-ui/react";
import {
  ExternalLinkIcon,
  ViewIcon,
  ArrowForwardIcon,
} from "@chakra-ui/icons";
import Link from "next/link";
import { AppContext } from "../pages/_app";

export default function RankingCard({ isCompact = false }) {
  const { loading, rankingData } = useContext(AppContext);

  const data = () => {
    if (isCompact) {
      return rankingData.slice(0, 6);
    } else {
      return rankingData;
    }
  };

  return (
    <Box maxWidth="4xl" margin="auto">
      <Stack
        direction={{ base: "column", md: "column" }}
        align="stretch"
        // rowGap="10"
        rowGap={isCompact ? "2" : "10"}
      >
        {data(isCompact).map((item, i) => (
          <Link href={`/${item.titleen}`} key={i} passHref>
            <ChakraLink
              textDecoration="none"
              _hover={{ textDecoration: "none" }}
              flex="1"
              isExternal
            >
              <Box
                borderWidth={1}
                borderRadius="lg"
                overflow="hidden"
                transition="all 0.3s"
                _hover={{ boxShadow: "lg" }}
              >
                <Flex
                  direction={isCompact ? "row" : { base: "column", sm: "row" }}
                >
                  <Box
                    position="relative"
                    width={isCompact ? "150px" : { base: "full", sm: "60%" }}
                    // height={isCompact ? "100px" : "300px"}
                  >
                    <Badge
                      position="absolute"
                      top={2}
                      left={2}
                      zIndex={1}
                      colorScheme={
                        i + 1 === 1 ? "red" : i + 1 === 2 ? "orange" : "yellow"
                      }
                      fontSize={isCompact ? "sm" : "lg"}
                      fontWeight="bold"
                      paddingX={isCompact ? 1 : 3}
                      paddingY={isCompact ? 0.5 : 1}
                    >
                      {i + 1}位
                    </Badge>
                    <Image
                      src={item.thumb}
                      alt={item.thumb}
                      objectFit="cover"
                      width="100%"
                      height="auto"
                    />
                  </Box>
                  <Box p={isCompact ? 2 : 4} flex={1}>
                    <Flex
                      justifyContent="space-between"
                      alignItems="flex-start"
                    >
                      <VStack align="start" spacing={1}>
                        <HStack>
                          <Badge variant="outline">{item.type}</Badge>
                          <Badge variant="outline">{item.era}時代</Badge>
                        </HStack>
                        <Text
                          fontSize={isCompact ? "md" : "xl"}
                          fontWeight="bold"
                        >
                          {item.title} {item.edition ? item.edition : ""}
                        </Text>
                      </VStack>
                    </Flex>
                    <HStack
                      marginTop={isCompact ? 2 : 4}
                      color="gray.500"
                      fontSize={isCompact ? "sm" : "md"}
                    >
                      <ViewIcon />
                      <Text>{item.pageView.toLocaleString()}回鑑賞</Text>
                    </HStack>
                    {/* {i + 1 === 1 && (
                      <HStack
                        marginTop={isCompact ? 2 : 4}
                        color="orange.500"
                        fontSize={isCompact ? "sm" : "md"}
                      >
                        <ExternalLinkIcon
                          display={isCompact ? "none" : "block"}
                        />
                        <Text
                          fontWeight="medium"
                          display={isCompact ? "none" : "block"}
                        >
                          今月の人気コンテンツ
                        </Text>
                      </HStack>
                    )} */}
                  </Box>
                </Flex>
              </Box>
            </ChakraLink>
          </Link>
        ))}
      </Stack>
      {isCompact && (
          <Box marginTop={6} textAlign="right">
            <Link href="/ranking">
              <a target="_blank">
                <Button
                  as={ChakraLink}
                  rightIcon={<ArrowForwardIcon />}
                  borderRadius="md"
                  borderWidth="1px"
                  fontSize="small"
                >
                  全ての絵巻ランキングを見る
                </Button>
              </a>
            </Link>
          </Box>
      )}
    </Box>
  );
}

//  {
//    item.kotobagaki && (
//      <Badge
//        colorScheme="purple"
//        display="flex"
//        alignItems="center"
//      >
//        {/* <TrendingUpIcon marginRight={1} /> */}
//        急上昇
//      </Badge>
//    );
//  }
