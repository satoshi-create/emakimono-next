import React, { useContext, useState } from "react";
import styles from "../styles/ChapterDesc.module.css";
import { ChevronDown, ChevronUp } from "react-feather";
import { AppContext } from "../pages/_app";
import Image from "next/image";
import { ChaptersTitle, ChaptersGendaibun } from "../libs/func";
import { eraColor } from "../libs/func";
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Button,
  Text,
} from "@chakra-ui/react";

const SingleChapterDesc = ({ item, index, emakis, data }) => {
  const { handleToId, handleFullScreen } = useContext(AppContext);
  const [showInfo, setShowInfo] = useState(false);
  const { chapter, gendaibun, cat, desc } = item;
  const { genjieslug, title, titleen, era } = data;

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
           <AccordionButton>
             {/* アイコンをタイトルの前に配置 */}
             <AccordionItem mr={2} />
             <Box
               flex="1"
               textAlign="left"
               color={eraColor(era)}
               fontSize={{ base: "0.8rem", sm: "0.9rem", md: "1rem" }}
             >
               {ChaptersTitle(titleen, title, chapter)}
             </Box>
             {/* リンクアイコンの色を #ff8c77 に変更し、右寄せ、丸みを帯びたデザイン */}
             <Button
               as="a"
               href="#"
               color="#ff8c77"
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
           <Text fontSize={{ base: "0.75rem", sm: "0.85rem", md: "0.9rem" }}>
             {ChaptersGendaibun(titleen, title, chapter, gendaibun)}
           </Text>
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
             {ChaptersTitle(titleen, title, chapter)}の画像を見る
           </Button>
         </AccordionPanel>
       </AccordionItem>
 );
};

export default SingleChapterDesc;
