import React, { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faAnglesLeft,
  faAnglesRight,
  faPaintBrush,
  faKeyboard,
} from "@fortawesome/free-solid-svg-icons";
import { NextContext } from "../context/context";
import { AppContext } from "../pages/_app";
const DataController = () => {
  const { ekotobaImageToggle, setEkotobaImageToggle } = useContext(AppContext);
  console.log(ekotobaImageToggle);

  const data = [
    {
      ctype: "all",
      link: "#s9",
      icon: <FontAwesomeIcon icon={faAnglesLeft} />,
      title: "最後に進む",
    },
    {
      ctype: "all",
      link: "/",
      icon: <FontAwesomeIcon icon={faHouse} />,
      title: "ホーム",
    },
    {
      ctype: "ekotoba",
      toggleEkotobaImage: () => setEkotobaImageToggle(!ekotobaImageToggle),
      icon: <FontAwesomeIcon icon={faPaintBrush} />,
      icon2: <FontAwesomeIcon icon={faKeyboard} />,
      title: "詞書の書風を見る",
      title2: "詞書の現代語訳を読む",
    },
    {
      ctype: "all",
      link: "#s0",
      icon: <FontAwesomeIcon icon={faAnglesRight} />,
      title: "最初に戻る",
    },
  ];

  return data;
};

export default DataController;
