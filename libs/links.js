const links = [
  { name: "ホーム", nameen: "home", id: "home", path: "/", submenu: "" },
  { name: "ご挨拶", nameen: "About", id: "about", path: "/about", submenu: "" },
  {
    name: "源氏絵の世界",
    nameen: "genji-pictures",
    id: "genji-pictures",
    path: "/genji-pictures",
    submenu: "",
  },
  {
    name: "絵巻一覧",
    nameen: "emaki",
    id: "emaki",
    path: "/type/emaki",
    submenu: "",
  },
  {
    name: "絵巻名場面集!!",
    nameen: "famousscene",
    id: "famousscene",
    path: "/famousscene",
    submenu: "",
  },
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
  {
    name: "お問い合わせ",
    nameen: "contact",
    id: "contact",
    path: "/contact",
    submenu: "",
  },
];

export default links;
