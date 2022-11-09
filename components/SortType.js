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

  const allTypes = [
    {
      type: "絵巻",
      typeen: "emaki",
    },
    {
      type: "屏風",
      typeen: "byoubu",
    },
    {
      type: "水墨画",
      typeen: "suibokuga",
    },
    {
      type: "浮世絵",
      typeen: "ukiyoe",
    },
    {
      type: "西洋絵画",
      typeen: "seiyoukaiga",
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
        const { type, typeen } = item;
        return (
          <>
            <Title pagetitle={type} />
            <CardConteiner
              emakis={emakis
                .filter((emaki) => emaki.type === type)
                .splice(0, 3)}
            />
            <div style={button}>
              <Button
                value={{
                  style: styles.herobtn,
                  title: `全ての${type}を見る`,
                  path: `/category/${typeen}`,
                }}
              />
            </div>
          </>
        );
      })}
    </section>
  );
};

export default SortType;
