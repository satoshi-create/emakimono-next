import React,{forwardRef} from 'react'
import {
  VStack,
  HStack,
  IconButton,
  Button,
  useBreakpointValue,
  Tooltip,
  Text,
} from "@chakra-ui/react";

const ActionButton = forwardRef(({ icon, onClick, description }, ref) => {
  const isMobile = useBreakpointValue({ base: true, md: false });

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
        }}
        size={{ base: "sm", md: "md" }}
        color="white"
        _hover={{
          transform: "scale(1.4)",
          color: "#ff8c77",
        }}
      />
    </Tooltip>
  );
});

// displayNameを設定
ActionButton.displayName = "ActionButton";


export default ActionButton
