import React from "react";
import styles from "../styles/EmakiHeader.module.css";
import Translate from "../components/Translate";
import EmakiInfo from "../components/EmakiInfo";
const EmakiHeader = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <EmakiInfo value={emakis} />
        <Controller value={emakis} />
        <Sidebar value={emakis} />
      </div>
    </header>
  );
};

export default EmakiHeader;
