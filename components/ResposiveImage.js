import React, { useEffect, useState } from "react";
import styles from "../styles/ResposiveImage.module.css";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";

const ResposiveImage = ({
  value: { srcSp, srcTb, src, load, name, srcWidth, srcHeight, index },
}) => {
  // const [imageWidth, setImageWidth] = useState(null);
  // const [imageHeight, setImageHeight] = useState(null);
  // // const [loading, setLoading] = useState(true);
  // // console.log(imageWidth);

  // const createImageElement = (path) => {
  //   return new Promise((resolve) => {
  //     const image = new Image();
  //     image.onload = () => resolve(image);
  //     image.src = path;
  //   });
  // };

  // useEffect(() => {
  //   const handleSetOrientation = async () => {
  //     const image = await createImageElement(src);
  //     // let arr = [];
  //     // arr.push(image[index].width);
  //     // console.log(arr);
  //     setImageWidth(image.naturalWidth);

  //     const arr = new Map();

  //     arr.set(index, imageWidth);

  //     setImageHeight(image.naturalHeight);
  //   };
  //   handleSetOrientation();
  //   // if (imageWidth != null && imageHeight != null) {
  //   //   setLoading(false);
  //   // }
  // }, [src, imageWidth, imageHeight]);

  // if (loading) {
  //   return <div>loading</div>;
  // }
  return (
    <picture>
      <source
        data-srcset={srcSp}
        media="(max-height: 375px)"
        type="image/webp"
      />
      <source
        data-srcset={srcTb}
        media="(max-height: 800px)"
        type="image/webp"
      />
      <source data-srcset={src} type="image/webp" />
      <img
        decoding="async"
        // src={
        //   load
        //     ? srcSp
        //     : "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
        // }
        src={srcSp}
        className={`fade-in lazyload ${styles.emakiImg}`}
        alt={name}
        width={srcWidth}
        height={srcHeight}
        data-expand="300"
      />
    </picture>
  );
};

export default ResposiveImage;
