import React, { useEffect, useState } from "react";
import ExtractingListData from "../libs/ExtractingListData";
import SingleCardA from "./SingleCardA";
import styles from "../styles/CardA.module.css";

const Ranking = ({num}) => {
  const removeNestedArrayObj = ExtractingListData();

  const [data, setData] = useState();

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/fetchData`);
      const data = await res.json();
      const slicedata = data.slice(0,30);
      const encodeURL = slicedata.map((item, i) => {
        const pathName = item.pagePath.replace("/", "");
        return { pathName: pathName, pageView: item.uniquePageviews };
      });
      setData(encodeURL);
    }
    fetchData();
  }, []);

  return (
    <section className={"section-grid section-padding"}>
      <div className={styles["three"]}>
        {data?.slice(0,num).map((item, i) => {
          const { pathName, pageView } = item;
          const connectData = removeNestedArrayObj.filter(
            (item) => item.titleen === pathName
          );
          if (connectData.length) {
                  console.log(connectData);
            return (
              <>
                {connectData.map((item, i) => {
                  return (
                    <SingleCardA
                      item={item}
                      // sectiontitle={sectiontitle}
                      // columns={columns}
                      // needdesc={needdesc}
                      key={i}
                    />
                  );
                })}
              </>
            );
          }
        })}
      </div>
    </section>
  );
};

export default Ranking;
