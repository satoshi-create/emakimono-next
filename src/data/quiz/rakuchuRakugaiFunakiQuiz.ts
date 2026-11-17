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
        "屏風の右端（第1扇）にある巨大な方広寺大仏殿の手前をズームすると、朱塗りの鐘楼（しょうろう）の周りに人が集まっています。そこで子どもは何をしているでしょう？",
      promptEn:
        "Zooming in front of the Great Buddha Hall of Hoko-ji on the far right (Panel 1) reveals people gathered around a vermilion bell tower. What is a child doing there?",
      choices: [
        { id: "c1", labelJa: "丸太（撞木）の綱にぶら下がるようにして鐘をついている", labelEn: "Swinging on the rope of the wooden beam to ring the temple bell" },
        { id: "c2", labelJa: "鐘楼の屋根の上で昼寝をしている", labelEn: "Napping on the roof of the bell tower" },
        { id: "c3", labelJa: "大きな筆で鐘に落書きをしている", labelEn: "Drawing graffiti on the bell with a giant brush" },
        { id: "c4", labelJa: "鐘の下で相撲をとっている", labelEn: "Wrestling sumo underneath the bell" },
      ],
      correctIndex: 0,
      explanationJa:
        "方広寺大仏殿の門前にある朱塗りの鐘楼では、子ども（または小柄な参詣者）が撞木（しゅもく）の綱に体ごとぶら下がるようにして、勢いよく大鐘をつく微笑ましい姿が描かれています。周囲の参詣客もその様子を眺めています。",
      explanationEn:
        "Street performers leading trained monkeys ('sarumawashi') were a popular entertainment on Kyoto's streets and riverbeds, also revered as guardian spirits for horses.",
      jump: { type: "spot", spotId: "quiz_funaki_q1_bell" },
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
      jump: { type: "spot", spotId: "quiz_funaki_q2_river" },
      jumpLabelJa: "五条大橋・賀茂川周辺（第2扇）を見る",
      jumpLabelEn: "View Gojo Bridge & Kamo River (Panel 2)",
    },
    {
      id: "q3",
      order: 3,
      promptJa:
        "四条河原にあるお国歌舞伎や見世物小屋の周辺をズームすると、舞台の下の竹垣（網代垣）の陰でコソコソしている2人の子どもが見つかります。この子どもたちは何をしているでしょう？",
      promptEn:
        "Zooming into the Kabuki theater at Shijo Riverbed reveals two children sneaking near the bamboo fence below the stage. What are they doing?",
      choices: [
        { id: "c1", labelJa: "タダ見（覗き見）をして大人に見つかり、慌てて逃げ出している", labelEn: "Peeking in without paying and running away after being spotted by an adult" },
        { id: "c2", labelJa: "竹垣の修理を手伝っている", labelEn: "Helping repair the bamboo fence" },
        { id: "c3", labelJa: "舞台の上で主役として踊っている", labelEn: "Dancing as the lead performers on stage" },
        { id: "c4", labelJa: "お弁当を広げて昼寝をしている", labelEn: "Having a picnic and napping" },
      ],
      correctIndex: 0,
      explanationJa:
        "四条河原の芝居小屋は木戸銭（入場料）を払って入る有料の娯楽でした。網代垣の隙間からタダ見をしていた2人の子どもが、右側から駆け寄る木戸番の大人に見つかって慌てて逃げ出す、絵師のユーモアあふれる名場面です。",
      explanationEn:
        "Entry to Shijo Riverbed theaters required admission fees. Here, the artist humorously captures two children sneaking a peek through the bamboo fence before fleeing from an approaching attendant.",
      jump: { type: "spot", spotId: "quiz_funaki_q3_kabuki" },
      jumpLabelJa: "四条河原の芝居小屋（覗き見する子ども）を見る",
      jumpLabelEn: "View Shijo Theater Fence (Peeking Children)",
    },
    {
      id: "q4",
      order: 4,
      promptJa:
        "二条城へ向かう駕籠（かご）の行列の後尾、二条通をズームすると、数頭の馬をめぐって大騒ぎが起きている場面が見つかります。どんなハプニングが起きているでしょう？",
      promptEn:
        "Zooming into Nijo Street behind the palanquin procession heading to Nijo Castle reveals a commotion involving several horses. What is happening?",
      choices: [
        { id: "c1", labelJa: "馬が突然暴れ出し、警護や馬丁の男たちが必死に手なずけている", labelEn: "Horses suddenly rear up and bolt while attendants struggle to calm them" },
        { id: "c2", labelJa: "馬たちが整列して昼寝をしている", labelEn: "The horses are lined up fast asleep" },
        { id: "c3", labelJa: "馬が川を泳いで渡っている", labelEn: "The horses are swimming across the river" },
        { id: "c4", labelJa: "馬に豪華な衣装を着せてファッションショーをしている", labelEn: "The horses are dressed up for a parade show" },
      ],
      correctIndex: 0,
      explanationJa:
        "二条城へ続く二条通では、行列の後尾にいた黒馬や白馬が何かに驚いて後ろ足で立ち上がり、馬丁や警護の武士たちが振り落とされまいと必死に手綱を引いて取り押さえる、躍動感たっぷりのハプニングが描かれています。",
      explanationEn:
        "Along Nijo Street behind the procession to Nijo Castle, startled black and white horses rear up while grooms and guards frantically pull the reins to bring them under control.",
      jump: { type: "spot", spotId: "quiz_funaki_q4_horse" },
      jumpLabelJa: "二条通の暴れ馬（行列の後尾）を見る",
      jumpLabelEn: "View Nijo Street Rearing Horses",
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
      jump: { type: "spot", spotId: "quiz_funaki_q5_oxcart" },
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