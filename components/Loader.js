import React from 'react'
import {
  Box,
  Text,
  Link as ChakraLink,
  Spinner,
} from "@chakra-ui/react";
const Loader = () => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="fixed"
      top="0"
      left="0"
      width="100vw"
      height="100vh"
      // backgroundColor="rgba(0, 0, 0, 0.7)" // 背景を半透明にする
      // zIndex="1000" // 他のコンテンツより上に表示
    >
      <Box textAlign="center" color="white">
        <Spinner size="xl" thickness="4px" speed="0.65s" color="teal.400" />
        <Text mt={4} fontSize="lg">
          Loading...
        </Text>
      </Box>
    </Box>
  );
}

export default Loader
