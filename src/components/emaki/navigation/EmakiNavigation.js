import styles from "@/styles/EmakiNavigation.module.css";
import {
  faAnglesLeft,
  faAnglesRight,
  faChevronLeft,
  faChevronRight,
  faCircleQuestion,
  faCommentDots,
  faPlay,
  faStop,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext } from "react";
import ToggleCharacter from "@/components/emaki/viewer/ToggleCharacter";
import ToggleChapter from "@/components/emaki/viewer/ToggleChapter";
import ToggleEbiki from "@/components/emaki/viewer/ToggleEbiki";
import ActionButton from "@/components/emaki/viewer/ActionButton";
import { AppContext } from "@/context/AppContext";
import { useTranslation } from "next-i18next";

/**
 * ナビ: 端移動・前後・見方・【大】自動再生・スクロール体験・トグル
 * いいね／共有はタイトル横・段タイトル側
 */
const EmakiNavigation = ({
  handleToId,
  data,
  isUIVisible = true,
  isPlayMode = false,
  isAutoScrolling = false,
  onStartPlayMode,
  onStopPlayMode,
  onOpenScrollFeedback,
  showScrollFeedbackButton = true,
}) => {
  const { character, ebiki } = data;
  const endIndex = data.emakis.length - 1;
  const { t } = useTranslation("common");

  const { orientation, openHelpModal, navIndex } = useContext(AppContext);

  const ekotobas = (data.emakis || []).filter((item) => item.cat === "ekotoba");
  const hasChapters = (data.emakis || []).some((item) => item.chapter);
  const currentIdx = ekotobas.reduce(
    (acc, item, i) => (item.linkId <= navIndex ? i : acc),
    0
  );
  const isLtr = data.type === "西洋絵画";
  const nextScene = ekotobas[currentIdx + (isLtr ? -1 : 1)];
  const prevScene = ekotobas[currentIdx + (isLtr ? 1 : -1)];

  return (
    <aside
      className={`${styles.container} ${
        orientation === "landscape" ? styles.land : styles.prt
      } ${data.type === "古典文学" && styles.bcg}`}
      style={{
        opacity: isUIVisible ? 1 : 0,
        pointerEvents: isUIVisible ? "auto" : "none",
        transition: "opacity 0.3s linear",
      }}
    >
      <ActionButton
        icon={
          <FontAwesomeIcon icon={faAnglesLeft} style={{ fontSize: "1.5em" }} />
        }
        label={t("viewer.goToEnd")}
        onClick={() => handleToId(data.type === "西洋絵画" ? 0 : endIndex)}
        description={t("viewer.goToEnd")}
        isUIVisible={isUIVisible}
      />
      {nextScene && (
        <ActionButton
          icon={
            <FontAwesomeIcon
              icon={faChevronLeft}
              style={{ fontSize: "1.5em" }}
            />
          }
          label={t("viewer.next")}
          description={t("viewer.next")}
          onClick={() => handleToId(nextScene.linkId)}
          isUIVisible={isUIVisible}
        />
      )}
      <ActionButton
        icon={
          <FontAwesomeIcon
            icon={faCircleQuestion}
            style={{ fontSize: "1.5em" }}
          />
        }
        label={t("viewer.howToView")}
        description={t("viewer.howToView")}
        onClick={openHelpModal}
        isUIVisible={isUIVisible}
      />
      {(isPlayMode || isAutoScrolling) ? (
        <ActionButton
          icon={
            <FontAwesomeIcon icon={faStop} style={{ fontSize: "1.5em" }} />
          }
          label={t("viewer.stop")}
          description={t("viewer.stopAutoPlay")}
          onClick={isPlayMode ? onStopPlayMode : undefined}
          isUIVisible={isUIVisible}
        />
      ) : (
        onStartPlayMode && (
          <ActionButton
            icon={
              <FontAwesomeIcon icon={faPlay} style={{ fontSize: "1.5em" }} />
            }
            label={t("viewer.autoPlay")}
            description={t("viewer.autoPlay")}
            onClick={onStartPlayMode}
            isUIVisible={isUIVisible}
          />
        )
      )}
      {showScrollFeedbackButton && onOpenScrollFeedback && (
        <ActionButton
          icon={
            <FontAwesomeIcon icon={faCommentDots} style={{ fontSize: "1.35em" }} />
          }
          label={t("scrollFeedback.buttonLabel")}
          description={t("scrollFeedback.buttonLabel")}
          onClick={onOpenScrollFeedback}
          isUIVisible={isUIVisible}
        />
      )}
      {character && <ToggleCharacter isUIVisible={isUIVisible} />}
      {ebiki && <ToggleEbiki isUIVisible={isUIVisible} />}
      {hasChapters && <ToggleChapter isUIVisible={isUIVisible} />}
      {prevScene && (
        <ActionButton
          icon={
            <FontAwesomeIcon
              icon={faChevronRight}
              style={{ fontSize: "1.5em" }}
            />
          }
          label={t("viewer.previous")}
          description={t("viewer.previous")}
          onClick={() => handleToId(prevScene.linkId)}
          isUIVisible={isUIVisible}
        />
      )}
      <ActionButton
        icon={
          <FontAwesomeIcon icon={faAnglesRight} style={{ fontSize: "1.5em" }} />
        }
        label={t("viewer.goToStart")}
        description={t("viewer.goToStart")}
        onClick={() => handleToId(data.type === "西洋絵画" ? endIndex : 0)}
        isUIVisible={isUIVisible}
      />
    </aside>
  );
};

export default EmakiNavigation;
