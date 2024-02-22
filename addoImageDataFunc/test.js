// import React, { useState, useEffect } from "react";
// import dataEmakisAllData from "../libs/dataEmakis";

// // const isClient = () => typeof window !== "undefined";

// // if (isClient()) {
// //   const addImagesrc = (data) => {
// //     const emakiData = data
// //       .flatMap((item) => item.emakis)
// //       .map((item, i) => {
// //         return { ...item, id: i };
// //       });

// //     const ekotobaData = emakiData.filter(
// //       (item, i) => item.cat === "ekotoba" && !item.src
// //     );

// //     // const createImageElement = async (list) => {
// //     //   return new Promise((resolve, reject) => {
// //     //     setTimeout(() => {
// //     //       const image = new Image();
// //     //       // 読み込み完了後、onload
// //     //       image.onload = () => resolve(image);
// //     //       image.onerror = (e) => reject(e);
// //     //       image.src = list;
// //     //     }, 1000);
// //     //   });
// //     // };

// //     const createImageElement = (src) => {
// //       return new Promise((resolve, reject) => {
// //         const img = new Image();
// //         img.onload = () => {
// //           resolve(img);
// //         };
// //         img.onerror = reject;
// //         img.src = src;
// //       });
// //     };

// //     // const createImageElement = (srcArr) => {
// //     //   const promiseArr = srcArr.map((src) => loadImage(src));
// //     //   return Promise(promiseArr);
// //     // };

// //     const arr = [];

// //     emakiData.map((item, i) => {
// //       const pc = createImageElement(item.src).then((res) =>
// //         console.log(res.width)
// //       );

// //       //   const newObj = {
// //       //     ...item,
// //       //     srcWidth: res.width,
// //       //     srcHeight: 1080,
// //       //   };
// //       //   const newArray = arr.push(newObj);
// //       //   return newArray;
// //       // });
// //     });
// //   };
// //   addImagesrc(dataEmakis);
// // }

// const AddImageData = () => {
//   // dataEmakisからemakisの配列を抽出
//   const emakisData = dataEmakisAllData.flatMap((item) => item.emakis);
//   //emakisデータからsrcが含まれるデータを抽出
//   const containSrcData = emakisData.filter((item) => item.src);
//   //emakisデータからsrcが含まれないデータを抽出

//   const otherData = emakisData.filter(
//     (item, i) => item.cat === "ekotoba" && !item.src
//   );

//   const arr = [];

//   useEffect(() => {
//     const loadImage = (src) => {
//       return new Promise((resolve) => {
//         const img = new Image();
//         img.onload = () => {
//           resolve(img);
//         };
//         img.src = src;
//       });
//     };

//     // const loadImages = (srcArr) => {
//     //   const promiseArr = srcArr.map((src) => loadImage(src));
//     //   return Promise.all(promiseArr);
//     // };

//     containSrcData.map((item, i) => {
//       const { srcTb } = item;
//       loadImage(srcTb).then((res) => {
//         const newObj = { ...item };
//         arr.push(newObj);
//         console.log(arr);

//         const newArr = Array.from(arr)
//           .concat(otherData)
//           .sort((a, b) => {
//             return a.id - b.id;
//           });
//         const setNewArr = [...new Set(newArr)];
//       });
//       return;
//     });

//     // emakiData.map((item, i) => {
//     //   console.log(item.srcTb);

//     //   loadImage(item.srcTb).then((res) => {
//     //     setData(res.width);
//     //   });
//     // });

//     // async function fetcImagehData() {
//     //   const emakisSrc =  emakiData.map((item, i) => {
//     //     const { src } = item;
//     //     const srcWidth = await loadImages(emakisSrc);
//     //   });
//     //   console.log(emakisSrc);

//     //   console.log(srcWidth);

//     //   try {
//     //   } catch (err) {
//     //     console.error(`Could not get products: ${error}`);
//     //   }
//     // }
//     // fetcImagehData();
//   }, []);

//   return <div>addImageData component</div>;
// };

// export default AddImageData;


// // // import image from "./testImage.jpg";

// // // console.log(image);

// // // const loadImage = async (src) => {
// // //   const image = new Image();
// // //   image.src = src;
// // //   await image.decode();
// // //   return image;
// // // };

