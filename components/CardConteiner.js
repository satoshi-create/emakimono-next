import React, { useContext, useEffect } from "react";
import Link from "next/link";
import styles from "../styles/Card.module.css";
import Card from "./Card";
import { AppContext } from "../pages/_app";

const CardConteiner = ({ emakis }) => {
  const { query, setQuery } = useContext(AppContext);

  const fliterdEmakis = emakis.filter((item) => {
    const title = item.title.includes(query);
    const titleen = item.titleen.includes(query);
    const author = item.author.includes(query);
    const era = item.era.includes(query);
    console.log(title || titleen || author);
    return title || titleen || author;
  });

  useEffect(() => {
    setQuery("");
  }, []);

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
