const eraColor = (x) => {
  switch (x) {
    case "平安":
      return "orange";
      break;
    case "鎌倉":
      return "green";
      break;
    case "室町":
      return "purple";
      break;
    case "安土・桃山":
      return "gold";
      break;
    case "江戸":
      return "skyblue";
      break;
    case "明治":
      return "firebrick";
      break;
    default:
      break;
  }
};

const convert = (arr) => {
  const res = {};
  arr.forEach((obj) => {
    const key = `${obj.name}`;
    if (!res[key]) {
      res[key] = { ...obj, total: 0 };
    }
    res[key].total += 1;
  });
  return Object.values(res);
};

const keywordItem = (arr) =>
  convert(arr.flatMap((item) => item.keyword).filter((item) => item)).sort(
    (a, b) => (a.total > b.total ? -1 : 1)
  );

const personnameItem = (arr) =>
  convert(arr.flatMap((item) => item.personname).filter((item) => item)).sort(
    (a, b) => (a.total > b.total ? -1 : 1)
  );

export { eraColor, keywordItem, personnameItem };
