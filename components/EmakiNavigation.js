import React, { useContext, forwardRef } from "react";
import styles from "../styles/EmakiNavigation.module.css";
import {
  faAnglesLeft,
  faAnglesRight,
  faChevronLeft,
  faChevronRight,
  faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { HelpCircle } from "react-feather";
// import { ArrowRight, ChevronRight } from "react-feather";
import Link from "next/link";
import { useRouter } from "next/router";
import ToggleEkotoba from "./ToggleEkotoba";
import { AppContext } from "../pages/_app";
import ToggleCharacter from "./ToggleCharacter";
import ToggleEbiki from "./ToggleEbiki";
import FullScreen from "./FullScreen";
import ActionButton from "./ActionButton";

// TODO: 横スクロールで最後まで進み、「先頭に戻る」を押しても反応がない
// ⇒navIndexが0になっている
// TODO : アイコンホバー時のtitleを追加・修正する
const EmakiNavigation = ({
  handleToId,
  data,
  scrollNextRef,
  scrollPrevRef,
}) => {
  const { character, ebiki } = data;
  const router = useRouter();
  const endIndex = data.emakis.length - 1;

  const handleClick = () => {
    window.open("https://note.com/enjoy_emakimono/n/n449f765b4876", "_blank"); // 新しいタブで遷移
  };

  const { orientation } = useContext(AppContext);

  return (
    <aside
      className={`${styles.container} ${
        orientation === "landscape" ? styles.land : styles.prt
      } ${data.type === "古典文学" && styles.bcg}`}
    >
      <ActionButton
        icon={
          <FontAwesomeIcon icon={faAnglesLeft} style={{ fontSize: "1.5em" }} />
        }
        label="戻る"
        onClick={() => handleToId(data.type === "西洋絵画" ? 0 : endIndex)}
        description="最後に進む"
      />
      <ActionButton
        ref={scrollNextRef}
        icon={
          <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: "1.5em" }} />
        }
        label="次に進む"
        description="次に進む"
      />
      <ActionButton
        icon={
          <FontAwesomeIcon
            icon={faCircleQuestion}
            style={{ fontSize: "1.5em" }}
          />
        }
        label="絵巻の見方"
        description="絵巻の見方"
        onClick={handleClick}
      />
      <ToggleEkotoba data={data} />
      <FullScreen />
      {character && <ToggleCharacter data={data} />}
      {ebiki && <ToggleEbiki data={data} />}

      <ActionButton
        ref={scrollPrevRef}
        icon={
          <FontAwesomeIcon
            icon={faChevronRight}
            style={{ fontSize: "1.5em" }}
          />
        }
        label="前に戻る"
        description="前に戻る"
      />
      <ActionButton
        icon={
          <FontAwesomeIcon icon={faAnglesRight} style={{ fontSize: "1.5em" }} />
        }
        label="先頭に戻る"
        description="先頭に戻る"
        onClick={() => handleToId(data.type === "西洋絵画" ? endIndex : 0)}
      />
    </aside>
  );
};

export default EmakiNavigation;
