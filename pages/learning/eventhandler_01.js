// 例: クリックイベントの扱い;
//https: developer.mozilla.org/ja/docs/Learn/JavaScript/Building_blocks/Events
import React, { useState } from "react";

const Eventhandler_01 = () => {
  const [bg, setbg] = useState("");
  function random(number) {
    return Math.floor(Math.random() * (number + 1));
  }
  const handlBgStyle = (e) => {
    const rndCol = `rgb(${random(255)}, ${random(255)}, ${random(255)})`;
    setbg(rndCol);
    console.log(e.key);
  };
  return (
    <>
      <button
        style={{ background: `${bg ? bg : "white"}` }}
        onKeyDown={handlBgStyle}
      >
        eventhandler_01
      </button>
      {/* <button onMouseDown={(e) => console.log("onMouseDown (first button)")}>
        onMouseDown
      </button> */}
    </>
  );
};

export default Eventhandler_01;

// JS
// const btn = document.querySelector("button");

// function random(number) {
//   return Math.floor(Math.random() * (number + 1));
// }

// btn.addEventListener("click", () => {
//   const rndCol = `rgb(${random(255)}, ${random(255)}, ${random(255)})`;
//   document.body.style.backgroundColor = rndCol;
// });
