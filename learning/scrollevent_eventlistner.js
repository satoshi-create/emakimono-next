import React, { useRef, useEffect, useState } from "react";

const Scrollevent = () => {
  const [toggle, setToggle] = useState(true);
  const containerRef = useRef(null);
  const scrollNextRef = useRef(null);
  const scrollPrevRef = useRef(null);

  useEffect(() => {
    const con = containerRef.current;
    const btnPrev = scrollPrevRef.current;
    const btnNext = scrollNextRef.current;
    console.log(con);

    const scrollNextEvent = () => {
      if (con) {
        con.scrollTo({
          left: con.scrollLeft - 100,
          behavior: "smooth",
        });
      }
    };

    const scrollPrevEvent = () => {
      if (con) {
        con.scrollTo({
          left: con.scrollLeft + 100,
          behavior: "smooth",
        });
      }
    };

    if (btnPrev) {
      btnPrev.addEventListener("click", scrollPrevEvent);
    }
    if (btnNext) {
      btnNext.addEventListener("click", scrollNextEvent);
    }

    return () => {
      if (btnPrev) {
        btnNext.removeEventListener("click", scrollNextEvent);
      }
      if (btnNext) {
        btnNext.removeEventListener("click", scrollNextEvent);
      }
    };
  }, []);

  // el.scrollLeft = scrollL;
  // const handleScrollX = () => (el.scrollLeft += 20);

  return (
    <section
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <button onClick={() => setToggle(!toggle)}>{`${
        toggle ? "row" : "row-reverse"
      }`}</button>
      <div
        id="container"
        style={{
          width: "500px",
          height: "300px",
          border: "1px solid #ccc",
          overflowX: "scroll",
          display: "flex",
          flexDirection: toggle ? "row" : "row-reverse",
        }}
        ref={containerRef}
      >
        {/* <div style={{ width: "5000px", backgroundColor: "#ccc" }}>
          ボタンをクリックすると右へスライドします。
        </div> */}
        {itemList.map((item, i) => (
          <div className={item} key={i}>
            {`${toggle ? "左から右へ" : "右から左へ"}`}
          </div>
        ))}
      </div>
      <Navigation scrollNextRef={scrollNextRef} scrollPrevRef={scrollPrevRef} />
    </section>
  );
};

const Navigation = ({ scrollNextRef, scrollPrevRef }) => {
  return (
    <div>
      <button id="slide" type="button" ref={scrollNextRef}>
        next
      </button>
      <button id="slide" type="button" ref={scrollPrevRef}>
        prev
      </button>
    </div>
  );
};

const itemList = [];
for (let i = 0; i < 100; i++) {
  itemList.push("tile");
}

export default Scrollevent;
