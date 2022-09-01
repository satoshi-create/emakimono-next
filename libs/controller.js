import React, { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faAngleLeft,
  faAngleRight,
  faPaintBrush,
} from "@fortawesome/free-solid-svg-icons";
import { NextContext } from "../context/context";
import { AppContext } from "../pages/_app";
const DataController = () => {
  const { ekotobaImageToggle, setEkotobaImageToggle } = useContext(AppContext);
  console.log(ekotobaImageToggle);


  const data = [
    {
      className: "end-icon js-smooth-scroll",
      link: "#s9",
      icon: <FontAwesomeIcon icon={faAngleLeft} />,
      title: "最後に進む",
    },
    {
      className: "home-icon",
      link: "/emakis",
      icon: <FontAwesomeIcon icon={faHouse} />,
      title: "ホーム",
    },
    {
      className: "pen-icon",
      toggleEkotobaImage: () => setEkotobaImageToggle(!ekotobaImageToggle),
      icon: <FontAwesomeIcon icon={faPaintBrush} />,
      title: "詞書の書風を見る",
    },
    {
      className: "start-icon js-smooth-scroll",
      link: "#s0",
      icon: <FontAwesomeIcon icon={faAngleRight} />,
      title: "最初に戻る",
    },
  ];

  return data;
};

export default DataController;
