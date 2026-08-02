import styles from "@/styles/ActionButton.module.css";
import { IconButton, Tooltip, useBreakpointValue } from "@chakra-ui/react";
import { forwardRef } from "react";

const ActionButton = forwardRef(
  (
    {
      icon,
      onClick,
      description,
      top,
      left,
      right,
      zIndex,
      variant = "default",
      highlightNext,
      isUIVisible = true,
      isFullscreen = false,
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
        isDisabled={isMobile || !isUIVisible} // UI非表示時はTooltipも無効化
        isOpen={isUIVisible ? undefined : false} // UI非表示時はTooltipを強制的に閉じる
      >
        <IconButton
          icon={icon}
          ref={ref} // refをIconButtonに適用
          onClick={onClick}
          aria-label={description}
          variant="unstyled" // 必要に応じて変更
          // bottom は var(--commentary-bar-full-h) の増分で自動追従するため
          // transition 対象から除外（シート開閉時の位置の滑り・跳ねを防止）
          transition="opacity 0.3s linear, transform 0.2s ease"
          sx={{
            paddingInlineStart: "0 !important",
            paddingInlineEnd: "0 !important",
            // 教育現場向けUI: 静止UI耐性 - フェードイン/アウト
            opacity: isUIVisible ? 1 : 0,
            pointerEvents: isUIVisible ? "auto" : "none",
            ...(isCarouselButton && {
              backgroundColor: "rgba(0, 0, 0, 0.281);",
              position: "absolute",
              top: top || "50%",
              left: left,
              right: right,
              zIndex: zIndex,
            }),
            ...(isFullscreenButton && {
              position: "absolute",
              // ノッチ端末対応: safe-area-inset を加算して画面外に落ちるのを防止
              // 非フルスクリーン時: ボトムコメントバー表示時はバー実高さ（展開シート含む）ぶん持ち上げる。
              // % 基準だとシート展開でコンテナ高が伸びたときに位置がずれるため固定値を使用
              // フルスクリーン時: バーは右下のカードとして浮くため持ち上げ不要。右下コーナーに固定
              bottom: !isMobile
                ? isFullscreen
                  ? "1.5rem"
                  : "calc(1.5rem + var(--commentary-bar-full-h, var(--commentary-bar-h, 0px)))"
                : isFullscreen
                  ? "calc(0.75rem + env(safe-area-inset-bottom, 0px))"
                  : "calc(0.75rem + var(--commentary-bar-full-h, var(--commentary-bar-h, 0px)) + env(safe-area-inset-bottom, 0px))",
              right: !isMobile
                ? isFullscreen
                  ? "1rem"
                  : "1%"
                : isFullscreen
                  ? "calc(1rem + env(safe-area-inset-right, 0px))"
                  : "calc(1% + env(safe-area-inset-right, 0px))",
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
