import React, { useContext } from "react";
import styles from "../styles/ToggleEkotoba.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faBookOpen } from "@fortawesome/free-solid-svg-icons";
import { AppContext } from "../pages/_app";

const ToggleEbiki = () => {
  const { orientation, handleEbikiToggle, ebikiToggle } =
    useContext(AppContext);

  return (
    <button
      className={styles.button}
      onClick={handleEbikiToggle}
      title={ebikiToggle ? "絵引きを閉じる" : "絵引きを見る"}
    >
      <i
        style={{
          fontSize: `${orientation === "portrait" ? "14px" : "20px"}`,
        }}
      >
        {ebikiToggle ? (
          <FontAwesomeIcon icon={faBook} />
        ) : (
          <FontAwesomeIcon icon={faBookOpen} />
        )}
      </i>
    </button>
  );
};

export default ToggleEbiki;