// // // const image = await loadImage("image.png");
// // // // ... image ...

// // // const newArr = Array.from(arr)
// // //   .concat(ekotobaData)
// // //   .sort((a, b) => {
// // //     return a.id - b.id;
// // //   });
// // // const setNewArr = [...new Set(newArr)];
// // // console.log(setNewArr);

// // // createImageElement(srcTb).then((res) => {
// // //   const newObj = { ...item, srcTbWidth: res.width };
// // //   newArr.push(newObj);
// // //   console.log(arr);
// // // });

// // // function loadImages(list) {
// // //   async function load(src) {
// // //     const img = new Image();
// // //     img.src = src;
// // //     await img.decode();
// // //     return img;
// // //   }
// // //   return Promise.all(list.map((src) => load(src)));
// // // }

// // // console.log({
// // //   oddObj: imageArr.filter((item, i) => i % 2 == 0).map((item) => item.width),
// // //   evenObj: imageArr.filter((item, i) => i % 2 == 1).map((item) => item.width),
// // // });

// // // imageArr
// // //   .filter((item, i) => i % 2 == 0)
// // //   .map((item) => {
// // //     const newObj = { oddObj: item.width };
// // //     arr.push(newObj);
// // //     console.log(arr);
// // //   });

// // const newArr = Array.from(arr)
// //   .concat(ekotobaData)
// //   .sort((a, b) => {
// //     return a.id - b.id;
// //   });
// // const setNewArr = [...new Set(newArr)];

// // loadimages
// // const isClient = () => typeof window !== "undefined";

// // if (isClient()) {
// //   const loadImage = (src) => {
// //     return new Promise((resolve, reject) => {
// //       const img = new Image();
// //       img.onload = () => {
// //         resolve(img);
// //       };
// //       img.onerror = reject;
// //       img.src = src;
// //     });
// //   };

// //   const loadImages = (list) => {
// //     const promiseArr = list.map((item) => loadImage(item.src, item.srcTb));
// //     return Promise.all(promiseArr);
// //   };

// //   const srcArr = [
// //     {
// //       src: "/cyoujyuu_yamazaki_kou_01-800.webp",
// //       srcTb: "/cyoujyuu_yamazaki_kou_01-1080.webp",
// //     },
// //   ];
// //   const arr = [];
// //   loadImages(srcArr) // まとめて画像を読み込む
// //     .then((imageArr) => {
// //       // resolve(img) で返ってきた画像の配列
// //     });
// // }

// // const LoadImages = () => {
// //   return <div>LoadImages</div>;
// // };

// // export default LoadImages;

//  const [data, setData] = useState(data);
//  console.log(data);

//  const srcArr = [
//    // 読み込みたい画像パスの配列
//    "/asukayama_edomisyozue_375.webp",
//    "/asukayama_edomisyozue_800.webp",
//    "/asukayama_edomisyozue_1080.webp",
//  ];

//  useEffect(() => {
//    const loadImage = (src) => {
//      return new Promise((resolve, reject) => {
//        const img = new Image();
//        img.onload = () => {
//          resolve(img);
//        };
//        img.onerror = reject;
//        img.src = src;
//      });
//    };

//    const loadImages = (srcArr) => {
//      const promiseArr = srcArr.map((src) => loadImage(src)); // 画像パスの配列からPromiseの配列に変換
//      return Promise.all(promiseArr); // Promise.all(Array<Promise>) で複数のPromiseを実行して全部完了したら次に進む
//    };

//    // loadImages(srcArr) // まとめて画像を読み込む
//    //   .then((data) => {
//    //     data.forEach((img) => {
//    //       console.log(img.width);
//    //     });
//    //   })
//    //   .catch((error) => {
//    //     console.error(`Could not get products: ${error}`);
//    //   });

//    // async/await
//    async function fetchData() {
//      const data = await loadImages(srcArr);
//      setData(data);
//      try {
//      } catch (err) {
//        console.error(`Could not get products: ${error}`);
//      }
//    }
//    fetchData();

//    // Promise.all
//    // Promise.all([fetchPromise1, fetchPromise2, fetchPromise3]).then(
//    //   (responses) => {
//    //     for (const response of responses) {
//    //       console.log(`${response.url}:${response.status}`);
//    //     }
//    //   }
//    // );
//  }, []);