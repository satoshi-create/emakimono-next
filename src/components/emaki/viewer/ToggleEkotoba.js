import ActionButton from "@/components/emaki/viewer/ActionButton";
import { AppContext } from "@/context/AppContext";
import {
  faKeyboard,
  faPaintBrush,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext } from "react";
import { useTranslation } from "next-i18next";

// 詞書がある絵巻のみ表示（詞書の現代語訳⇄古典文の切替）。
// 詞書の無い絵巻の目次移動は SceneCommentaryBar の段一覧（faList）が担う
const ToggleEkotoba = ({ data, isUIVisible = true }) => {
  const { kotobagaki } = data;
  const { ekotobaImageToggle, handleEkotobaImageToggle } =
    useContext(AppContext);
  const { t } = useTranslation("common");

  if (!kotobagaki) return null;

  const description = ekotobaImageToggle
    ? t("viewer.readModernTranslation")
    : t("viewer.readClassicalText");

  return (
    <ActionButton
      icon={
        ekotobaImageToggle ? (
          <FontAwesomeIcon icon={faKeyboard} style={{ fontSize: "1.5em" }} />
        ) : (
          <FontAwesomeIcon icon={faPaintBrush} style={{ fontSize: "1.5em" }} />
        )
      }
      label={description}
      description={description}
      onClick={handleEkotobaImageToggle}
      isUIVisible={isUIVisible}
      isOn={ekotobaImageToggle}
    />
  );
};

export default ToggleEkotoba;
