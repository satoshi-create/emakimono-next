import React, { useRef, useState, useEffect } from "react";

const Scrollevent_02 = () => {
  const ref = useRef(null);
  const [el, setEl] = useState();

  const handleScrollX = () => {
    if (el) {
      console.log(el.scrollLeft);

      el.scrollTo({
        left: el.scrollLeft + 50,
        behavior: "smooth",
      });
    }
  };

  
  useEffect(() => {
    const el = ref.current;
    setEl(el);
  }, []);

  return (
    <>
      <div
        id="container"
        style={{
          width: "300px",
          height: "300px",
          border: "1px solid #ccc",
          overflowX: "scroll",
        }}
        ref={ref}
      >
        <div id="content" style={{ width: "1000px" }}>
          ボタンをクリックすると右へスライドします。
        </div>
      </div>

      <button id="slide" type="button" onClick={handleScrollX}>
        右へスライド
      </button>
    </>
  );
};

export default Scrollevent_02;
