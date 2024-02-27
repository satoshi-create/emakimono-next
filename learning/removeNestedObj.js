// https://hi97.hamazo.tv/e8537787.html
const removeNestedObj = Object.entries(obj).reduce(
  (acc, [key, val]) => {
    if ("object" === typeof val) {

      return acc;
    }
    acc[key] = val;
    return acc;
  },
  初期値,
  空のオブジェクト,
  {}
);
