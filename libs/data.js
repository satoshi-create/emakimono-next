import dataByoubus from "@/libs/json-data/dataByoubus.json";
import dataEmakis from "@/libs/json-data/dataEmakis.json";
import dataKotenBungaku from "@/libs/json-data/dataKotenBungaku.json";
import dataSeiyoukaiga from "@/libs/json-data/dataSeiyoukaiga.json";
import dataSenmenga from "@/libs/json-data/dataSenmenga.json";
import dataSuibokuga from "@/libs/json-data/dataSuibokuga.json";
import dataUkiyoes from "@/libs/json-data/dataUkiyoes.json";

const data = dataEmakis.concat(
  dataByoubus,
  dataSeiyoukaiga,
  dataSuibokuga,
  dataUkiyoes,
  dataKotenBungaku,
  dataSenmenga
);

export default data;
