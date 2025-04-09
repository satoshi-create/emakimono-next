import styles from "@/styles/EmakiNavigation.module.css";
import {
  faAnglesLeft,
  faAnglesRight,
  faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext } from "react";
// import { ArrowRight, ChevronRight } from "react-feather";
import ActionButton from "@/components/emaki/ActionButton";
import ToggleCharacter from "@/components/emaki/ToggleCharacter";
import ToggleEbiki from "@/components/emaki/ToggleEbiki";
import ToggleEkotoba from "@/components/emaki/ToggleEkotoba";
import { AppContext } from "@/pages/_app";

// TODO: 横スクロールで最後まで進み、「先頭に戻る」を押しても反応がない
// ⇒navIndexが0になっている
// TODO : アイコンホバー時のtitleを追加・修正する
const EmakiNavigation = ({ handleToId, data }) => {
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
    >
      <ActionButton
        icon={
          <FontAwesomeIcon icon={faAnglesLeft} style={{ fontSize: "1.5em" }} />
        }
        label="最後に進む"
        onClick={() => handleToId(data.type === "西洋絵画" ? 0 : endIndex)}
        description="最後に進む"
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
      {/* <FullScreen /> */}
      {character && <ToggleCharacter data={data} />}
      {ebiki && <ToggleEbiki data={data} />}
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
