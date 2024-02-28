import React, { useRef, useEffect, useState } from "react";

const Scrollevent = () => {
  const containerRef = useRef(null);
  const scrollNextRef = useRef(null);
  const scrollPrevRef = useRef(null);

  const con = containerRef.current;
  const btnPrev = scrollPrevRef.current;
  const btnNext = scrollNextRef.current;

  useEffect(() => {
    console.log(con);

    const scrollPrevEvent = () => {
      con.scrollTo({
        left: con.scrollLeft + 30,
        behavior: "smooth",
      });
    };
    const scrollNextEvent = () => {
      con.scrollTo({
        left: con.scrollLeft - 30,
        behavior: "smooth",
      });
    };

    btnPrev.addEventListener("click", scrollPrevEvent);
    btnNext.addEventListener("click", scrollNextEvent);

    return () => {
      btnNext.removeEventListener("click", scrollNextEvent);
      btnNext.removeEventListener("click", scrollNextEvent);
    };
  }, []);

  // el.scrollLeft = scrollL;
  // const handleScrollX = () => (el.scrollLeft += 20);

  return (
    <>
      <div
        id="container"
        style={{
          width: "300px",
          height: "300px",
          border: "1px solid #ccc",
          overflowX: "scroll",
          display: "flex",
          flexDirection: "row-reverse",
        }}
        ref={containerRef}
      >
        {/* <div style={{ width: "5000px", backgroundColor: "#ccc" }}>
          ボタンをクリックすると右へスライドします。
        </div> */}
        {itemList.map((item, i) => (
          <div className={item} key={i}>
            いとおかし
          </div>
        ))}
      </div>
      <Navigation scrollNextRef={scrollNextRef} scrollPrevRef={scrollPrevRef} />
    </>
  );
};

const Navigation = ({ scrollNextRef, scrollPrevRef }) => {
  return (
    <>
      <button id="slide" type="button" ref={scrollNextRef}>
        next
      </button>
      <button id="slide" type="button" ref={scrollPrevRef}>
        prev
      </button>
    </>
  );
};

const itemList = [];
for (let i = 0; i < 30; i++) {
  itemList.push("tile");
}

export default Scrollevent;
