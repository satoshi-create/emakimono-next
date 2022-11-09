import React, { useContext, useEffect, useState } from "react";
import Link from "next/link";
import styles from "../styles/Card.module.css";
import Card from "./Card";
import { AppContext } from "../pages/_app";
import CardConteiner from "./CardConteiner";
import Title from "./Title";
import Button from "./Button";

const SortType = ({ emakis }) => {
  const button = { textAlign: "center", marginBottom: "3rem" };

  const favoriteEmakis = emakis.filter((emaki) => emaki.favorite === true);
  console.log(favoriteEmakis);
  const typeByoubu = emakis
    .filter((emaki) => emaki.type === "屏風")
    .splice(0, 1);
  const typeUkiyoe = emakis
    .filter((emaki) => emaki.type === "浮世絵")
    .splice(0, 1);
  const typeSuibokuga = emakis
    .filter((emaki) => emaki.type === "水墨画")
    .splice(0, 1);
  const typeSeiyoukaiga = emakis
    .filter((emaki) => emaki.type === "西洋絵画")
    .splice(0, 1);

  const allTypes = [
    {
      type: "おすすめの絵巻",
      typeen: "emaki",
      data: favoriteEmakis,
    },
    {
      type: "屏風",
      typeen: "byoubu",
      data: typeByoubu,
    },
    {
      type: "水墨画",
      typeen: "suibokuga",
      data: typeSuibokuga,
    },
    {
      type: "浮世絵",
      typeen: "ukiyoe",
      data: typeUkiyoe,
    },
    {
      type: "西洋絵画",
      typeen: "seiyoukaiga",
      data: typeSeiyoukaiga,
    },
  ];

  // const shuffle = ([...array]) => {
  //   for (let i = array.length - 1; i >= 0; i--) {
  //     const j = Math.floor(Math.random() * (i + 1));
  //     [array[i], array[j]] = [array[j], array[i]];
  //   }
  //   return array;
  // };

  return (
    <section className={"section-center"}>
      {allTypes.map((item, index) => {
        const { type, typeen, data } = item;
        if (type === "おすすめの絵巻") {
          return (
            <>
              <Title pagetitle={type} />
              <CardConteiner emakis={data} columns={"three"} />
              <div style={button}>
                <Button
                  value={{
                    style: "emakibtn",
                    title: `全ての絵巻を見る`,
                    path: `/category/${typeen}`,
                  }}
                />
              </div>
            </>
          );
        }
      })}
      <Title pagetitle={"＋アルファ"} />
      <section className={styles.plus}>
        {allTypes.map((item, index) => {
          const { type, typeen, data } = item;
          if (type !== "おすすめの絵巻") {
            return (
              <div
                key={index}
                className={`${styles.pluscontainter} ${styles["four"]}`}
              >
                <h4>{type}</h4>
                {data.map((item, index) => {
                  return <Card key={index} item={{ ...item }} />;
                })}
                <div style={button}>
                  <Button
                    value={{
                      style: "plusbtn",
                      title: `全ての${type}を見る`,
                      path: `/category/${typeen}`,
                    }}
                  />
                </div>
              </div>
            );
          }
        })}
      </section>
    </section>
  );
};

export default SortType;
