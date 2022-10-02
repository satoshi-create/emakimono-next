import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../styles/Card.module.css";
import Card from "./Card";

const CardConteiner = ({ emakis }) => {
  // useEffect(() => {
  //   let fliterdEmakis = [...emakis];
  //   const handleInput = (e) => {
  //     console.log(e);
  //     const inputValue = e;
  //     fliterdEmakis = emakis.filter((item) => {
  //       return item.title.toLowerCase().includes(inputValue);
  //     });
  //     // console.log(fliterdEmakis);
  //     return fliterdEmakis;
  //   };
  // }, [emakis]);

  return (
    <>
      <div className="filters-container">
        <form className="input-form">
          <input
            type="text"
            placeholder="search..."
            onChange={(e) => handleInput(e.target.value)}
          />
        </form>
      </div>
      <Test emakis={emakis} />
    </>
  );
};

const Test = ({ emakis }) => {
  if (emakis.length < 1) {
    return <h6>Sorry, no products matched your search</h6>;
  } else {
    return (
      <section className={`section-center ${styles.conteiner}`}>
        {emakis.map((item, index) => {
          return <Card key={index} item={{ ...item }} />;
        })}
      </section>
    );
  }
};

export default CardConteiner;
