const links = [
  { name: "ご挨拶", nameen: "About", id: "about", path: "/about", submenu: "" },
  {
    name: "絵巻一覧",
    nameen: "Emaki",
    id: "emaki",
    path: "/category/emaki",
    submenu: "",
  },
  {
    name: "流れる巻物",
    nameen: "flow",
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
    name: "お問い合わせ",
    nameen: "Contact",
    id: "about",
    path: "/contact",
    submenu: "",
  },
  {
    name: "＋α",
    nameen: "Alpha",
    id: "alpha",
    path: "",
    submenu: [
      {
        name: "屛風",
        nameen: "Byoubu",
        id: "byoubu",
        path: "/category/byoubu",
      },
      {
        name: "水墨画",
        nameen: "Suibokuga",
        id: "suibokuga",
        path: "/category/suibokuga",
      },
      {
        name: "浮世絵",
        nameen: "Ukiyoe",
        id: "ukiyoe",
        path: "/category/ukiyoe",
      },
      {
        name: "西洋絵画",
        nameen: "Western painting",
        id: "seiyoukaiga",
        path: "/category/seiyoukaiga",
      },
    ],
  },
];

export default links;
