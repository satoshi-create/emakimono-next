import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Icon,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { MdLanguage, MdCheck } from "react-icons/md";

const LanguageSwitcher = () => {
  const router = useRouter();
  const { locales, locale: activeLocale } = router;

  const [isJapan, setIsJapan] = useState(false);

  useEffect(() => {
    const userLanguage = navigator.language || navigator.userLanguage;
    setIsJapan(userLanguage.startsWith("ja"));
  }, []);

  const handleLanguageChange = (newLocale) => {
    const { pathname, query, asPath } = router;
    router.push({ pathname, query }, asPath, { locale: newLocale });
  };

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        leftIcon={<Icon as={MdLanguage} />}
        variant="outline"
        colorScheme="blue"
        size="md"
      >
        {activeLocale === "en" ? "English" : "日本語"}
      </MenuButton>
      <MenuList>
        {locales?.map((locale) => (
          <MenuItem
            key={locale}
            onClick={() => handleLanguageChange(locale)}
            fontWeight={locale === activeLocale ? "bold" : "normal"}
            bg={locale === activeLocale ? "blue.100" : "transparent"}
            _hover={{ bg: "blue.50" }}
          >
            {locale === "en" ? "English" : "日本語"}
            {locale === activeLocale && (
              <Icon as={MdCheck} ml={2} color="green.500" />
            )}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default LanguageSwitcher;
