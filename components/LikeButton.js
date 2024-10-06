import React, { useState } from 'react'
import postMessage from "../libs/discord"
import {Heart} from "react-feather"
import styles from "../styles/LikeButton.module.css";


const LikeButton = ({title,ort}) => {


  const [isDisplay, setIsDisplay] = useState(false);

  const message = isDisplay ? title + "のいいねが取り消されました" : title + "がいいねされました"

   const postLike = (title) => {
      postMessage(message);
      setIsDisplay(!isDisplay);
    }

  return (
    <>
      <button
        // disabled={isDisplay ? true : false}
        onClick={() => postLike(title)}
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
