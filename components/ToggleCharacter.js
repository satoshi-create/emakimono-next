import React, { useContext } from "react";
import styles from "../styles/ToggleEkotoba.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faUserSlash } from "@fortawesome/free-solid-svg-icons";
import { AppContext } from "../pages/_app";

const ToggleCharacter = () => {
  const { orientation, handleCharacterToggle, characterToggle } =
    useContext(AppContext);

  console.log(characterToggle);

  return (
    <button
      className={styles.button}
      onClick={handleCharacterToggle}
      title={
        characterToggle ? "登場人物の名前を閉じる" : "登場人物の名前を見る"
      }
    >
      <i
        style={{
          fontSize: `${orientation === "portrait" ? "14px" : "20px"}`,
        }}
      >
        {characterToggle ? (
          <FontAwesomeIcon icon={faUserSlash} />
        ) : (
          <FontAwesomeIcon icon={faUser} />
        )}
      </i>
    </button>
  );
};

export default ToggleCharacter;
