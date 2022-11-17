const data = [
  {
    keyword: [
      { name: "戯画", id: "caricature", slug: "caricature" },
      { name: "鳥羽絵", id: "tobae", slug: "tobae" },
    ],
  },
  {
    keyword: [
      { name: "戯画", id: "caricature", slug: "caricature" },
      { name: "動物", id: "animal", slug: "animal" },
      { name: "鳥羽絵", id: "tobae", slug: "tobae" },
    ],
  },
  {
    keyword: [
      { name: "戯画", id: "caricature", slug: "caricature" },
      { name: "動物", id: "animal", slug: "animal" },
      { name: "鳥羽絵", id: "tobae", slug: "tobae" },
      { name: "年中行事", id: "annualevent", slug: "annualevent" },
    ],
  },
  {
    test: "test",
  },
];

const keyworditem = data.flatMap((item) => item.keyword).filter((item) => item);

const filter = keyworditem.filter((item) => item);
console.log(keyworditem);

const convert = (arr) => {
  const res = {};
  arr.forEach((obj) => {
    const key = `${obj.name}`;
    if (!res[key]) {
      res[key] = { ...obj, total: 0 };
    }
    res[key].total += 1;
  });
  return Object.values(res);
};
console.log(convert(keyworditem));

// const setKeywordItem = [...new Set(keyworditem.map((item) => item.name))];
const sortItem = convert(keyworditem).sort((a, b) => {
  if (a.total > b.total) return -1;
  if (b.total > a.total) return 1;
  return 0;
});

console.log(sortItem);

var obj = [
  { sbj: "数学", score: 80 },
  { sbj: "英語", score: 20 },
  { sbj: "社会", score: 55 },
  { sbj: "国語", score: 90 },
];

console.log(
  obj.sort(function (a, b) {
    if (a.score > b.score) return -1;
    if (b.score > a.score) return 1;

    return 0;
  })
);
