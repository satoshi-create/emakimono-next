import SocialLinks from "@/components/social/SocialLinks";
import {
  getContactUrl,
  legalLinks,
  primaryNavLinks,
} from "@/libs/constants/links";
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
import { useTranslation } from "next-i18next";

const Footer = () => {
  const year = new Date().getFullYear();
  const { locale } = useRouter();
  const { t } = useTranslation("common");

  const navLinks = (
    <Stack
      direction="row"
      spacing={6}
      align="center"
      justify="center"
      flexWrap="wrap"
      w="100%"
    >
      {primaryNavLinks.map((link, i) => {
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
        href={getContactUrl(locale)}
        isExternal
        fontWeight="medium"
        _hover={{
          color: "rgb(255, 140, 119)",
          transform: "scale(1.05)",
        }}
        transition="all 0.2s"
      >
        {t("nav.contact")}
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
      mt="auto"
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
          direction="column"
          align="center"
          w="100%"
          gap={{ base: 6, md: 4 }}
        >
          <Box display="flex" justifyContent="center" alignItems="center" w="100%">
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
                <Text ml={2}>{t("header.siteTitle")}</Text>
              </a>
            </Link>
          </Box>

          <Box display="flex" justifyContent="center" alignItems="center" w="100%">
            {navLinks}
          </Box>

          <Box display="flex" justifyContent="center" w="100%">
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
          <Text className={styles.copyright} textAlign="center">
            {`© ${year} emakimono.com. All rights reserved.`}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

export default Footer;
