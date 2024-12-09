import {
  Box,
  VStack,
  HStack,
  Circle,
  Text,
  Divider,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@chakra-ui/react";
import React from "react";

export default function TimelineWithDetails() {
  const sections = [
    {
      id: "一",
      title: "序章",
      details: "タイムライン全体の目的を理解できます。",
    },
    { id: "二", title: "第一章", details: "基礎知識を学ぶことができます。" },
    {
      id: "三",
      title: "第二章",
      details: "具体的な実例に基づいて説明します。",
    },
  ];

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalContent, setModalContent] = React.useState("");

  const handleOpenModal = (content) => {
    setModalContent(content);
    onOpen();
  };

  return (
    <>
      {/* タイムライン */}
      <VStack align="start" spacing={0} mt={8} position="relative">
        {/* タイムラインの縦線 */}
        <Box
          position="absolute"
          top={0}
          bottom={0}
          left="18px"
          width="2px"
          bg="gray.300"
          zIndex={-1}
        />
        {sections.map((section, index) => (
          <VStack key={section.id} align="start" spacing={4}>
            {/* タイムラインのノード */}
            <HStack align="center" spacing={2}>
              <Circle
                size="36px"
                bg="rgb(255, 140, 119)"
                color="white"
                fontFamily="'Zen Maru Gothic', sans-serif"
              >
                {section.id}
              </Circle>
              <Text
                fontSize="lg"
                fontWeight="bold"
                fontFamily="'Zen Maru Gothic', sans-serif"
                color="rgb(255, 140, 119)"
              >
                {section.title}
              </Text>
            </HStack>

            {/* セクション間のボタン */}
            {section.details && (
              <Box pl={12}>
                <Button
                  size="sm"
                  bg="rgb(255, 140, 119)"
                  color="white"
                  fontFamily="'Zen Maru Gothic', sans-serif"
                  _hover={{ bg: "rgb(255, 120, 100)" }}
                  onClick={() => handleOpenModal(section.details)}
                >
                  解説・現代文
                </Button>
              </Box>
            )}
          </VStack>
        ))}
      </VStack>

      {/* モーダルウィンドウ */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent fontFamily="'Zen Maru Gothic', sans-serif">
          <ModalHeader color="rgb(255, 140, 119)">解説・現代文</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>{modalContent}</Text>
          </ModalBody>
          <ModalFooter>
            <Button bg="rgb(255, 140, 119)" color="white" onClick={onClose}>
              閉じる
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
