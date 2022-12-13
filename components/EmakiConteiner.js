import React, {
  useRef,
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import "lazysizes";
// import "lazysizes/plugins/attrchange/ls.attrchange";
import EmakiImage from "./EmakiImage";
import Ekotoba from "./Ekotoba";
import styles from "../styles/EmakiConteiner.module.css";
import { AppContext } from "../pages/_app";
import Modal from "./Modal";
import sample from "../public//cyoujyuu_yamazaki_kou_01-1080.webp";

const EmakiConteiner = ({ data }) => {
  const { isModalOpen } = useContext(AppContext);

  const emakis = data.emakis;
  const emakisData = useRef(emakis);
  console.log(emakisData);
  const { backgroundImage, kotobagaki, type } = data;

  const [imageWidth, setImageWidth] = useState(null);
  const [imageHeight, setImageHeight] = useState(null);
  const [arrSrc, setArrSrc] = useState([]);
  const [loading, setLoading] = useState(true);
  console.log({ imageWidth, imageHeight });
  console.log({ loading });

  useEffect(() => {
    const createImageElement = (path) => {
      return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.src = path;
      });
    };

    const handleSetOrientation = async () => {
      let arr = [];
      for (let i = 0; i < emakisData.length; i++) {
        const { src } = emakisData[i];
        const image = await createImageElement(src);
        setImageWidth(image.width);
        arr.push(image.width);
        setArrSrc(arr);
      }
    };
    handleSetOrientation();
    console.log({ arrSrc });
    // if (imageWidth != null && imageHeight != null) {
    //   setLoading(false);
    // }
  }, [setArrSrc,arrSrc,imageWidth]);

  // useEffect(() => {
  //   const image = new Image();
  //   image.src = "../public//cyoujyuu_yamazaki_kou_01-1080.webp";
  //   console.log(image.src);

  //   const srcEmakis = emakis.map((emaki, i) => {
  //     const { src } = emaki;
  //     console.log(src.getAttribute("src"));

  //     return image.width;
  //   });
  //   console.log(srcEmakis);
  // }, []);

  //  const [emakiWidth, setEmakiWidth] = useState();
  //  console.log(emakiWidth);

  const scrollRef = useRef();

  // useEffect(() => {
  //   const emakiWidth = scrollRef.current
  //     ? `${scrollRef.current.scrollWidth}px`
  //     : 0;
  //   setEmakiWidth(emakiWidth);
  // }, [emakiWidth]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      const wheelListener = (e) => {
        // e.preventDefault();
        el.scrollTo({
          left: el.scrollLeft + e.deltaY * 3,
          behavior: "smooth",
        });
      };
      el.addEventListener("wheel", wheelListener, { passive: true });
      // return () => el.removeEventListener("wheel", wheelListener);
    }
  }, []);

  return (
    <>
      {type === "浮世絵" && isModalOpen && <Modal data={data} />}
      <article
        className={`${styles.conteiner} ${
          type === "西洋絵画" ? styles.lr : styles.rl
        }`}
        ref={scrollRef}
        // style={{ "--text-width": emakiWidth }}
      >
        {emakis.map((item, index) => {
          const { cat, src } = item;

          if (cat === "image") {
            return <EmakiImage key={index} item={{ ...item, index }} />;
          } else {
            return (
              <Ekotoba
                key={index}
                item={{ ...item, index, backgroundImage, kotobagaki, type }}
              />
            );
          }
        })}
      </article>
    </>
  );
};

export default EmakiConteiner;
