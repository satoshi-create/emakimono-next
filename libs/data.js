import dataByoubus from "./json-data/dataByoubus.json";
import dataEmakis from "./json-data/dataEmakis.json";
import dataSeiyoukaiga from "./json-data/dataSeiyoukaiga.json";
import dataSuibokuga from "./json-data/dataSuibokuga.json";
import dataUkiyoes from "./json-data/dataUkiyoes.json";
import dataKotenBungaku from "./json-data/dataKotenBungaku.json";
import dataSenmenga from "./json-data/dataSenmenga.json";

const data = dataEmakis.concat(
  dataByoubus,
  dataSeiyoukaiga,
  dataSuibokuga,
  dataUkiyoes,
  dataKotenBungaku,
  dataSenmenga
);


// import JSONdata from "./placeholder.json";
// console.log(JSONdata);
// const JSONdata = JSON.stringify(dataSenmenga);
// console.log(JSONdata);

export default data;
