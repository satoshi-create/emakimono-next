// // import image from "./testImage.jpg";

// // console.log(image);

// // const loadImage = async (src) => {
// //   const image = new Image();
// //   image.src = src;
// //   await image.decode();
// //   return image;
// // };

// // const image = await loadImage("image.png");
// // // ... image ...

// // const newArr = Array.from(arr)
// //   .concat(ekotobaData)
// //   .sort((a, b) => {
// //     return a.id - b.id;
// //   });
// // const setNewArr = [...new Set(newArr)];
// // console.log(setNewArr);

// // createImageElement(srcTb).then((res) => {
// //   const newObj = { ...item, srcTbWidth: res.width };
// //   newArr.push(newObj);
// //   console.log(arr);
// // });

// // function loadImages(list) {
// //   async function load(src) {
// //     const img = new Image();
// //     img.src = src;
// //     await img.decode();
// //     return img;
// //   }
// //   return Promise.all(list.map((src) => load(src)));
// // }

// // console.log({
// //   oddObj: imageArr.filter((item, i) => i % 2 == 0).map((item) => item.width),
// //   evenObj: imageArr.filter((item, i) => i % 2 == 1).map((item) => item.width),
// // });

// // imageArr
// //   .filter((item, i) => i % 2 == 0)
// //   .map((item) => {
// //     const newObj = { oddObj: item.width };
// //     arr.push(newObj);
// //     console.log(arr);
// //   });

// const newArr = Array.from(arr)
//   .concat(ekotobaData)
//   .sort((a, b) => {
//     return a.id - b.id;
//   });
// const setNewArr = [...new Set(newArr)];

// loadimages
// const isClient = () => typeof window !== "undefined";

// if (isClient()) {
//   const loadImage = (src) => {
//     return new Promise((resolve, reject) => {
//       const img = new Image();
//       img.onload = () => {
//         resolve(img);
//       };
//       img.onerror = reject;
//       img.src = src;
//     });
//   };

//   const loadImages = (list) => {
//     const promiseArr = list.map((item) => loadImage(item.src, item.srcTb));
//     return Promise.all(promiseArr);
//   };

//   const srcArr = [
//     {
//       src: "/cyoujyuu_yamazaki_kou_01-800.webp",
//       srcTb: "/cyoujyuu_yamazaki_kou_01-1080.webp",
//     },
//   ];
//   const arr = [];
//   loadImages(srcArr) // まとめて画像を読み込む
//     .then((imageArr) => {
//       // resolve(img) で返ってきた画像の配列
//     });
// }

// const LoadImages = () => {
//   return <div>LoadImages</div>;
// };

// export default LoadImages;

 const [data, setData] = useState(data);
 console.log(data);

 const srcArr = [
   // 読み込みたい画像パスの配列
   "/asukayama_edomisyozue_375.webp",
   "/asukayama_edomisyozue_800.webp",
   "/asukayama_edomisyozue_1080.webp",
 ];

 useEffect(() => {
   const loadImage = (src) => {
     return new Promise((resolve, reject) => {
       const img = new Image();
       img.onload = () => {
         resolve(img);
       };
       img.onerror = reject;
       img.src = src;
     });
   };

   const loadImages = (srcArr) => {
     const promiseArr = srcArr.map((src) => loadImage(src)); // 画像パスの配列からPromiseの配列に変換
     return Promise.all(promiseArr); // Promise.all(Array<Promise>) で複数のPromiseを実行して全部完了したら次に進む
   };

   // loadImages(srcArr) // まとめて画像を読み込む
   //   .then((data) => {
   //     data.forEach((img) => {
   //       console.log(img.width);
   //     });
   //   })
   //   .catch((error) => {
   //     console.error(`Could not get products: ${error}`);
   //   });

   // async/await
   async function fetchData() {
     const data = await loadImages(srcArr);
     setData(data);
     try {
     } catch (err) {
       console.error(`Could not get products: ${error}`);
     }
   }
   fetchData();

   // Promise.all
   // Promise.all([fetchPromise1, fetchPromise2, fetchPromise3]).then(
   //   (responses) => {
   //     for (const response of responses) {
   //       console.log(`${response.url}:${response.status}`);
   //     }
   //   }
   // );
 }, []);