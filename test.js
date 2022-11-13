const test = [
  {
    tag: [
      { name: "動物", id: "dog", slug: "dog" },
      { name: "動物", id: "dog", slug: "dog" },
      { name: "遊戯", id: "game", slug: "game" },
    ],
  },
  {
    tag: [
      { name: "動物", id: "cat", slug: "cat" },
      { name: "動物", id: "cat", slug: "cat" },
      { name: "遊戯", id: "game", slug: "game" },
    ],
  },
  {
    tag: [
      { name: "動物", id: "dog", slug: "dog" },
      { name: "動物", id: "dog", slug: "dog" },
      { name: "遊戯", id: "game", slug: "game" },
    ],
  },
];

const filterdEmakisData = test.filter((x) => {
  if (x.tag) {
    const filterdTag = x.tag.some((y) => y.slug === "dog");
    return filterdTag;
  }
}).length;
console.log(filterdEmakisData);

// 出力結果
// {0: 2, 1: 4, 3: 2, 5: 1, 7: 1}
