import SocialLinks from "@/components/social/SocialLinks";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext } from "react";
import { AppContext } from "@/pages/_app";
import {
  Flex,
  Box,
  Text,
  Stack,
  Link as ChakraLink,
  Divider,
} from "@chakra-ui/react";
import styles from "@/styles/Footer.module.css";

const Footer = () => {
  const year = new Date().getFullYear();
  const { locale } = useRouter();
  const { openContactModal } = useContext(AppContext);

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
      >
        {/* Top: Logo - Nav - Social */}
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align="center"
          wrap="wrap"
          textAlign="center"
        >
          {/* Logo */}
          <Box
            flex="1"
            mb={{ base: 6, md: 0 }}
            display="flex"
            justifyContent={{ base: "center", md: "flex-start" }}
            alignItems="center"
          >
            <Link href="/" passHref>
              <a className={styles.title} style={{ display: "flex", alignItems: "center" }}>
                <Image src="/favicon-32x32.png" alt="favicon" width={25} height={25} />
                <Text ml={2}>
                  {locale === "en" ? "EMAKIMONO!!" : "横スクロールで楽しむ絵巻物"}
                </Text>
              </a>
            </Link>
          </Box>

          {/* Navigation */}
          <Box
            flex="1"
            mb={{ base: 6, md: 0 }}
            display="flex"
            justifyContent="center"
          >
            <Stack direction="row" spacing={6} align="center">
              {[
                { en: "Home", ja: "ホーム", path: "/" },
                { en: "About", ja: "About", path: "/about" },
                { en: "Emaki Gallery", ja: "絵巻一覧", path: "/type/emaki" },
              ].map((link) => (
                <Link key={link.path} href={link.path} passHref>
                  <ChakraLink
                    fontWeight="medium"
                    _hover={{
                      color: "rgb(255, 140, 119)",
                      transform: "scale(1.05)",
                    }}
                    transition="all 0.2s"
                  >
                    {locale === "ja" ? link.ja : link.en}
                  </ChakraLink>
                </Link>
              ))}

              {/* Contact as a modal button */}
              <ChakraLink
                as="button"
                onClick={() => openContactModal(true)}
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
          </Box>

          {/* Social Links */}
          <Box
            flex="1"
            display="flex"
            justifyContent={{ base: "center", md: "flex-end" }}
          >
            <SocialLinks footerStyle iconStyle />
          </Box>
        </Flex>

        {/* Bottom: Divider & Copyright */}
        <Box>
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
