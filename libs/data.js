import dataByoubus from "./dataByoubus.js";
import dataEmakis from "./dataEmakis.js";
import dataSeiyoukaiga from "./dataSeiyoukaiga.js";
import dataSuibokuga from "./dataSuibokuga.js";
import dataUkiyoes from "./dataUkiyoes.js";

const data = dataEmakis.concat(
  dataByoubus,
  dataSeiyoukaiga,
  dataSuibokuga,
  dataUkiyoes
);

export default data;
