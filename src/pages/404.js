import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import WindEffect from "@/components/ui/WindEffect";

import Head from "@/components/meta/Meta";
import { Box, Flex, Heading, Image, Button } from "@chakra-ui/react";
import ScrollSvg from "@/components/ui/ScrollSvg";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import NextLink from "next/link";
import "lazysizes";
import { useRouter } from "next/router";

const Custom404 = () => {
  const { locale } = useRouter();

  return (
    <>
      <Head />
      <Header fixed={true} />
      <Breadcrumbs
        name={locale === "en" ? "PAGE NOT FOUND" : "ページが見つかりません"}
      />

      <Box
        position="relative"
        w="100%"
        py="10"
        px="4"
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
        bg="white"
        overflow="hidden"
      >
        <Image
          src="/bg-image.jpg"
          alt="Background"
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100%"
          objectFit="cover"
          zIndex={0}
          opacity={0.4}
        />

        <Flex
          position="absolute"
          top="4rem"
          left="69rem"
          zIndex={3}
          gap="4"
          align="flex-start"
        >
          <Image
            src="/flute-person.png"
            alt="Decorative Image"
            position="absolute"
            top="15rem"
            left="5rem"
            zIndex={3}
            boxSize="400px"
            objectFit="contain"
          />
          <Box position="absolute" top="24rem" left="4rem" zIndex={3}>
            <WindEffect />
            <ScrollSvg />
          </Box>
        </Flex>

        <Heading
          fontSize="38rem"
          fontWeight="black"
          color="black.600"
          zIndex={1}
          textAlign="center"
          lineHeight="1.5"
          mt="-18rem"
        >
          404
        </Heading>

        <Box
          textAlign="center"
          maxW="md"
          mx="auto"
          mb="8"
          px="4"
          color="gray.700"
          fontWeight="medium"
          zIndex={4}
          top="30rem"
          left="45rem"
          position="absolute"
        >
          <Heading
            as="h2"
            size="xl"
            mb="4"
            fontWeight="bold"
            color="red.600"
            textDecoration="underline"
          >
            {locale === "en" ? "Page Not Found" : "ページが見つかりません"}
          </Heading>
          <Box fontSize="lg" mb="6" fontStyle="italic">
            {locale === "en"
              ? "The scroll you seek has been carried away by the wind. The flutist's melody may guide you back to safety."
              : "お探しのスクロールは風に運ばれてしまいました。笛吹きの旋律があなたを安全な場所へと導くでしょう。"}
          </Box>
        </Box>

        <NextLink href="/" passHref>
          <Button
            as="a"
            size="md"
            mt="9"
            px="6"
            py="4"
            fontSize="lg"
            fontWeight="bold"
            colorScheme="red"
            color="black"
            zIndex={1}
            top="-4rem"
          >
            {locale === "en" ? "Go back home" : "ホームに戻る"}
          </Button>
        </NextLink>
      </Box>

      <Footer />
    </>
  );
};

export default Custom404;
