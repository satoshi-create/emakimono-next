import dataByoubus from "./dataByoubus.js";
import dataEmakis from "./dataEmakis.js";
import dataSeiyoukaiga from "./dataSeiyoukaiga.js";
import dataSuibokuga from "./dataSuibokuga.js";
import dataUkiyoes from "./dataUkiyoes.js";
import dataKotenBungaku from "./dataKotenBungaku.js";
import dataSenmenga from "./dataSenmenga.js";

const data = dataEmakis.concat(
  dataByoubus,
  dataSeiyoukaiga,
  dataSuibokuga,
  dataUkiyoes,
  dataKotenBungaku,
  dataSenmenga
);

export default data;
