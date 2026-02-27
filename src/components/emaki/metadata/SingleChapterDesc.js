import { AppContext } from "@/pages/_app";
import { ChaptersDesc, ChaptersTitle, ChaptersGendaibun, eraColor } from "@/utils/func";
import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { useTranslation } from "next-i18next";

const SingleChapterDesc = ({ item, index, emakis, data }) => {
  const { locale } = useRouter();
  const { t } = useTranslation("common");
  const { handleToId, handleFullScreen, orientation } = useContext(AppContext);
  const [showInfo, setShowInfo] = useState(false);
  const { chapter, gendaibun, text, content, desc, title: itemTitle, title_en: itemTitleEn } = item;
  const { genjieslug, title, titleen, era } = data;

  const sectionTitleDisplay =
    locale === "en"
      ? (itemTitleEn ?? itemTitle ?? "")
      : (itemTitle ?? itemTitleEn ?? "");
  const bodyText = gendaibun ?? text ?? content ?? "";
  const descText = desc ?? item.description ?? "";

  return (
    <AccordionItem
      sx={{
        ":not(:first-of-type):not(:last-of-type)": {
          borderTop: "1px solid #e2e8f0", // ボーダーの色を指定
        },
      }}
    >
      {/* ボーダーライン削除 */}
      <h4>
        <AccordionButton
          onClick={
            orientation == "portrait" ? () => handleToId(index) : undefined
          }
        >
          {/* アイコンをタイトルの前に配置 */}
          <Box mr={0} as="span" display="flex" alignItems="center">
            <AccordionIcon />
          </Box>
          <AccordionItem mr={2} />
          <Box
            flex="1"
            textAlign="left"
            color={eraColor(era)}
            fontSize={{ base: ".9rem", sm: "0.9rem", md: "1.1rem" }}
            display="block"
            paddingInlineStart="0"
          >
            {sectionTitleDisplay ||
              (locale == "en"
                ? ChaptersTitle(titleen, title, chapter, "titleen")
                : ChaptersTitle(titleen, title, chapter, "title"))}
          </Box>
          {/* リンクアイコンの色を #ff8c77 に変更し、右寄せ、丸みを帯びたデザイン */}
          <Button
            as="a"
            href="#"
            color="#fbf8c77"
            borderRadius="full"
            size="sm"
            variant="link"
            ml={2}
            textAlign="right"
            display="inline-block"
            _hover={{ color: "#ff8c77" }}
          ></Button>
        </AccordionButton>
      </h4>
      <AccordionPanel pb={4}>
        {descText && (
          <Text fontSize={{ base: "0.9rem", sm: "0.85rem", md: "1.1rem" }}>
            {locale == "en"
              ? ChaptersDesc(titleen, title, chapter, "descen", descText)
              : ChaptersDesc(titleen, title, chapter, "desc", descText)}
          </Text>
        )}
        {bodyText && (
          <Text
            fontSize={{ base: "0.9rem", sm: "0.85rem", md: "1.1rem" }}
            mt={descText ? 2 : 0}
          >
            {ChaptersGendaibun(titleen, title, chapter, bodyText)}
          </Text>
        )}
        {orientation == "landscape" && (
          <Button
            mt={4}
            fontSize={{ base: "0.8rem", sm: "0.9rem", md: "1rem" }}
            fontWeight={"normal"}
            onClick={() => handleToId(index)}
            sx={{
              bg: "#ff8c77",
              color: "#fff",
              borderRadius: "full",
              padding: "0.5rem 1rem",
              display: "block",
              ml: "auto",
              _hover: {
                bg: "#ff6c5a",
              },
              _active: {
                bg: "#e65c4a",
              },
            }}
          >
            {locale == "en" ? (
              <>{t("viewer.viewImage")}: {sectionTitleDisplay || ChaptersTitle(titleen, title, chapter, "titleen")}</>
            ) : (
              <>{sectionTitleDisplay || ChaptersTitle(titleen, title, chapter, "title")}{t("viewer.viewImage")}</>
            )}
          </Button>
        )}
      </AccordionPanel>
    </AccordionItem>
  );
};

export default SingleChapterDesc;
