import React, { useContext, useEffect, useState } from "react";
import Link from "next/link";
import styles from "../styles/Card.module.css";
import Card from "./Card";
import { AppContext } from "../pages/_app";

const CardConteiner = ({ emakis }) => {
  return (
    <section
      className={`section-center ${styles.conteiner}`}
      suppressHydrationWarning={true}
    >
      {emakis.map((item, index) => {
        return <Card key={index} item={{ ...item }} />;
      })}
    </section>
  );
};

export default CardConteiner;
