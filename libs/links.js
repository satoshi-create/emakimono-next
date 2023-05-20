const links = [
  { name: "ホーム", nameen: "home", id: "home", path: "/", submenu: "" },
  { name: "ご挨拶", nameen: "About", id: "about", path: "/about", submenu: "" },
  {
    name: "絵巻一覧",
    nameen: "emaki",
    id: "emaki",
    path: "/category/emaki",
    submenu: "",
  },
  {
    name: "流れる巻物!!",
    nameen: "flowing scroll!!",
    id: "flow",
    path: "/flow",
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
    path: "",
    submenu: [
      {
        name: "屛風",
        nameen: "byoubu",
        id: "byoubu",
        path: "/category/byoubu",
      },
      {
        name: "水墨画",
        nameen: "suibokuga",
        id: "suibokuga",
        path: "/category/suibokuga",
      },
      {
        name: "浮世絵",
        nameen: "ukiyoe",
        id: "ukiyoe",
        path: "/category/ukiyoe",
      },
      {
        name: "西洋絵画",
        nameen: "western painting",
        id: "western painting",
        path: "/category/seiyoukaiga",
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
