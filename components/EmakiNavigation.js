import React, { useContext } from "react";
import styles from "../styles/EmakiNavigation.module.css";
import {
  faAnglesLeft,
  faAnglesRight,
  faChevronLeft,
  faChevronRight,
  faHouse,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { ArrowRight, ChevronRight } from "react-feather";
import Link from "next/link";
import { useRouter } from "next/router";
import ToggleEkotoba from "./ToggleEkotoba";
import { AppContext } from "../pages/_app";

// TODO: 横スクロールで最後まで進み、「先頭に戻る」を押しても反応がない
// ⇒navIndexが0になっている
// TODO : アイコンホバー時のtitleを追加・修正する
const EmakiNavigation = ({
  handleToId,
  data,
  scrollNextRef,
  scrollPrevRef,
}) => {
  const router = useRouter();
  const endIndex = data.emakis.length - 1;

  const { orientation } = useContext(AppContext);
  return (
    <aside
      className={`${styles.container} ${
        orientation === "landscape" ? styles.land : styles.prt
      } `}
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
      {/* <button onClick={() => router.push("/")} className={styles.button}>
        <i>
          <FontAwesomeIcon icon={faHouse} />
        </i>
      </button> */}
      <ToggleEkotoba data={data} />
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
