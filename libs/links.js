const links = [
  {
    name: "絵巻一覧",
    nameen: "Emaki",
    id: "emaki",
    path: "/category/emaki",
    submenu: "",
  },
  { name: "ご挨拶", nameen: "About", id: "about", path: "/about", submenu: ""},
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
