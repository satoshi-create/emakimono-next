import React, { useContext, useEffect } from "react";
import { AppContext } from "../pages/_app";
import styles from "../styles/FullScreen.module.css";

const FullScreen = () => {
  const { toggleFullscreen, setToggleFullscreen, lock, unlock } =
    useContext(AppContext);

  console.log(toggleFullscreen);

  // useEffect(() => {
  //   setToggleFullscreen(false);
  // }, []);

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
