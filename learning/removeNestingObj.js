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
//   nestObj: {
//     name: "takeshi",
//     email: "takeshi@email.com",
//   },
// };

// // 2. ネストしているObjectを削除して新しいObjectを作成する;
// // https://hi97.hamazo.tv/e8537787.html
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

// //developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/typeof
// // https: console.log(typeof {});
// // object;

// const arrayObj = [
//   {
//     name: "satoshi",
//     email: "satoshi@email.com",
//     nestObj: {
//       name: "takeshi",
//       email: "takeshi@email.com",
//     },
//   },
//   {
//     name: "satoshi",
//     email: "satoshi@email.com",
//     nestObj: {
//       name: "takeshi",
//       email: "takeshi@email.com",
//     },
//   },
//   {
//     name: "satoshi",
//     email: "satoshi@email.com",
//     nestObj: {
//       name: "takeshi",
//       email: "takeshi@email.com",
//     },
//   },
// ];

// const removeNestedArrayObj = arrayObj.map((item) => {
//   console.log(item);
//   return removeNestedObj(item);
// });

// console.log(removeNestedArrayObj);
