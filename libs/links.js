
const links = [
  { name: "ホーム", nameen: "home", id: "home", path: "/", submenu: "" },
  { name: "ご挨拶", nameen: "About", id: "about", path: "/about", submenu: "" },

  {
    name: "絵巻一覧",
    nameen: "emaki",
    id: "emaki",
    path: "/type/emaki",
    submenu: "",
  },
  {
    name: "特集",
    nameen: "feature",
    id: "feature",
    path: "",
    submenu: [
      {
        name: "九相図観想",
        nameen: "contemplation of Nine stages of decay",
        id: "flow-kusouzu",
        path: "/flow-kusouzu",
      },
      {
        name: "伴大納言絵詞全巻イッキ見！！",
        nameen: "See all ban-dainagon-ekotoba",
        id: "flow-ban-dainagon",
        path: "/flow-ban-dainagon",
      },
      {
        name: "鳥獣人物戯画絵巻イッキ見！！",
        nameen: "See all cyoujyu-jinbutsu-giga",
        id: "flow-cyouzyuu",
        path: "/flow-cyouzyuu",
      },
      {
        name: "源氏物語絵54帖万華鏡",
        nameen: "Tale of Genji Picture 54 Kaleidoscope",
        id: "flow-genji-pictures",
        path: "/flow-genji-pictures",
      },
    ],
  },
  // {
  //   name: "絵巻名場面集!!",
  //   nameen: "famousscene",
  //   id: "famousscene",
  //   path: "/famousscene",
  //   submenu: "",
  // },
  {
    name: "その他の巻物",
    nameen: "alpha",
    id: "alpha",
    path: "/type/byoubu",
    submenu: [
      {
        name: "屛風",
        nameen: "byoubu",
        id: "byoubu",
        path: "/type/byoubu",
      },
      {
        name: "水墨画",
        nameen: "suibokuga",
        id: "suibokuga",
        path: "/type/suibokuga",
      },
      {
        name: "浮世絵",
        nameen: "ukiyoe",
        id: "ukiyoe",
        path: "/type/ukiyoe",
      },
      {
        name: "扇面画",
        nameen: "senmenga",
        id: "senmenga",
        path: "/type/senmenga",
      },
      {
        name: "西洋絵画",
        nameen: "western painting",
        id: "western painting",
        path: "/type/seiyoukaiga",
      },
    ],
  },
  // {
  //   name: "お問い合わせ",
  //   nameen: "contact",
  //   id: "contact",
  //   path: "/contact",
  //   submenu: "",
  // },
];

export default links;
