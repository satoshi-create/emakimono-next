import emakisData from "./libs/data.js";
const emakis = [
  {
    name: "鳥獣人物戯画絵巻　甲巻",
    tag: [
      { name: "動物", id: "dog", slug: "dog" },
      { name: "動物", id: "dog", slug: "dog" },
    ],
    slug: "emaki",
  },
  {
    name: "鳥獣人物戯画絵巻　乙巻",
    tag: [
      { name: "動物", id: "animal", slug: "animal" },
      { name: "動物", id: "animal", slug: "animal" },
    ],
    slug: "emaki",
  },
];

const emakis2 = [
  {
    id: 1,
    title: "鳥獣人物戯画絵巻",
    titleen: "cyoujyujinbutsugiga_kou",
    author: "鳥羽僧正覚猷",
    edition: "甲巻",
    backgroundImage: "/110310200304.webp",
    thumb: "/cyoujyuu_yamazaki_kou_thumb.webp",
    thumb2: "/cyoujyuu_yamazaki_kou_thumb2.webp",
    video: "https://youtu.be/Si8NzY2drSg",
    era: "平安",
    eraen: "heiann",
    metadesc:
      "鳥獣人物戯画絵巻甲巻の全シーンを横スクロールでご覧になることができます。猿と蛙の喧嘩はなぜ起きたのか？、兎と蛙の相撲の結末は？、猫と鼠の思わぬ共演！？、などなど動物たちの生き生きとした表情を、心ゆくまでご覧ください☆",
    desc: "平安時代（12世紀）に描かれた鳥獣人物戯画絵巻 甲巻の摸本。有名な猿と蛙の喧嘩、兎と蛙の相撲のほか、田楽、賭弓など、当時ミヤコで流行っていた様々な遊びに動物が興じる姿が、表情豊かに描かれている。摸本や断簡には競馬や双六遊び、高跳びなど、現在知られている絵巻とは異なるモチーフの遊びが描かれている。そもそもははもっと長大な絵巻だったようだ。",
    readMore: false,
    type: "絵巻",
    typeen: "emaki",
    tag: [
      { name: "戯画", id: "caricature", slug: "caricature" },
      { name: "動物", id: "animal", slug: "animal" },
      { name: "鳥羽絵", id: "tobae", slug: "tobae" },
    ],
    kotobagaki: false,
    favorite: true,
    sourceImageUrl:
      "https://colbase.nich.go.jp/collection_items/tnm/A-1530?locale=ja",
    sourceImage: "鳥獣人戯画絵巻 摸本（ColBase）",
  },
  {
    id: 2,
    title: "鳥獣人物戯画絵巻",
    titleen: "cyoujyujinbutsugiga_otu",
    author: "鳥羽僧正覚猷",
    edition: "乙巻",
    backgroundImage: "/110310200304.webp",
    video: "https://youtu.be/0OCF6w7Ljj4",
    thumb: "/cyoujyuu_yamazaki_otu_thumb.webp",
    thumb2: "/cyoujyuu_yamazaki_otu_thumb2.webp",
    era: "平安",
    eraen: "heiann",
    metadesc:
      "鳥獣人物戯画絵巻乙巻の全シーンを横スクロールでご覧になることができます。国宝として有名な甲巻と同じ絵師が描いたと言われる「動物尽くし」の図鑑のような乙巻は、牛や馬など現実の動物と、玄武、麒麟など空想の動物が、想像力を交えて生き生きと描かれています。",
    desc: "平安時代（12世紀）に描かれた鳥獣人物戯画絵巻 乙巻の摸本。「動物尽くし」の図鑑のような一巻で、絵師の手習いとして使われたという説もある。前半は「日本に生息する動物」を扱い、馬、牛など当時身近だった動物が描かれる。後半は、一転して「日本に生息しない動物＆霊獣」が描かれ、玄武、麒麟など空想上の動物と象、虎など日本には生息していない動物が、想像力を交えて描かれる。",
    type: "絵巻",
    typeen: "emaki",
    tag: [
      { name: "戯画", id: "caricature", slug: "caricature" },
      { name: "動物", id: "animal", slug: "animal" },
      { name: "鳥羽絵", id: "tobae", slug: "tobae" },
    ],
    kotobagaki: false,
    sourceImageUrl:
      "https://colbase.nich.go.jp/collection_items/tnm/A-1530?locale=ja",
    sourceImage: "鳥獣人戯画絵巻 摸本（ColBase）",
  },
];

const data = [
  {
    menuName: "Hot dogs",
    menu: [
      { dishId: "1", dish_has_categories: [{ CategoryId: "8" }] },
      { dishId: "2", dish_has_categories: [{ CategoryId: "9" }] },
    ],
  },
  {
    menuName: "Burgers",
    menu: [
      { dishId: "3", dish_has_categories: [{ CategoryId: "6" }] },
      { dishId: "4", dish_has_categories: [{ CategoryId: "4" }] },
    ],
  },
  { name: "Drinks", menu: [] },
];

const res = data.filter((x) =>
  x.menu.some((y) => y.dish_has_categories.some((z) => z.CategoryId === "8"))
);
console.log(res);

// const filteredEmakis = emakisData.filter((x) => {
//   x.tag.some((y) => y.chapter === "馬");
// });

const filteredEmakis = emakisData.filter((x) => x.tag.some((y) => y.slug === "animal"));

console.log(filteredEmakis);
