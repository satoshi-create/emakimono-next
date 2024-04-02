import React, { useContext } from "react";
import { AppContext } from "../pages/_app";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaintBrush,
  faKeyboard,
  faCommentSlash,
  faComment,
} from "@fortawesome/free-solid-svg-icons";
import styled from "../styles/ToggleEkotoba.module.css";

const ToggleEkotoba = ({ data }) => {
  const { emakis, kotobagaki } = data;

  // 詞書があるケース
  const withEkotoba = (v) => (v ? "現代語訳を読む" : "詞書を読む");
  const withEkotobaIcon = (v) =>
    v ? (
      <FontAwesomeIcon icon={faKeyboard} />
    ) : (
      <FontAwesomeIcon icon={faPaintBrush} />
    );
  // 詞書がないケース
  const withoutEkotoba = (v) => (v ? "目次を開く" : "目次を閉じる");
  const withoutEkotobaIcon = (v) =>
    v ? (
      <FontAwesomeIcon icon={faComment} />
    ) : (
      <FontAwesomeIcon icon={faCommentSlash} />
    );

  return (
    <button
      className={styled.button}
      title={
        kotobagaki
          ? withEkotoba(ekotobaImageToggle)
          : withoutEkotoba(ekotobaImageToggle)
      }
      onClick={handleEkotobaImageToggle}
    >
      <i
        style={{
          fontSize: `${orientation === "portrait" ? "14px" : "20px"}`,
        }}
      >
        {kotobagaki
          ? withEkotobaIcon(ekotobaImageToggle)
          : withoutEkotobaIcon(ekotobaImageToggle)}
      </i>
    </button>
  );
};

export default ToggleEkotoba;
