import React, { forwardRef } from "react";
import {
  VStack,
  HStack,
  IconButton,
  Button,
  useBreakpointValue,
  Tooltip,
  Text,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import styles from "../styles/ActionButton.module.css";

const ActionButton = forwardRef(
  (
    {
      icon,
      onClick,
      description,
      left,
      right,
      zIndex,
      variant = "default",
      highlightNext,
    },
    ref
  ) => {
    const isMobile = useBreakpointValue({ base: true, md: false });

    const isCarouselButton = variant === "carousel"; // variantに基づいてスタイルを分岐


    return (
      <Tooltip
        label={description}
        aria-label={description}
        hasArrow
        isDisabled={isMobile}
      >
        <IconButton
          icon={icon}
          ref={ref} // refをIconButtonに適用
          onClick={onClick}
          aria-label={description}
          variant="unstyled" // 必要に応じて変更
          transition="all 0.3s linear"
          sx={{
            paddingInlineStart: "0 !important",
            paddingInlineEnd: "0 !important",
            ...(isCarouselButton && {
              backgroundColor: "rgba(0, 0, 0, 0.281);",
              position: "absolute",
              top: "50%",
              left: left,
              right: right,
              zIndex: zIndex,
            }),
          }}
          // className={highlightNext ? "highlight-animation" : ""}
          className={`${highlightNext && styles.highlightAnimation}`}
          // className={styles.highlightAnimation}
          size={{ base: "sm", md: "md" }}
          color="white"
          _hover={
            !isMobile
              ? {
                  transform: "scale(1.4)",
                  color: "#ff8c77",
                }
              : {
                  color: "#ff8c77",
                }
          }
        />
      </Tooltip>
    );
  }
);

// displayNameを設定
ActionButton.displayName = "ActionButton";

export default ActionButton;
