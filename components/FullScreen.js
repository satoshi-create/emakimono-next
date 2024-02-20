import React, { useContext } from "react";
import { AppContext } from "../pages/_app";
import styles from "../styles/FullScreen.module.css";

const FullScreen = () => {
  const { togglbtn, setTogglBtn, lock, unlock } = useContext(AppContext);
  console.log(togglbtn);
  return (
    <button
      type="button"
      value="Lock Landscape"
      onClick={togglbtn ? () => lock("landscape") : () => unlock()}
      className={styles.button}
    >
      lock/unlock
    </button>
  );
};

export default FullScreen;
