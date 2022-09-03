import React, { useState } from "react";
import Link from "next/link";
import styles from "../styles/Card.module.css";
import Card from "./Card";

const CardConteiner = ({emakis}) => {
  return (
    <section className={`section-center ${styles.conteiner}`}>
      {emakis.map((item, index) => {
        return <Card key={index} item={{ ...item }} />;
      })}
    </section>
  );
};

export default CardConteiner;
