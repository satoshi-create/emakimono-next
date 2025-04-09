import dataByoubus from "@/data/json-data/dataByoubus.json";
import dataEmakis from "@/data/json-data/dataEmakis.json";
import dataKotenBungaku from "@/data/json-data/dataKotenBungaku.json";
import dataSeiyoukaiga from "@/data/json-data/dataSeiyoukaiga.json";
import dataSenmenga from "@/data/json-data/dataSenmenga.json";
import dataSuibokuga from "@/data/json-data/dataSuibokuga.json";
import dataUkiyoes from "@/data/json-data/dataUkiyoes.json";

const data = dataEmakis.concat(
  dataByoubus,
  dataSeiyoukaiga,
  dataSuibokuga,
  dataUkiyoes,
  dataKotenBungaku,
  dataSenmenga
);

export default data;
