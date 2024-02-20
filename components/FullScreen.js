import React, { useContext } from "react";
import { AppContext } from "../pages/_app";
import styles from "../styles/FullScreen.module.css";

const FullScreen = () => {
  const { toggleFullscreen, lock, unlock } =
    useContext(AppContext);

  console.log(toggleFullscreen);

  return (
    <button
      type="button"
      value="Lock Landscape"
      onClick={() => lock("landscape")}
      className={styles.button}
    >
      {toggleFullscreen ? "lock" : "unlock"}
    </button>
  );
};

export default FullScreen;
