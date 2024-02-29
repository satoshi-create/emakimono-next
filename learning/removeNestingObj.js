// const array1 = [1, 2, 3, 4];

// // 1. Array.prototype.reduce();
// // 0 + 1 + 2 + 3 + 4
// const initialValue = 0;
// const sumWithInitial = array1.reduce((acc, val) => acc + val, initialValue);

// console.log(sumWithInitial);
// // Expected output: 10

// const obj = {
//   name: "satoshi",
//   email: "satoshi@email.com",
//   nestObjA: {
//     name: "takeshi",
//     email: "takeshi@email.com",
//   },
//   nestObjB: {
//     name: "syoko",
//     email: "syoko@email.com",
//   },
//   emakis: {
//     name: "katsumi",
//     email: "katsumi@email.com",
//   },
// };

// 2. ネストしているObjectを削除して新しいObjectを作成する;
// https://hi97.hamazo.tv/e8537787.html
// const removeNestedObj = () =>
//   Object.entries(obj).reduce(
//     (acc, [key, val]) => {
//       // value の型が object であった時は Object に新しい値を加えずに返す
//       if ("object" === typeof val) {
//         return acc;
//       }
//       acc[key] = val;
//       return acc;
//     },
//     // 初期値：空のオブジェクト
//     {}
//   );

// console.log(removeNestedObj(obj));

// const obj = {
//   name: "satoshi",
//   email: "satoshi@email.com",
//   emakis: {
//     name: "katsumi",
//     email: "katsumi@email.com",
//   },
//   obj: {
//     name: "shoko",
//     email: "shoko@email.com",
//   },
// };

// // 3. ネストしている「絵巻オブジェクト」を削除して新しいObjectを作成する;
// // https://hi97.hamazo.tv/e8537787.html
// const removeNestedEmakisObj = () =>
//   Object.entries(obj).reduce(
//     (acc, [key, val]) => {
//       //keyの名前がemakisであった時は Object に新しい値を加えずに返す
//       if (key === "emakis") {
//         return acc;
//       }
//       acc[key] = val;
//       return acc;
//     },
//     // 初期値：空のオブジェクト
//     {}
//   );

// // console.log(removeNestedEmakisObj(obj));

// // //developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/typeof
// // // https: console.log(typeof {});
// // // object;

// const arrayObj = [
//   {
//     name: "satoshi",
//     email: "satoshi@email.com",
//     emakis: {
//       name: "katsumi",
//       email: "katsumi@email.com",
//     },
//     obj: {
//       name: "shoko",
//       email: "shoko@email.com",
//     },
//   },
// ];

// const removeNestedArrayObj = arrayObj.map((item) => {
//   return removeNestedEmakisObj(item);
// });

// console.log(removeNestedArrayObj);
