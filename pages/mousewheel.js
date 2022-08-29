import React, { useRef, useEffect } from "react";
import styles from "../styles/mousewheel.module.css";

const Mousewheel = () => {
  const scrollRef = useRef();

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      const wheelListener = (e) => {
        e.preventDefault();
        el.scrollTo({
          left: el.scrollLeft + e.deltaY * 5,
          behavior: "smooth",
        });
      };
      el.addEventListener("wheel", wheelListener);
      return () => el.removeEventListener("wheel", wheelListener);
    }
  }, []);

  return (
    <div ref={scrollRef} className={styles.conteiner}>
      <div className={styles.card}>
        <img src="/cyoujyuu_yamazaki_kou_01-1080.webp" alt="" />
      </div>
      <div className={styles.card}>
        <img src="/cyoujyuu_yamazaki_kou_02-1080.webp" alt="" />
      </div>
      <div className={styles.card}>
        <img src="/cyoujyuu_yamazaki_kou_03-1080.webp" alt="" />
      </div>
    </div>
  );
};

export default Mousewheel;
