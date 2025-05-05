import dataEmakis from "@/libs/json-data/dataEmakis.json";
import { useEffect } from "react";

const AddImageData = () => {
  // const [data, setData] = useState([]);
  // console.log(data);
  useEffect(() => {
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
        const { srcTb } = item;
        createImageElement(srcTb).then((res) => {
          const newObj = {
            ...item,
            srcTbWidth: res.width,
            srcTbHeight: 800,
          };
          arr.push(newObj);
          const newArr = Array.from(arr)
            .concat(ekotobaData)
            .sort((a, b) => {
              return a.id - b.id;
            });
          const setNewArr = [...new Set(newArr)];
          // console.log(setNewArr);
        });
      });
    };
    addImagesrc(dataEmakis);
  }, []);
};

export default AddImageData;
