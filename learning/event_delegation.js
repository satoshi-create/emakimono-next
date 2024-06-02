import React, { useState } from "react";

const EventDelegation = () => {
  const [bg, setbg] = useState("");

  function random(number) {
    return Math.floor(Math.random() * number);
  }

  // function bgChange() {
  //   const rndCol = `rgb(${random(255)} ${random(255)} ${random(255)})`;
  //   return rndCol;
  // }

  const handleBgChange = (e) => {
    // e.target.style.backgroundColor = bgChange();
    console.log(e.target);
    const rndCol = `rgb(${random(255)} ${random(255)} ${random(255)})`;
    setbg(rndCol);
  };

  return (
    <div id="container" onClick={(e) => handleBgChange(e)}>
      {itemList.map((item, i) => (
        <div
          className={item}
          key={i}
          style={{
            height: "100px",
            width: "25%",
            float: "left",
            backgroundColor: `${bg}`,
          }}
        >
          tile
        </div>
      ))}
    </div>
  );
};

export default EventDelegation;

const itemList = [];
for (let i = 0; i < 12; i++) {
  itemList.push("tile");
}
