import styles from "@/styles/EmakiNavigation.module.css";
import {
  faAnglesLeft,
  faAnglesRight,
  faCircleQuestion,
  faPlay,
  faStop,
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
const EmakiNavigation = ({
  handleToId,
  data,
  isUIVisible = true,
  isPlayMode = false,
  onStartPlayMode,
  onStopPlayMode,
}) => {
  const { character, ebiki } = data;
  const endIndex = data.emakis.length - 1;

  const { orientation, openHelpModal } = useContext(AppContext);

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
        onClick={openHelpModal}
        isUIVisible={isUIVisible}
      />
      {/* 教育現場向けUI: 再生/停止ボタン - 状態に応じて切り替え */}
      {isPlayMode && onStopPlayMode ? (
        <ActionButton
          icon={
            <FontAwesomeIcon icon={faStop} style={{ fontSize: "1.3em" }} />
          }
          label="停止"
          description="自動再生を停止"
          onClick={onStopPlayMode}
          isUIVisible={isUIVisible}
        />
      ) : (
        onStartPlayMode && (
          <ActionButton
            icon={
              <FontAwesomeIcon icon={faPlay} style={{ fontSize: "1.3em" }} />
            }
            label="自動再生"
            description="自動再生"
            onClick={onStartPlayMode}
            isUIVisible={isUIVisible}
          />
        )
      )}
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
