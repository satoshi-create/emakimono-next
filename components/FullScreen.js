import React, { useContext, useEffect } from "react";
import { AppContext } from "../pages/_app";
import styles from "../styles/FullScreen.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownLeftAndUpRightToCenter,
  faUpRightAndDownLeftFromCenter,
} from "@fortawesome/free-solid-svg-icons";

// TODO:フルスクリーンを解除しないでページ遷移したときに、フルスクリーンを解除する

// lock func
const FullScreen = () => {
  const { toggleFullscreen, handleFullScreen } = useContext(AppContext);
  // useEffect(() => {
  //   setToggleFullscreen(false);
  // }, []);

  return (
    <button
      type="button"
      value="Lock Landscape"
      onClick={() => handleFullScreen("landscape")}
      className={`${styles.button} ${styles.icon}`}
    >
      {/* {toggleFullscreen ? (
        <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} />
      ) : (
        <FontAwesomeIcon icon={faDownLeftAndUpRightToCenter} />
      )} */}
      <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} />
    </button>
  );
};

export default FullScreen;
