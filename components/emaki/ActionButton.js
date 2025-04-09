import styles from "@/styles/ActionButton.module.css";
import { IconButton, Tooltip, useBreakpointValue } from "@chakra-ui/react";
import { forwardRef } from "react";

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
    const isFullscreenButton = variant === "fullscreen";

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
            ...(isFullscreenButton && {
              position: "absolute",
              bottom: !isMobile ? "4%" : "1%",
              right: !isMobile ? "1%" : "1%",
              zIndex: "10",
              fontsize: "1em",
            }),
          }}
          // className={highlightNext ? "highlight-animation" : ""}
          className={`${highlightNext && styles.highlightAnimation}`}
          // className={styles.highlightAnimation}
          size={{ base: "sm", md: "md" }}
          // color={isEmakipageicon ? "#ff8c77" : "white"}
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
        {/* {!isCarouselButton && (
          <Text
            fontSize="10px"
            fontFamily={"Zen Maru Gothic, sans-serif"}
            color={"var(--chakra-colors-gray-100)"}
            whiteSpace={"nowrap"}
            zIndex={zIndex}
          >
            {description}
          </Text>
        )} */}
      </Tooltip>
    );
  }
);

// displayNameを設定
ActionButton.displayName = "ActionButton";

export default ActionButton;
