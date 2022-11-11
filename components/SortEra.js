import React, { useContext, useEffect, useState } from "react";
import Link from "next/link";
import styles from "../styles/Card.module.css";
import Card from "./Card";
import { AppContext } from "../pages/_app";

const SortEra = ({ emakis, columns }) => {
  const { query, setQuery, setfliterdEmakis, fliterdEmakis } =
    useContext(AppContext);

  const eraTab = ["全て", ...new Set(emakis.map((item) => item.era))];

  const fetchEmakis = (q) => {
    const serchEmakis = emakis.filter((item) => {
      const title = item.title.includes(q);
      const titleen = item.titleen.includes(q);
      const author = item.author.includes(q);
      return title || titleen || author;
    });
    setfliterdEmakis(serchEmakis);
  };

  useEffect(() => {
    fetchEmakis(query);
  }, [query]);

  const handleClick = (e) => {
    const el = e.target;

    console.log(el);

    if (el.dataset.id === "全て") {
      setfliterdEmakis(emakis);
    } else {
      const newEmakis = emakis.filter((item) => {
        return item.era === el.dataset.id;
      });
      setfliterdEmakis(newEmakis);
    }
    setQuery("");
  };

  if (fliterdEmakis.length < 1) {
    return <h6>Sorry, no products matched your search</h6>;
  } else {
    return (
      <>
        <div className={`section-center ${styles.eraTab}`}>
          {eraTab.map((item, index) => {
            return (
              <button
                className={styles.eraTabBtn}
                key={index}
                data-id={item}
                onClick={(e) => handleClick(e)}
              >
                {item}
              </button>
            );
          })}
        </div>
        <Card emakis={fliterdEmakis} columns={columns} />
      </>
    );
  }
};

export default SortEra;
