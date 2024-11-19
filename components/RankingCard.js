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
} from "@chakra-ui/react";
import {
  ExternalLinkIcon,
  ViewIcon,
  TrendingUpIcon,
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
    <Box maxWidth={isCompact ? "lg" : "4xl"} margin="auto" padding={4}>
      <VStack spacing={4} align="stretch">
        {data(isCompact).map((item, i) => (
          <Link href={`/${item.titleen}`} key={i} passHref>
            <ChakraLink
              textDecoration="none"
              _hover={{ textDecoration: "none" }}
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
                    width={isCompact ? "100px" : { base: "full", sm: "200px" }}
                    height={isCompact ? "100px" : "200px"}
                  >
                    <Badge
                      position="absolute"
                      top={2}
                      left={2}
                      zIndex={1}
                      colorScheme={
                        i + 1 === 1 ? "red" : i + 1 === 2 ? "orange" : "yellow"
                      }
                      fontSize="lg"
                      fontWeight="bold"
                      paddingX={3}
                      paddingY={1}
                    >
                      {i + 1}位
                    </Badge>
                    <Image
                      src={item.thumb}
                      alt={item.thumb}
                      objectFit="cover"
                      width="100%"
                      height="100%"
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
                      <Text>{item.pageView.toLocaleString()}回視聴</Text>
                    </HStack>
                    {i + 1 === 1 && (
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
                    )}
                  </Box>
                </Flex>
              </Box>
            </ChakraLink>
          </Link>
        ))}
      </VStack>
      {isCompact && (
        <Box marginTop={6}>
          <Link href="/ranking">
            <a target="_blank">
              <Button
                as={ChakraLink}
                rightIcon={<ArrowForwardIcon />}
                borderRadius="md"
                borderWidth="1px"
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
