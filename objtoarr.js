// import data from "./libs/json-data/dataEmakis.json" assert { type: "json" };

//   const filterdEmakisData = data.filter(
//     (item, index) => item.titleen === "kusouzumaki"
//   );
// // const emakis = filterdEmakisData.map((item, i) => {
// //   const addPropEmakis = item.emakis((item, i) => {
// //     return {...item,id:i}
// //   })
// //   return addPropEmakis
// // })

// const addObjEmakis = filterdEmakisData
//   .map((item, i) => {
//     const addEkotobaIdtoEmakis = item.emakis
//       .filter((item) => item.cat === "ekotoba")
//       .map((item, i) => {
//         return { ...item, ekotobaId: i };
//       });
    
//       const test = addEkotobaIdtoEmakis.concat(item.emakis);
//       const test2 = test.filter(
//         (item) => !(item.cat === "ekotoba" && !item.ekotobaId)
//       );
//       console.log(test2);  
    
//     const addLinkIdtoEmakis = item.emakis.map((item, i) => {
//       return { ...item, linkId: i };
//     });

  


//   })
//   .find((item) => item);

//   // console.log(addObjEmakis);

// // const object1 = {
// //   a: "somestring",
// //   b: 42,
// //   c: "satoshi",
// // };

// // const arr1 = [
// //   {
// //     a: "somestring",
// //     b: 40,
// //     c: "satoshi",
// //   },
// //   {
// //     a: "somestring",
// //     b: 42,
// //     c: "satoshi",
// //   },
// //   {
// //     a: "somestring",
// //     b: 42,
// //     c: "satoshi",
// //   },
// // ];
// // // for (const [key, value] of Object.entries(object1)) {
// // //   console.log(`${key}: ${value}`);
// // // }

// // // hoge = Object.fromEntries(
// // //   Object.entries(object1).map(([k, v]) => {
// // //     if (k === "c") {
// // //       return "hoge"
// // //     }
// // //     return v
// // //   })
// // // );
// // const filterArr1 = arr1.filter((item, i) => item.b === 40)
// // const arrToObj = Object.fromEntries(Object.entries(filterArr1))
// // const arrToObj2 = filterArr1.find(item =>item)
// // console.log(filterArr1);
// // console.log(arrToObj2);

// // const name = arrToObj2.a

