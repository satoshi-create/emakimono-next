import React from "react";
import styles from "../styles/Card.module.css";
import Card from "./Card";
// import CardConteiner from "./CardConteiner";
import Title from "../Title";

const SortType = ({ emakis }) => {
  const favoriteEmakis = emakis.filter((emaki) => emaki.favorite === true);
  const setsuwaEmakis = emakis.filter((emaki) => emaki.subtype === "説話");
  const kousoudenEmakis = emakis.filter((emaki) => emaki.subtype === "高僧伝");
  const buttenEmakis = emakis.filter((emaki) => emaki.subtype === "仏典");
  const gyouziEmakis = emakis.filter(
    (emaki) => emaki.subtype === "諸行事・祭礼"
  );

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

  const variationEmakis = [
    {
      subtype: "説話",
      data: setsuwaEmakis,
    },
    {
      subtype: "高僧伝",
      data: kousoudenEmakis,
    },
    {
      subtype: "仏典",
      data: buttenEmakis,
    },
    {
      subtype: "諸行事・祭礼",
      data: gyouziEmakis,
    },
  ];

  const allTypes = [
    {
      type: "三大絵巻",
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

  return (
    <>
      {/* <section className={"section-center"}>
        <Title pagetitle={"三大絵巻"} />
        {allTypes.map((item, index) => {
          const { type, typeen, data } = item;
          if (type === "三大絵巻") {
            return (
              <>
                <CardConteiner
                  emakis={data}
                  columns={"three"}
                  needdesc={true}
                />
                <div>
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
      </section> */}
      <section className={styles.variation}>
        <div className={styles.variationContainter}>
          <Title pagetitle={"さまざまな絵巻"} />
          <div className={styles.plus}>
            {variationEmakis.map((item, index) => {
              const { subtype, data } = item;
              return (
                <div
                  key={index}
                  className={`${styles.pluscontainter} ${styles["four"]}`}
                >
                  <h4>{`${subtype}絵巻`}</h4>
                  {data.map((item, index) => {
                    return (
                      <Card key={index} item={{ ...item }} needdesc={true} />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* <GridImages /> */}
      <section className="section-center">
        <Title pagetitle={"＋アルファ"} />
        <div className={styles.plus}>
          {allTypes.map((item, index) => {
            const { type, typeen, data } = item;
            if (type !== "三大絵巻") {
              return (
                <div
                  key={index}
                  className={`${styles.pluscontainter} ${styles["four"]}`}
                >
                  <h4>{type}</h4>
                  {data.map((item, index) => {
                    return (
                      <Card key={index} item={{ ...item }} needdesc={false} />
                    );
                  })}
                  {/* <div className={styles.btnbox}>
                      <Button
                        value={{
                          style: "plusbtn",
                          title: `全ての${type}を見る`,
                          path: `/category/${typeen}`,
                        }}
                      />
                    </div> */}
                </div>
              );
            }
          })}
        </div>
      </section>
    </>
  );
};

export default SortType;
