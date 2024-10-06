import React, { useState } from 'react'
import postMessage from "../libs/discord"
import {Heart} from "react-feather"
import styles from "../styles/LikeButton.module.css";


const LikeButton = ({title,edition,author, ort}) => {


  const [isDisplay, setIsDisplay] = useState(false);

  const message = isDisplay
    ? `${title == undefined ? "" : title}` +
      "（" +
      `${edition == undefined ? "" : edition}` +
      `${author == undefined ? "" : author}` +
      "）" +
      "のいいねが取り消されました"
    : `${title == undefined ? "" : title}` +
      "（" +
      `${edition == undefined ? "" : edition}` +
      `${author == undefined ? "" : author}` +
      "）" +
      "がいいねされました";

   const postLike = () => {
      postMessage(message);
      setIsDisplay(!isDisplay);
    }

  return (
    <>
      <button
        // disabled={isDisplay ? true : false}
        onClick={() => postLike()}
        className={`${ort === "land" ? styles.land : styles.prt}`}
      >
        <Heart className={`${styles.icon} ${isDisplay && styles.activeicon}`} />
      </button>
      {/* <span style={{ display: isDisplay ? "" : "none" }}>
        {" "}
        {"<"} thank you !{" "}
      </span> */}
    </>
  );
}

export default LikeButton


// import { useState } from "react";
// import { postMessage } from "../lib/discord";

// export function IineButton({ title }: { title: string }) {
//   const [isDisplay, setIsDisplay] = useState(false);

//   function postIine(title: string) {
//     postMessage(title);
//     toggleDisplay();
//   }

//   function toggleDisplay() {
//     setIsDisplay(!isDisplay);
//   }

//   return (
//     <>
//       <button
//         disabled={isDisplay ? true : false}
//         onClick={() => postIine(title)}
//       >
//         👍
//       </button>
//       <span style={{ display: isDisplay ? "" : "none" }}>
//         {" "}
//         {"<"} thank you !{" "}
//       </span>
//     </>
//   );
// }
