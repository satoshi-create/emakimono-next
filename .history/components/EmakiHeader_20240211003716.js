import React from "react";
import styles from "../styles/EmakiHeader.module.css";
import Translate from "../components/Translate";
import EmakiInfo from "../components/EmakiInfo";
import Sidebar from "../components/Sidebar";
import Head from "../components/Meta";
import Controller from "../components/Controller";
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
