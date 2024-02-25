import React from "react";
import styles from "../styles/EmakiCursel.module.css";

const EmakiCursel = ({ data, scrollToId }) => {
  console.log(data.emakis.length - 1);

  const emakis = data.emakis;
  const emakisLength = emakis.length - 1;

  return (
    <aside className={styles.container}>
      <div
        onClick={() => scrollToId(emakisLength)}
        style={{ cursor: "pointer" }}
      >
        go to end
      </div>
      <div style={{ cursor: "pointer" }}>next</div>
      <div style={{ cursor: "pointer" }}>prev</div>
    </aside>
  );
};

export default EmakiCursel;
