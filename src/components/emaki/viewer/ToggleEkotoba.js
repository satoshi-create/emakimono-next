import ActionButton from "@/components/emaki/viewer/ActionButton";
import { AppContext } from "@/pages/_app";
import {
  faComment,
  faCommentSlash,
  faKeyboard,
  faPaintBrush,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext } from "react";
import { useTranslation } from "next-i18next";

const ToggleEkotoba = ({ data, isUIVisible = true }) => {
  const { kotobagaki } = data;
  const { ekotobaImageToggle, orientation, handleEkotobaImageToggle } =
    useContext(AppContext);
  const { t } = useTranslation("common");

  // 詞書があるケース
  const withEkotoba = (v) =>
    v ? t("viewer.readModernTranslation") : t("viewer.readClassicalText");
  const withEkotobaIcon = (v) =>
    v ? (
      <FontAwesomeIcon icon={faKeyboard} style={{ fontSize: "1.5em" }} />
    ) : (
      <FontAwesomeIcon icon={faPaintBrush} style={{ fontSize: "1.5em" }} />
    );
  // 詞書がないケース
  const withoutEkotoba = (v) =>
    v ? t("viewer.openTableOfContents") : t("viewer.closeTableOfContents");
  const withoutEkotobaIcon = (v) =>
    v ? (
      <FontAwesomeIcon icon={faComment} style={{ fontSize: "1.5em" }} />
    ) : (
      <FontAwesomeIcon icon={faCommentSlash} style={{ fontSize: "1.5em" }} />
    );

  return (
    <ActionButton
      icon={
        kotobagaki
          ? withEkotobaIcon(ekotobaImageToggle)
          : withoutEkotobaIcon(ekotobaImageToggle)
      }
      label={
        kotobagaki
          ? withEkotoba(ekotobaImageToggle)
          : withoutEkotoba(ekotobaImageToggle)
      }
      description={
        kotobagaki
          ? withEkotoba(ekotobaImageToggle)
          : withoutEkotoba(ekotobaImageToggle)
      }
      onClick={handleEkotobaImageToggle}
      isUIVisible={isUIVisible}
    />
    // <button
    //   className={styled.button}
    //   title={
    //     kotobagaki
    //       ? withEkotoba(ekotobaImageToggle)
    //       : withoutEkotoba(ekotobaImageToggle)
    //   }
    //   onClick={handleEkotobaImageToggle}
    // >
    //   <i
    //     style={{
    //       fontSize: `${orientation === "portrait" ? "14px" : "20px"}`,
    //     }}
    //   >
    //     {kotobagaki
    //       ? withEkotobaIcon(ekotobaImageToggle)
    //       : withoutEkotobaIcon(ekotobaImageToggle)}
    //   </i>
    // </button>
  );
};

export default ToggleEkotoba;
