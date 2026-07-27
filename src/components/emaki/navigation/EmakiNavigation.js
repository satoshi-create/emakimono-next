import styles from "@/styles/EmakiNavigation.module.css";
import {
  faAnglesLeft,
  faAnglesRight,
  faCircleQuestion,
  faCommentDots,
  faPlay,
  faStop,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext } from "react";
// import { ArrowRight, ChevronRight } from "react-feather";
import ToggleCharacter from "@/components/emaki/viewer/ToggleCharacter";
import ToggleEbiki from "@/components/emaki/viewer/ToggleEbiki";
import ToggleEkotoba from "@/components/emaki/viewer/ToggleEkotoba";
import ShareButtons from "@/components/emaki/viewer/ShareButtons";
import ActionButton from "@/components/emaki/viewer/ActionButton";
import { AppContext } from "@/context/AppContext";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

// TODO: 横スクロールで最後まで進み、「先頭に戻る」を押しても反応がない
// ⇒navIndexが0になっている
// TODO : アイコンホバー時のtitleを追加・修正する
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
  const { locale } = useRouter();

  const { orientation, openHelpModal, navIndex } = useContext(AppContext);

  const shareTitle =
    locale === "en"
      ? data.titleen || data.title
      : `${data.title ?? ""}${data.edition ? ` ${data.edition}` : ""}`.trim();

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
        label={t("viewer.goToEnd")}
        onClick={() => handleToId(data.type === "西洋絵画" ? 0 : endIndex)}
        description={t("viewer.goToEnd")}
        isUIVisible={isUIVisible}
      />
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
      {/* 教育現場向けUI: 再生/停止ボタン - 状態に応じて切り替え */}
      {/* 再生モード中または初回ナッジ中は停止ボタンを表示 */}
      {(isPlayMode || isAutoScrolling) ? (
        <ActionButton
          icon={
            <FontAwesomeIcon icon={faStop} style={{ fontSize: "1.3em" }} />
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
              <FontAwesomeIcon icon={faPlay} style={{ fontSize: "1.3em" }} />
            }
            label={t("viewer.autoPlay")}
            description={t("viewer.autoPlay")}
            onClick={onStartPlayMode}
            isUIVisible={isUIVisible}
          />
        )
      )}
      <ToggleEkotoba data={data} isUIVisible={isUIVisible} />
      {/* <FullScreen /> */}
      {character && <ToggleCharacter isUIVisible={isUIVisible} />}
      {ebiki && <ToggleEbiki isUIVisible={isUIVisible} />}
      <ShareButtons
        variant="navigation"
        navIndex={navIndex}
        emakiId={data.titleen}
        shareTitle={shareTitle}
        isUIVisible={isUIVisible}
      />
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
