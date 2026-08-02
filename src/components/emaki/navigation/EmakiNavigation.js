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

  // 前後の段（シーン）へ移動するためのターゲット特定。
  // SceneCommentaryBar と同じ「現在の段」特定ロジックを利用する。
  const ekotobas = (data.emakis || []).filter((item) => item.cat === "ekotoba");
  const currentIdx = ekotobas.reduce(
    (acc, item, i) => (item.linkId <= navIndex ? i : acc),
    0
  );
  // 西洋絵画は左→右の読順のため、進行方向を反転する
  const isLtr = data.type === "西洋絵画";
  const nextScene = ekotobas[currentIdx + (isLtr ? -1 : 1)];
  const prevScene = ekotobas[currentIdx + (isLtr ? 1 : -1)];

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
      {/* 次へ進む（前の段へ）: 末尾到達時は非表示 */}
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
      {character && <ToggleCharacter isUIVisible={isUIVisible} />}
      {ebiki && <ToggleEbiki isUIVisible={isUIVisible} />}
      <ShareButtons
        variant="menu"
        navIndex={navIndex}
        emakiId={data.titleen}
        shareTitle={shareTitle}
        isUIVisible={isUIVisible}
      />
      {/* 前に戻る（次の段へ）: 先頭到達時は非表示 */}
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
