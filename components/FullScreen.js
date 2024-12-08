import React, { useContext, useEffect } from "react";
import { AppContext } from "../pages/_app";
import styles from "../styles/FullScreen.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownLeftAndUpRightToCenter,
  faUpRightAndDownLeftFromCenter,

  faExpand,
  faCompress,
} from "@fortawesome/free-solid-svg-icons";
import ActionButton from "./ActionButton";

// TODO:フルスクリーンを解除しないでページ遷移したときに、フルスクリーンを解除する

// lock func
const FullScreen = () => {
  const { toggleFullscreen, handleFullScreen, orientation } = useContext(
    AppContext
  );
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
