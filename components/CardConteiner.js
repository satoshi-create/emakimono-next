import React, { useContext, useEffect, useState } from "react";
import Link from "next/link";
import styles from "../styles/Card.module.css";
import Card from "./Card";
import { AppContext } from "../pages/_app";

const CardConteiner = ({ emakis, columns, needdesc }) => {
  return (
    <section className={styles.conteiner} suppressHydrationWarning={true}>
      {emakis.map((item, index) => {
        return (
          <Card
            key={index}
            item={{ ...item }}
            columns={columns}
            needdesc={needdesc}
          />
        );
      })}
    </section>
  );
};

export default CardConteiner;
