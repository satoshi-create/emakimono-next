import React, { useContext } from "react";
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

  const { orientation } = useContext(AppContext);
  return (
    <aside
      className={`${styles.container} ${
        orientation === "landscape" ? styles.land : styles.prt
      } ${data.type === "古典文学" && styles.bcg}`}
    >
      <button
        onClick={() => handleToId(data.type === "西洋絵画" ? 0 : endIndex)}
        className={styles.button}
        title="最後に進む"
      >
        <i>
          <FontAwesomeIcon icon={faAnglesLeft} />
        </i>
      </button>
      <button ref={scrollNextRef} className={styles.button} title="次に進む">
        <i>
          <FontAwesomeIcon icon={faChevronLeft} />
        </i>
      </button>
      <Link href="https://note.com/enjoy_emakimono/n/n449f765b4876">
        <a className={styles.button} target="_blank">
          <i>
            <FontAwesomeIcon
              icon={faCircleQuestion}
              title="絵巻の見方"
            />
          </i>
        </a>
      </Link>
      <ToggleEkotoba data={data} />
      <FullScreen />
      {character && <ToggleCharacter data={data} />}
      {ebiki && <ToggleEbiki data={data} />}
      <button ref={scrollPrevRef} className={styles.button} title="前に戻る">
        <i>
          <FontAwesomeIcon icon={faChevronRight} />
        </i>
      </button>
      <button
        onClick={() => handleToId(data.type === "西洋絵画" ? endIndex : 0)}
        className={styles.button}
        title="先頭に戻る"
      >
        <i>
          <FontAwesomeIcon icon={faAnglesRight} />
        </i>
      </button>
    </aside>
  );
};

export default EmakiNavigation;
