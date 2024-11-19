import React from 'react'
import {
  Box,
  Text,
  Link as ChakraLink,
  Spinner,
} from "@chakra-ui/react";
const Loader = () => {
  return (
      <Box textAlign="center" color="white">
        <Spinner size="xl" thickness="4px" speed="0.65s" color="teal.400" />
        <Text mt={4} fontSize="lg">
          Loading...
        </Text>
      </Box>
  );
}

export default Loader
