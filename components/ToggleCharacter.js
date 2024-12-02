import React, { useContext } from "react";
import styles from "../styles/ToggleEkotoba.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faUserSlash } from "@fortawesome/free-solid-svg-icons";
import { AppContext } from "../pages/_app";
import ActionButton from "./ActionButton";

const ToggleCharacter = () => {
  const { orientation, handleCharacterToggle, characterToggle } = useContext(
    AppContext
  );

  return (
    <ActionButton
      icon={
        characterToggle ? (
          <FontAwesomeIcon icon={faUserSlash} style={{ fontSize: "1.5em" }}/>
        ) : (
          <FontAwesomeIcon icon={faUser} style={{ fontSize: "1.5em" }}/>
        )
      }
      label={
        characterToggle ? "登場人物の名前を閉じる" : "登場人物の名前を見る"
      }
      description={
        characterToggle ? "登場人物の名前を閉じる" : "登場人物の名前を見る"
      }
      onClick={handleCharacterToggle}
    />

  );
};

export default ToggleCharacter;
