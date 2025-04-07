import {
  faDownLeftAndUpRightToCenter,
  faUpRightAndDownLeftFromCenter,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useContext } from "react";
import { AppContext } from "../pages/_app";
import ActionButton from "./ActionButton";

// lock func
const FullScreen = () => {
  const { toggleFullscreen, handleFullScreen, orientation } =
    useContext(AppContext);
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
      label={toggleFullscreen ? "全画面を閉じる" : "全画面で鑑賞する"}
      description={toggleFullscreen ? "全画面を閉じる" : "全画面で鑑賞する"}
      onClick={() => handleFullScreen("landscape")}
      variant="fullscreen"
    />
  );
};

export default FullScreen;
