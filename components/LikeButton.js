import React, { useState } from 'react'
import postMessage from "../libs/discord"
import {Heart} from "react-feather"
import styles from "../styles/LikeButton.module.css";


const LikeButton = ({title,edition,author, ort}) => {
  const [isDisplay, setIsDisplay] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false); // アニメーション状態を管理


  const message =
    isDisplay &&
    `${title == undefined ? "" : title}` +
      "（" +
      `${edition == undefined ? "" : edition}` +
      `${author == undefined ? "" : author}` +
      "）" +
      "がいいねされました";

  //  const postLike = () => {
  //     postMessage(message);
  //     setIsDisplay(true);
  //   }

  const postLike = () => {
    if (!hasAnimated) {
      // アニメーションがまだ実行されていない場合
      postMessage(message);
      setIsDisplay(true);
      setHasAnimated(true); // アニメーションが実行されたことを記録
    }
  };

  const handleAnimationEnd = () => {
    setIsDisplay(false); // アニメーション終了後に非表示にリセット
  };

  return (
    <>
      <button
        onClick={() => postLike()}
        className={`${ort === "land" ? styles.land : styles.prt}`}
      >
        <Heart
          className={`${styles.icon} ${isDisplay && styles.activeicon} ${hasAnimated && styles.heartclr}`}
          // アニメーション終了時の処理を追加 ]
          onAnimationEnd={handleAnimationEnd}
        />
      </button>
    </>
  );
}

export default LikeButton
