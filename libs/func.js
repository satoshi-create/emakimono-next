const eraColor = (x) => {
  switch (x) {
    case "平安時代":
      return "orange";
      break;
    case "鎌倉時代":
      return "green";
      break;
    case "室町時代":
      return "purple";
      break;
    case "安土・桃山時代":
      return "gold";
      break;
    case "江戸時代":
      return "skyblue";
      break;
    case "明治時代":
      return "firebrick";
      break;
    default:
      break;
  }
};

export default eraColor;