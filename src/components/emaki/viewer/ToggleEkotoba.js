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

const ToggleEkotoba = ({ data }) => {
  const { kotobagaki } = data;
  const { ekotobaImageToggle, orientation, handleEkotobaImageToggle } =
    useContext(AppContext);

  // 詞書があるケース
  const withEkotoba = (v) => (v ? "現代語訳を読む" : "詞書を読む");
  const withEkotobaIcon = (v) =>
    v ? (
      <FontAwesomeIcon icon={faKeyboard} style={{ fontSize: "1.5em" }} />
    ) : (
      <FontAwesomeIcon icon={faPaintBrush} style={{ fontSize: "1.5em" }} />
    );
  // 詞書がないケース
  const withoutEkotoba = (v) => (v ? "目次を開く" : "目次を閉じる");
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
