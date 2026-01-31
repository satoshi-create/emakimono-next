import styles from "@/styles/EmakiNavigation.module.css";
import {
  faAnglesLeft,
  faAnglesRight,
  faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext } from "react";
// import { ArrowRight, ChevronRight } from "react-feather";
import ToggleCharacter from "@/components/emaki/viewer/ToggleCharacter";
import ToggleEbiki from "@/components/emaki/viewer/ToggleEbiki";
import ToggleEkotoba from "@/components/emaki/viewer/ToggleEkotoba";
import ActionButton from "@/components/emaki/viewer/ActionButton";
import { AppContext } from "@/pages/_app";

// TODO: 横スクロールで最後まで進み、「先頭に戻る」を押しても反応がない
// ⇒navIndexが0になっている
// TODO : アイコンホバー時のtitleを追加・修正する
const EmakiNavigation = ({ handleToId, data, isUIVisible = true }) => {
  const { character, ebiki } = data;
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
      style={{
        // 教育現場向けUI: 静止UI耐性 - フェードイン/アウト
        opacity: isUIVisible ? 1 : 0,
        pointerEvents: isUIVisible ? "auto" : "none",
        transition: "opacity 0.3s linear",
      }}
    >
      <ActionButton
        icon={
          <FontAwesomeIcon icon={faAnglesLeft} style={{ fontSize: "1.5em" }} />
        }
        label="最後に進む"
        onClick={() => handleToId(data.type === "西洋絵画" ? 0 : endIndex)}
        description="最後に進む"
        isUIVisible={isUIVisible}
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
        isUIVisible={isUIVisible}
      />
      <ToggleEkotoba data={data} isUIVisible={isUIVisible} />
      {/* <FullScreen /> */}
      {character && <ToggleCharacter isUIVisible={isUIVisible} />}
      {ebiki && <ToggleEbiki isUIVisible={isUIVisible} />}
      <ActionButton
        icon={
          <FontAwesomeIcon icon={faAnglesRight} style={{ fontSize: "1.5em" }} />
        }
        label="先頭に戻る"
        description="先頭に戻る"
        onClick={() => handleToId(data.type === "西洋絵画" ? endIndex : 0)}
        isUIVisible={isUIVisible}
      />
    </aside>
  );
};

export default EmakiNavigation;
