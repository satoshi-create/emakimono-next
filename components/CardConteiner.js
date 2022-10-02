import React, { useContext } from "react";
import Link from "next/link";
import styles from "../styles/Card.module.css";
import Card from "./Card";
import { AppContext } from "../pages/_app";

const CardConteiner = ({ emakis }) => {
  const { query } = useContext(AppContext);

  const fliterdEmakis = emakis.filter((item) => {
    return item.title.toLowerCase().includes(query);
  });

  if (fliterdEmakis.length < 1) {
    return <h6>Sorry, no products matched your search</h6>;
  } else {
    return (
      <section className={`section-center ${styles.conteiner}`}>
        {fliterdEmakis.map((item, index) => {
          return <Card key={index} item={{ ...item }} />;
        })}
      </section>
    );
  }
};

export default CardConteiner;
