import React, { useContext } from "react";
import styles from "../styles/ToggleEkotoba.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faBookOpen } from "@fortawesome/free-solid-svg-icons";
import { AppContext } from "../pages/_app";
import ActionButton from "./ActionButton";

const ToggleEbiki = () => {
  const { handleEbikiToggle, ebikiToggle } = useContext(AppContext);

  return (
    <ActionButton
      icon={
        ebikiToggle ? (
          <FontAwesomeIcon icon={faBook} style={{ fontSize: "1.5em" }} />
        ) : (
          <FontAwesomeIcon icon={faBookOpen} style={{ fontSize: "1.5em" }} />
        )
      }
      label={ebikiToggle ? "絵引きを閉じる" : "絵引きを見る"}
      description={ebikiToggle ? "絵引きを閉じる" : "絵引きを見る"}
      onClick={handleEbikiToggle}
    />
  );
};

export default ToggleEbiki;
