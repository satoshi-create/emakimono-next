import React, { useContext, useEffect } from "react";
import { AppContext } from "../pages/_app";
import styles from "../styles/FullScreen.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownLeftAndUpRightToCenter,
  faUpRightAndDownLeftFromCenter,
} from "@fortawesome/free-solid-svg-icons";

// lock func
const FullScreen = () => {
  const { toggleFullscreen, handleFullScreen } = useContext(AppContext);

  console.log(toggleFullscreen);

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
      {toggleFullscreen ? (
        <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} />
      ) : (
        <FontAwesomeIcon icon={faDownLeftAndUpRightToCenter} />
      )}
    </button>
  );
};

export default FullScreen;
