import dataByoubus from "../libs/dataByoubus";
import dataEmakis from "../libs/dataEmakis.js";
import dataSeiyoukaiga from "../libs/dataSeiyoukaiga.js";
import dataSuibokuga from "../libs/dataSuibokuga.js";
import dataUkiyoes from "../libs/dataUkiyoes.js";

const data = dataEmakis.concat(
  dataByoubus,
  dataSeiyoukaiga,
  dataSuibokuga,
  dataUkiyoes
);

export default data;
  