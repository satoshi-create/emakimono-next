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

export default eraColor;