import { ArrowForwardIcon, ViewIcon } from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Button,
  Link as ChakraLink,
  Flex,
  HStack,
  Image,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext } from "react";
import { AppContext } from "../pages/_app";

export default function RankingCard({ isCompact = false }) {
  const { locale } = useRouter();
  const { rankingData } = useContext(AppContext);

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
        rowGap={isCompact ? "2" : "10"}
      >
        {data(isCompact).map((item, i) => {
          const {
            title,
            titleen,
            thumb,
            type,
            typeen,
            era,
            eraen,
            edition,
            pageView,
          } = item;
          return (
            <Link href={`/${titleen}`} key={i}>
              <a>
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
                      direction={
                        isCompact ? "row" : { base: "column", sm: "row" }
                      }
                    >
                      <Box
                        position="relative"
                        width={
                          isCompact ? "150px" : { base: "full", sm: "60%" }
                        }
                        // height={isCompact ? "100px" : "300px"}
                      >
                        <Badge
                          position="absolute"
                          top={2}
                          left={2}
                          zIndex={1}
                          colorScheme={
                            i + 1 === 1
                              ? "red"
                              : i + 1 === 2
                              ? "orange"
                              : "yellow"
                          }
                          fontSize={isCompact ? "sm" : "lg"}
                          fontWeight="bold"
                          paddingX={isCompact ? 1 : 3}
                          paddingY={isCompact ? 0.5 : 1}
                        >
                          {i + 1}位
                        </Badge>
                        <Image
                          src={thumb}
                          alt={thumb}
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
                              <Badge
                                variant="outline"
                                textTransform="none"
                                borderRadius={10}
                              >
                                {locale == "en" ? typeen : type}
                              </Badge>
                              <Badge
                                variant="outline"
                                textTransform="none"
                                borderRadius={10}
                              >
                                {locale == "en"
                                  ? `${eraen} period`
                                  : `${era}時代`}
                              </Badge>
                            </HStack>
                            <Text
                              fontSize={isCompact ? "md" : "xl"}
                              fontWeight="bold"
                            >
                              {locale == "en" ? titleen : title}
                              {locale == "ja" && edition}
                            </Text>
                          </VStack>
                        </Flex>
                        <HStack
                          marginTop={isCompact ? 2 : 4}
                          color="gray.500"
                          fontSize={isCompact ? "sm" : "md"}
                        >
                          <ViewIcon />
                          <Text>{pageView.toLocaleString()}回鑑賞</Text>
                        </HStack>
                      </Box>
                    </Flex>
                  </Box>
                </ChakraLink>
              </a>
            </Link>
          );
        })}
      </Stack>
      {isCompact && (
        <Box marginTop={6} textAlign="right">
          <Link href="/ranking">
            <a>
              <Button
                as={ChakraLink}
                rightIcon={<ArrowForwardIcon />}
                borderRadius="md"
                borderWidth="1px"
                fontSize="small"
              >
                {locale == "en"
                  ? "View All Emaki Rankings"
                  : "全ての絵巻ランキングを見る"}
              </Button>
            </a>
          </Link>
        </Box>
      )}
    </Box>
  );
}
