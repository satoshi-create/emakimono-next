import {ChevronLeft,ChevronRight,Home} from "react-feather"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse,faAngleLeft,faAngleRight } from "@fortawesome/free-solid-svg-icons";

const controller = [
  {
    className: "end-icon js-smooth-scroll",
    link: "#s9",
    icon: <FontAwesomeIcon icon={faAngleLeft} />,
    title: "最後に進む",
  },
  {
    className: "home-icon",
    link: "/",
    icon: <FontAwesomeIcon icon={faHouse} />,
    title: "ホーム",
  },
  // {
  //   className: "pen-icon",
  //   link: "",
  //   icon: "fa-solid fa-pen",
  //   title: "詞書の書風を見る",
  // },
  // {
  //   className: "toggle-icon",
  //   link: "",
  //   icon: "fa-solid fa-plus",
  //   title: "詞書の現代語訳と原文を比べて読む",
  // },
  // {
  //   className: "zoom-icon",
  //   link: "",
  //   icon: "fa-solid fa-magnifying-glass",
  //   title: "部分拡大＆解説を見る",
  // },
  // {
  //   className: "toggle-text-icon",
  //   link: "",
  //   icon: "fas fa-sync",
  //   title: "詞書の現代語訳と原文の表示位置を切り替え",
  // },
  // {
  //   className: "ekotoba-icon",
  //   link: "",
  //   icon: "fas fa-scroll fa-rotate-90",
  //   title: "出典",
  // },
  {
    className: "start-icon js-smooth-scroll",
    link: "#s0",
    icon: <FontAwesomeIcon icon={faAngleRight} />,
    title: "最初に戻る",
  },
];

export default controller;
