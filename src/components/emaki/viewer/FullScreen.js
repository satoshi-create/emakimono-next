import ActionButton from "@/components/emaki/viewer/ActionButton";
import { AppContext } from "@/pages/_app";
import {
  faDownLeftAndUpRightToCenter,
  faUpRightAndDownLeftFromCenter,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext } from "react";
import { useTranslation } from "next-i18next";

// 教育現場向けUI: isUIVisible で静止UI耐性に対応
const FullScreen = ({ isUIVisible = true }) => {
  const { toggleFullscreen, handleFullScreen } = useContext(AppContext);
  const { t } = useTranslation("common");

  const description = toggleFullscreen
    ? t("viewer.exitFullscreen")
    : t("viewer.enterFullscreen");

  return (
    <ActionButton
      icon={
        toggleFullscreen ? (
          <FontAwesomeIcon
            icon={faDownLeftAndUpRightToCenter}
            style={{ fontSize: "1.5em" }}
          />
        ) : (
          <FontAwesomeIcon
            icon={faUpRightAndDownLeftFromCenter}
            style={{ fontSize: "1.5em" }}
          />
        )
      }
      label={description}
      description={description}
      onClick={() => handleFullScreen("landscape")}
      variant="fullscreen"
      isUIVisible={isUIVisible}
    />
  );
};

export default FullScreen;
