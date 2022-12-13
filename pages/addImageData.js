import React from "react";
import dataEmakis from "../libs/dataEmakis";
import dataSeiyoukaiga from "../libs/dataSeiyoukaiga";
import dataUkiyoes from "../libs/dataUkiyoes";
import dataSuibokuga from "../libs/dataSuibokuga";
import dataByoubus from "../libs/dataByoubus";
import FullScreenComp from "../components/FullScreenComp";

const isClient = () => typeof window !== "undefined";

if (isClient()) {
  const addImagesrc = (data) => {
    const emakiData = data
      .flatMap((item) => item.emakis)
      .map((item, i) => {
        return { ...item, id: i };
      });

    const ekotobaData = emakiData.filter(
      (item, i) => item.cat === "ekotoba" && !item.src
    );
    const createImageElement = (path) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.src = path;
        }, 1000);
      });
    };

    const arr = [];
    emakiData.map((item, i) => {
      const { src } = item;
      createImageElement(src).then((res) => {
        const newObj = { ...item, srcWidth: res.width, srcHeight: 1080 };
        arr.push(newObj);
        const newArr = Array.from(arr)
          .concat(ekotobaData)
          .sort((a, b) => {
            return a.id - b.id;
          });
        const setNewArr = [...new Set(newArr)];
        console.log(setNewArr);
      });
    });
  };
  addImagesrc(dataByoubus);
}

const addImageData = () => {
  return (
    <>
      <FullScreenComp>
        <img src="./cyoujyuu_yamazaki_kou_thumb.webp" className="img"/>
      </FullScreenComp>
    </>
  );
};

export default addImageData;
