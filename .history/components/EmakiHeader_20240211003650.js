import React from "react";
import styles from "../styles/EmakiHeader.module.css";

const EmakiHeader = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* <EmakiInfo value={emakis} />
        <Controller value={emakis} />
        <Sidebar value={emakis} /> */}
      </div>
    </header>
  );
};

export default EmakiHeader;
