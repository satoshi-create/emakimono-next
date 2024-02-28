import React, { useRef, useEffect, useContext, useState } from "react";

const Component = () => {
  const [h, setH] = useState(0);
  const [code, setCode] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      setH((h) => (h + 1) % 360);
    };

    const handleKeydown = (e) => {
      console.log(e.keyCode);
      setCode(e.keyCode);
    };

    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("pointermove", handler);
    return () => {
      window.removeEventListener("pointermove", handler);
    };
  }, []);

  return (
    <>
      <div
        style={{
          backgroundColor: `hsl(${h}, 100%, 50%)`,
          width: "100px",
          height: "100px",
        }}
      />
      <div>keycode: {code}</div>
      <button>change color</button>
    </>
  );
};



export default Component;
