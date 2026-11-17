import type { QuizDefinition } from "@/types/quiz";

export const RAKUCHU_RAKUGAI_FUNAKI_QUIZ: QuizDefinition = {
  id: "rakuchu-rakugai-funaki",
  titleen: "rakuchu_rakugai_funaki",
  version: 1,
  ranks: [
    {
      id: "master",
      minCorrect: 5,
      maxCorrect: 5,
      labelJa: "洛中観察マスター",
      labelEn: "Rakuchu Observation Master",
    },
    {
      id: "observer",
      minCorrect: 3,
      maxCorrect: 4,
      labelJa: "京の街歩き達人",
      labelEn: "Kyoto Street Stroller",
    },
    {
      id: "beginner",
      minCorrect: 0,
      maxCorrect: 2,
      labelJa: "洛中観察ビギナー",
      labelEn: "Rakuchu Beginner",
    },
  ],
  questions: [
    {
      id: "q1",
      order: 1,
      promptJa:
        "舟木本の賑やかな四条河原や大道芸の周辺では、芸を見せて人々を楽しませる動物が描かれています。当時の大道芸の定番だったその動物はどれでしょう？",
      promptEn:
        "Around the lively Shijo Riverbed in the Funaki Screen, an animal performing tricks for crowds is depicted. Which animal was a staple of street performances at the time?",
      choices: [
        { id: "c1", labelJa: "猿（猿まわし）", labelEn: "Monkey (Monkey trainer)" },
        { id: "c2", labelJa: "象", labelEn: "Elephant" },
        { id: "c3", labelJa: "虎", labelEn: "Tiger" },
        { id: "c4", labelJa: "鶴", labelEn: "Crane" },
      ],
      correctIndex: 0,
      explanationJa:
        "大道芸人（猿曳き）が連れ歩く「猿まわし」は、当時の京の街角や河原の定番の娯楽でした。猿は馬の守り神としても信仰され、町衆や子どもたちに人気がありました。",
      explanationEn:
        "Street performers leading trained monkeys ('sarumawashi') were a popular entertainment on Kyoto's streets and riverbeds, also revered as guardian spirits for horses.",
      jump: { type: "chapter", chapter: 2 },
      jumpLabelJa: "四条河原・鴨川周辺（第2扇）を見る",
      jumpLabelEn: "View Shijo Riverbed Area (Panel 2)",
    },
    {
      id: "q2",
      order: 2,
      promptJa:
        "五条大橋や賀茂川の浅瀬をズームして観察すると、夏場ならではの遊びを楽しむ子どもたちの姿が見つかります。川辺で子どもたちは何をしているでしょう？",
      promptEn:
        "Zooming in on Gojo Bridge and the shallows of the Kamo River reveals children enjoying a seasonal pastime. What are they doing by the river?",
      choices: [
        { id: "c1", labelJa: "氷の上で滑っている", labelEn: "Skating on ice" },
        { id: "c2", labelJa: "水浴びや魚捕りをしている", labelEn: "Swimming and catching fish" },
        { id: "c3", labelJa: "巨大な船を組み立てている", labelEn: "Building a giant ship" },
        { id: "c4", labelJa: "凧揚げ大会をしている", labelEn: "Flying kites" },
      ],
      correctIndex: 1,
      explanationJa:
        "賀茂川の浅瀬や中州では、着物を脱いで水浴びをしたり、網や手づかみで魚を狙ったりする子どもたちの無邪気な姿が描かれています。当時の子どもたちにとって川は最高の遊び場でした。",
      explanationEn:
        "In the shallows of the Kamo River, children are depicted swimming and trying to catch fish—the river served as a vibrant natural playground in Edo-period Kyoto.",
      jump: { type: "chapter", chapter: 2 },
      jumpLabelJa: "五条大橋・賀茂川周辺（第2扇）を見る",
      jumpLabelEn: "View Gojo Bridge & Kamo River (Panel 2)",
    },
    {
      id: "q3",
      order: 3,
      promptJa:
        "京の町家の前や通りをズームすると、当時の子どもたちが棒状の道具にまたがって駆け回る遊び（現代の竹馬のルーツ）が見られます。この遊びは何と呼ばれていたでしょう？",
      promptEn:
        "Zooming into Kyoto's town streets shows children galloping while straddling a bamboo pole—an ancestor of modern stilts. What was this play called?",
      choices: [
        { id: "c1", labelJa: "春駒（はるこま）", labelEn: "Harukoma (Bamboo hobbyhorse)" },
        { id: "c2", labelJa: "羽根つき", labelEn: "Hanetsuki" },
        { id: "c3", labelJa: "百人一首", labelEn: "Hyakunin Isshu" },
        { id: "c4", labelJa: "蹴鞠（けまり）", labelEn: "Kemari" },
      ],
      correctIndex: 0,
      explanationJa:
        "一本の竹の棒を馬に見立てて股に挟み、駆け回って遊ぶ「春駒（竹馬）」は、室町〜江戸時代の子どもたちの定番の遊びでした。現代のように両足で乗る高い竹馬は江戸中期以降に広まります。",
      explanationEn:
        "Straddling a single bamboo pole like a horse ('harukoma') was a classic children's game; two-legged stilts became widespread later in the Edo period.",
      jump: { type: "chapter", chapter: 3 },
      jumpLabelJa: "京の町並み・通り（第3扇）を見る",
      jumpLabelEn: "View Town Streets (Panel 3)",
    },
    {
      id: "q4",
      order: 4,
      promptJa:
        "洛中洛外図の町角や河原のあちこちには「犬」が描かれています。屏風の中の犬たちは、主にどのような姿で描かれていることが多いでしょう？",
      promptEn:
        "Dogs appear throughout the streets and riverbeds of the screen. How are these town dogs most commonly depicted?",
      choices: [
        { id: "c1", labelJa: "豪華な駕籠（かご）に乗っている", labelEn: "Riding inside a palanquin" },
        { id: "c2", labelJa: "町中を自由に歩き回り、子どもにからかわれたり吠えたりしている", labelEn: "Roaming freely, barking or being teased by children" },
        { id: "c3", labelJa: "お寺の本堂でお経を聞いている", labelEn: "Listening to sutras inside a temple hall" },
        { id: "c4", labelJa: "屋根の上で昼寝をしている", labelEn: "Napping on rooftops" },
      ],
      correctIndex: 1,
      explanationJa:
        "当時の京の町には特定の飼い主に縛られない「町犬（里犬）」が多く暮らしており、残飯を食べたり、子どもに棒でちょっかいを出されて追いかけたりと、生活感あふれる姿で描かれています。",
      explanationEn:
        "Community dogs roamed freely through Kyoto's neighborhoods, scavenging scraps and playfully chasing or being teased by local children.",
      jump: { type: "chapter", chapter: 4 },
      jumpLabelJa: "洛中の通り（第4扇）を見る",
      jumpLabelEn: "View Rakuchu Streets (Panel 4)",
    },
    {
      id: "q5",
      order: 5,
      promptJa:
        "大通りや街道筋をズームすると、重い薪や物資を背中に積んで京の町へ運ぶ大型の動物が何頭も描かれています。人々の物流を支えていたその動物はどれでしょう？",
      promptEn:
        "Zooming in on the main thoroughfares reveals large animals carrying heavy firewood and goods into Kyoto. Which animals supported the city's logistics?",
      choices: [
        { id: "c1", labelJa: "牛と馬", labelEn: "Oxen and horses" },
        { id: "c2", labelJa: "鹿とイノシシ", labelEn: "Deer and wild boars" },
        { id: "c3", labelJa: "ラクダとロバ", labelEn: "Camels and donkeys" },
        { id: "c4", labelJa: "クマとオオカミ", labelEn: "Bears and wolves" },
      ],
      correctIndex: 0,
      explanationJa:
        "車輪のついた牛車（ぎっしゃ）を引く牛や、背中に荷物を振り分けて運ぶ駄馬（だば）は、当時の京の物流に欠かせない存在でした。引く人とすれ違う町衆の仕草も見どころです。",
      explanationEn:
        "Oxen pulling carts and packhorses carrying goods were essential to Kyoto's supply chain, bustling alongside merchants and townspeople.",
      jump: { type: "chapter", chapter: 5 },
      jumpLabelJa: "街道・大通り周辺（第5扇）を見る",
      jumpLabelEn: "View Main Thoroughfares (Panel 5)",
    },
  ],
  resultLinks: [
    {
      type: "path",
      path: "/rakuchu-rakugai",
      labelJa: "洛中洛外図一覧を見る",
      labelEn: "View All Rakuchu-Rakugai Screens",
    },
  ],
};