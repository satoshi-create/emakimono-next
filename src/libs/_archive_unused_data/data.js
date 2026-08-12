import dataByoubus from "@/data/json-data/dataByoubus.json";
// jigokusoushi_genke（地獄草紙・原家本）— 2026-07-25 取り下げ
// ColBase DL 不可・奈良国立博物館はインターネット利用不可。退避: src/data/withdrawn/jigokusoushi_genke.json
// frolicking_animals_and_tengu_goblins（鳥獣戯画と天狗）— 2026-07-26 取り下げ
// HoMA 画像複製利用は事前許可が必要。退避: src/data/withdrawn/frolicking_animals_and_tengu_goblins.json
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
