import { postFeedback } from "@/libs/api/ugcApi";
import { stripLocalePrefix } from "@/utils/buildShareUrl";
import { AppContext } from "@/context/AppContext";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { useTranslation } from "next-i18next";

const FeedbackModal = () => {
  const { isFeedbackModalOpen, closeFeedbackModal } = useContext(AppContext);
  const { t } = useTranslation("common");
  const { locale, asPath, locales } = useRouter();
  const toast = useToast();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pathWithoutLocale = stripLocalePrefix(asPath, locales);
  const firstSegment = pathWithoutLocale.replace(/^\//, "").split("/")[0];
  const reservedPaths = new Set([
    "about",
    "guide",
    "privacy",
    "terms",
    "ranking",
    "type",
    "author",
    "era",
    "keyword",
    "personname",
    "kusouzu",
    "contact",
  ]);
  const emakiId =
    firstSegment && !reservedPaths.has(firstSegment) ? firstSegment : null;

  const handleClose = () => {
    if (isSubmitting) return;
    setMessage("");
    closeFeedbackModal();
  };

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await postFeedback({
        message: trimmed,
        pageUrl: asPath,
        emakiId,
        locale,
      });
      toast({
        title: t("feedbackForm.success"),
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      setMessage("");
      closeFeedbackModal();
    } catch (error) {
      toast({
        title: t("feedbackForm.error"),
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isFeedbackModalOpen} onClose={handleClose} isCentered>
      <ModalOverlay />
      <ModalContent mx={4}>
        <ModalHeader>{t("feedbackForm.title")}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("feedbackForm.placeholder")}
            rows={6}
            maxLength={2000}
          />
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={handleClose} isDisabled={isSubmitting}>
            {t("feedbackForm.cancel")}
          </Button>
          <Button
            colorScheme="orange"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!message.trim()}
          >
            {t("feedbackForm.submit")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default FeedbackModal;
