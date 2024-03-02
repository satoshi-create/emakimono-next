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

// TODO:フルスクリーンを解除しないでページ遷移したときに、フルスクリーンを解除する

// lock func
const FullScreen = () => {
  const { toggleFullscreen, handleFullScreen, orientation } =
    useContext(AppContext);

  return (
    <button
      type="button"
      value="Lock Landscape"
      onClick={() => handleFullScreen("landscape")}
      className={`${orientation === "landscape" ? styles.land : styles.prt} ${
        styles.icon
      }`}
    >
      {toggleFullscreen ? (
        <FontAwesomeIcon icon={faCompress} />
      ) : (
        <FontAwesomeIcon icon={faExpand} />
      )}
    </button>
  );
};

export default FullScreen;
