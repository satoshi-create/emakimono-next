import React, { useCallback, useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import $ from "jquery";

const SmoothScrolling = () => {
  const ref = useRef();

  // if (location.hash) {
  //   el.scrollTo(0, 0);
  //   setTimeout(() => {
  //     let target = location.hash;
  //     let position = target.offsetTop;
  //     console.log(position);
  //   }, 100);
  // }

  useState(() => {
    const hash = window.location.hash;
    const el = document.documentElement;
    if (hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    //   setTimeout(() => {
    //     let target = $(hash);
    //     let position = target.offset().top;
    //     console.log(position);
    //     $("body,html").stop().animate({ scrollTop: position }, 500);
    //   }, 10000);
    // }
  }, []);

  // const scrollTop = useCallback(() => {
  //   window.scroll({
  //     top: 0,
  //     behavior: "smooth",
  //   });
  // }, []);

  // useEffect(() => {
  //   const el = document.documentElement;
  //   const hash = window.location.hash;
  //   console.log(hash);
  //   if (hash) {
  //     scrollTop();
  //   }
  // }, []);

  return (
    <>
      <div ref={ref}>
        {/* sec1 */}
        {itemList.map((item, i) => (
          <div className={item} key={i} id={i}>
            {itemList.map((item, i) => (
              <div className={item} key={i}>
                あおによし
              </div>
            ))}
          </div>
        ))}
      </div>
      <div>{/* sec1 */}</div>
    </>
  );
};

const itemList = [];
for (let i = 0; i < 100; i++) {
  itemList.push("tile");
}

export default SmoothScrolling;
