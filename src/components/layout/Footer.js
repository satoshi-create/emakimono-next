import SocialLinks from "@/components/social/SocialLinks";
import links, { legalLinks, NOTION_CONTACT_URL } from "@/libs/constants/links";
import styles from "@/styles/Footer.module.css";
import {
  Box,
  Link as ChakraLink,
  Divider,
  Flex,
  Stack,
  Text,
} from "@chakra-ui/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

const Footer = () => {
  const year = new Date().getFullYear();
  const { locale } = useRouter();

  const navLinks = (
    <Stack direction="row" spacing={6} align="center" flexWrap="wrap">
      {links.map((link, i) => {
        const { path, name, nameen } = link;
        return (
          <Link key={i} href={path} passHref>
            <ChakraLink
              fontWeight="medium"
              _hover={{
                color: "rgb(255, 140, 119)",
                transform: "scale(1.05)",
              }}
              transition="all 0.2s"
            >
              {locale === "ja" ? name : nameen}
            </ChakraLink>
          </Link>
        );
      })}

      <ChakraLink
        href={NOTION_CONTACT_URL}
        isExternal
        fontWeight="medium"
        _hover={{
          color: "rgb(255, 140, 119)",
          transform: "scale(1.05)",
        }}
        transition="all 0.2s"
      >
        {locale === "ja" ? "お問い合わせ" : "Contact"}
      </ChakraLink>
    </Stack>
  );

  return (
    <Box
      as="footer"
      bgGradient="linear(to-r, #121212, #000)"
      color="white"
      px={6}
      pt={{ base: 10, md: 6 }}
      pb={{ base: 14, md: 6 }}
      borderTop="1px solid #444"
      mt={12}
    >
      <Flex
        direction="column"
        justify="space-between"
        minH="120px"
        maxW="1200px"
        mx="auto"
        gap={{ base: 6, md: 4 }}
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align="center"
          wrap="wrap"
          textAlign="center"
          w="100%"
        >
          <Box
            flex="1"
            mb={{ base: 6, md: 0 }}
            display="flex"
            justifyContent={{ base: "center", md: "flex-start" }}
            alignItems="center"
          >
            <Link href="/" passHref>
              <a
                className={styles.title}
                style={{ display: "flex", alignItems: "center" }}
              >
                <Image
                  src="/favicon-32x32.png"
                  alt="favicon"
                  width={25}
                  height={25}
                />
                <Text ml={2}>
                  {locale === "en"
                    ? "EMAKIMONO!!"
                    : "横スクロールで楽しむ絵巻物"}
                </Text>
              </a>
            </Link>
          </Box>

          <Box
            flex="1"
            mb={{ base: 6, md: 0 }}
            display="flex"
            justifyContent="center"
          >
            {navLinks}
          </Box>

          <Box
            flex="1"
            display={{ base: "none", md: "flex" }}
            justifyContent="flex-end"
          >
            <SocialLinks footerStyle iconStyle />
          </Box>
        </Flex>

        <Box w="100%">
          <Stack
            direction="row"
            spacing={5}
            justify="center"
            flexWrap="wrap"
            mb={4}
          >
            {legalLinks.map(({ path, name, nameen }) => (
              <Link key={path} href={path} passHref>
                <ChakraLink
                  fontSize="sm"
                  color="whiteAlpha.800"
                  _hover={{
                    color: "rgb(255, 140, 119)",
                  }}
                  transition="all 0.2s"
                >
                  {locale === "ja" ? name : nameen}
                </ChakraLink>
              </Link>
            ))}
          </Stack>
          <Divider
            borderColor="whiteAlpha.400"
            borderWidth="1px"
            mb={4}
            maxW="800px"
            mx="auto"
          />
          <Box
            display={{ base: "flex", md: "none" }}
            justifyContent="center"
            mb={4}
          >
            <SocialLinks footerStyle iconStyle />
          </Box>
          <Text className={styles.copyright} textAlign="center">
            {`© ${year} emakimono.com. All rights reserved.`}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

export default Footer;
