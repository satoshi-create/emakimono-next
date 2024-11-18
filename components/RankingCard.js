import React, { useEffect, useState,useContext } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Badge,
  Flex,
  Link as ChakraLink,
Spinner
} from "@chakra-ui/react";
import { ExternalLinkIcon, ViewIcon } from "@chakra-ui/icons";
import Link from "next/link";
import ExtractingListData from "../libs/ExtractingListData";
import { AppContext } from "../pages/_app";
import Loader from "./Loader"


export default function RankingCard() {

    const { loading,result} =
    useContext(AppContext);

  return (
    <>
      {loading ? (
      <Loader/>
      ) : (
        <Box maxWidth="4xl" margin="auto" padding={4}>
          <VStack spacing={4} align="stretch">
            {result.map((item, i) => (
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
                    <Flex direction={{ base: "column", sm: "row" }}>
                      <Box
                        position="relative"
                        width={{ base: "full", sm: "400px" }}
                        height="200px"
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
                      <Box p={4} flex={1}>
                        <Flex
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <VStack align="start" spacing={1}>
                            <HStack>
                              <Badge variant="outline">{item.type}</Badge>
                              <Badge variant="outline">{item.era}時代</Badge>
                            </HStack>
                            <Text fontSize="xl" fontWeight="bold">
                              {item.title} {item.edition ? item.edition : ""}
                            </Text>
                          </VStack>
                        </Flex>
                        <HStack marginTop={4} color="gray.500">
                          <ViewIcon />
                          <Text>{item.pageView.toLocaleString()}回視聴</Text>
                        </HStack>
                        {i + 1 === 1 && (
                          <HStack marginTop={4} color="orange.500">
                            <ExternalLinkIcon />
                            <Text fontWeight="medium">
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
        </Box>
      )}
    </>
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
