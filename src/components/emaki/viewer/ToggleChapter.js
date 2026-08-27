import ActionButton from "@/components/emaki/viewer/ActionButton";
import { AppContext } from "@/context/AppContext";
import { faEyeSlash, faHeading } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext } from "react";
import { useTranslation } from "next-i18next";

const ToggleChapter = ({ isUIVisible = true }) => {
  const { handleChapterToggle, chapterToggle } = useContext(AppContext);
  const { t } = useTranslation("common");

  const description = chapterToggle
    ? t("viewer.hideChapterTitles")
    : t("viewer.showChapterTitles");

  return (
    <ActionButton
      icon={
        chapterToggle ? (
          <FontAwesomeIcon icon={faEyeSlash} style={{ fontSize: "1.5em" }} />
        ) : (
          <FontAwesomeIcon icon={faHeading} style={{ fontSize: "1.5em" }} />
        )
      }
      label={description}
      description={description}
      onClick={handleChapterToggle}
      isUIVisible={isUIVisible}
      // 非表示中だけアクセント（初期 true＝表示中は白。常時赤にならない）
      isOn={!chapterToggle}
    />
  );
};

export default ToggleChapter;
