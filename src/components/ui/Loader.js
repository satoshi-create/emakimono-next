import { Box, Spinner, Text } from "@chakra-ui/react";
import React from "react";
const Loader = () => {
  return (
    <Box textAlign="center" color="white">
      <Spinner size="xl" thickness="4px" speed="0.65s" color="teal.400" />
      <Text mt={4} fontSize="lg">
        Loading...
      </Text>
    </Box>
  );
};

export default Loader;
