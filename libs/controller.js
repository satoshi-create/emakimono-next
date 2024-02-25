import React, { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faAnglesLeft,
  faAnglesRight,
  faPaintBrush,
  faKeyboard,
  faCommentSlash,
  faComment,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { AppContext } from "../pages/_app";

const DataController = () => {
  const { ekotobaImageToggle, setEkotobaImageToggle } = useContext(AppContext);

  const data = [
    {
      ctype: "all",
      link: "#s9",
      icon: <FontAwesomeIcon icon={faAnglesLeft} />,
      title: "最後に進む",
      titleen: "go to end",
    },
    {
      ctype: "all",
      link: "#s9",
      icon: <FontAwesomeIcon icon={faChevronLeft} />,
      title: "次に進む",
      titleen: "go to next",
    },
    {
      ctype: "all",
      link: "/",
      icon: <FontAwesomeIcon icon={faHouse} />,
      title: "ホーム",
      titleen: "home",
    },
    {
      ctype: "all",
      toggleEkotobaImage: () => setEkotobaImageToggle(!ekotobaImageToggle),
      iconEkotoba1: <FontAwesomeIcon icon={faPaintBrush} />,
      iconEkotoba2: <FontAwesomeIcon icon={faKeyboard} />,
      iconEmaki1: <FontAwesomeIcon icon={faCommentSlash} />,
      iconEmaki2: <FontAwesomeIcon icon={faComment} />,
      titleEkotoba1: "詞書の書風を見る",
      titleEkotoba2: "詞書の現代語訳を読む",
      titleEmaki1: "解説を閉じて絵巻形式で見る",
      titleEmaki2: "解説を読む",
      titleen: "comment",
    },
    {
      ctype: "all",
      link: "#s0",
      icon: <FontAwesomeIcon icon={faChevronRight} />,
      title: "前に戻る",
      titleen: "back to previous",
    },
    {
      ctype: "all",
      link: "#s0",
      icon: <FontAwesomeIcon icon={faAnglesRight} />,
      title: "最初に戻る",
      titleen: "back to first",
    },
  ];

  return data;
};

export default DataController;
