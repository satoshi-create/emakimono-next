import React, { useRef, useLayoutEffect } from "react";

const SmoothScrolling = () => {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    const container = containerRef.current;

    const handleScroll = () => {
      console.log("mount:start smooth scroll");
      // Smoothly scroll to the top of the container
      container.scrollTo({
        top: 100,
        behavior: "smooth",
      });
    };

    // Scroll to the top when the component is mounted
    handleScroll();

    // Add event listener to scroll to the top on subsequent scrolls
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      console.log("unmout:remove scroll event");
    };
  }, []);

  return (
    <div ref={containerRef}>
      {items.map((item, i) => (
        <div key={i}>
          <div>{item.id}</div>
          <div>{item.title}</div>
          <div>{item.desc}</div>
          <div>{item.descen}</div>
        </div>
      ))}
    </div>
  );
};

const items = [
  {
    id: "1",
    image: "/cyoujyuu_yamazaki_kou_13-1080.webp",
    title: "鳥獣人物戯画絵巻 甲巻",
    path: "cyoujyujinbutsugiga_kou#5",
    desc: "猿は蛙たちの怒りを買い...",
    descen: "The monkey got angry with the frogs...",
    eracolor: "orange",
    bln: false,
  },
  {
    id: "2",
    image: "/haseozoushi_17-1080.webp",
    title: "長谷雄草紙",
    path: "haseozoushi#5",
    desc: "長谷雄が一心に祈ると、鬼は退散し...",
    descen: "Haseo prayed earnestly, and the demon disappeared...",
    eracolor: "green",
    bln: false,
  },
  {
    id: "3",
    image: "/kusouzu_01-1080.webp",
    title: "九相図巻",
    path: "kusouzumaki#5",
    desc: "美しい女性の肉体は無常にも蝕まれ...",
    descen: "A beautiful woman's body is constantly undermined...",
    eracolor: "green",
    bln: false,
  },
  {
    id: "4",
    image: "/tokugawagyouretsu_16-1080.webp",
    title: "徳川種姫婚礼行列図",
    path: "tokugawatanehimegyouretuzu#5",
    desc: "ぞろぞろと婚礼の行列は続いていき...",
    descen: "The wedding procession goes on and on...",
    eracolor: "skyblue",
    bln: false,
  },
  {
    id: "5",
    image: "/jigokusoushi_genke_08-1080.webp",
    title: "地獄草紙（原家本）　",
    path: "jigokusoushi_genke#5",
    desc: "地獄に落ちた亡者は火炎を上げる鶏に襲われ...",
    descen: "The dead who fell into hell are attacked by flaming chickens...",
    eracolor: "orange",
    bln: false,
  },
  {
    id: "6",
    image: "/nayotake_08-800.webp",
    title: "奈与竹物語絵巻",
    path: "nayotakemonogatariemaki#6",
    desc: "姫に恋い焦がれたミカドは陰陽師に使いをだし...",
    descen:
      "Mikado, in love with the princess, sends a messenger to the Yin-Yang Master...",
    eracolor: "green",
    bln: false,
  },
  {
    id: "7",
    image: "/tsuruzusitaewakamaki_10-1080.webp",
    title: "鶴図下絵和歌巻",
    path: "tsuruzusitaewakamaki#10",
    desc: "宗達と光悦のコラボが蘇る鶴の舞！！",
    descen: "Sotatsu and Koetsu's Collaboration Revives the Crane Dance！！",
    eracolor: "gold",
    bln: false,
  },
  {
    id: "8",
    image: "/gakisoushi_kawamoto_03-800.webp",
    title: "餓鬼草紙（川本本）",
    path: "gakisoushi_kawamoto",
    desc: "伺　嬰　児　便　飢　餓",
    descen: "asking about infants, stools, starvation",
    eracolor: "orange",
    bln: false,
  },
  {
    id: "9",
    image: "/syuradou_11-1080.webp",
    title: "修羅道絵巻",
    path: "syuradou#10",
    desc: "明治の絵師が描いた修羅絵巻",
    descen: "Shura Emaki painted by a painter of the Meiji era",
    eracolor: "firebrick",
    bln: false,
  },
  {
    id: "10",
    image: "/cyoujyuu_yamazaki_hei_16-800.webp",
    title: "鳥獣人物戯画絵巻 丙巻",
    path: "cyoujyujinbutsugiga_hei#26",
    desc: "もうひとつの鳥獣人物戯画絵巻",
    descen:
      "Another Picture Scroll of Caricatures of Birds, Beasts, and Humans",
    eracolor: "orange",
    bln: false,
  },
  {
    id: "1",
    image: "/cyoujyuu_yamazaki_kou_13-1080.webp",
    title: "鳥獣人物戯画絵巻 甲巻",
    path: "cyoujyujinbutsugiga_kou#5",
    desc: "猿は蛙たちの怒りを買い...",
    descen: "The monkey got angry with the frogs...",
    eracolor: "orange",
    bln: false,
  },
  {
    id: "2",
    image: "/haseozoushi_17-1080.webp",
    title: "長谷雄草紙",
    path: "haseozoushi#5",
    desc: "長谷雄が一心に祈ると、鬼は退散し...",
    descen: "Haseo prayed earnestly, and the demon disappeared...",
    eracolor: "green",
    bln: false,
  },
  {
    id: "3",
    image: "/kusouzu_01-1080.webp",
    title: "九相図巻",
    path: "kusouzumaki#5",
    desc: "美しい女性の肉体は無常にも蝕まれ...",
    descen: "A beautiful woman's body is constantly undermined...",
    eracolor: "green",
    bln: false,
  },
  {
    id: "4",
    image: "/tokugawagyouretsu_16-1080.webp",
    title: "徳川種姫婚礼行列図",
    path: "tokugawatanehimegyouretuzu#5",
    desc: "ぞろぞろと婚礼の行列は続いていき...",
    descen: "The wedding procession goes on and on...",
    eracolor: "skyblue",
    bln: false,
  },
  {
    id: "5",
    image: "/jigokusoushi_genke_08-1080.webp",
    title: "地獄草紙（原家本）　",
    path: "jigokusoushi_genke#5",
    desc: "地獄に落ちた亡者は火炎を上げる鶏に襲われ...",
    descen: "The dead who fell into hell are attacked by flaming chickens...",
    eracolor: "orange",
    bln: false,
  },
  {
    id: "6",
    image: "/nayotake_08-800.webp",
    title: "奈与竹物語絵巻",
    path: "nayotakemonogatariemaki#6",
    desc: "姫に恋い焦がれたミカドは陰陽師に使いをだし...",
    descen:
      "Mikado, in love with the princess, sends a messenger to the Yin-Yang Master...",
    eracolor: "green",
    bln: false,
  },
  {
    id: "7",
    image: "/tsuruzusitaewakamaki_10-1080.webp",
    title: "鶴図下絵和歌巻",
    path: "tsuruzusitaewakamaki#10",
    desc: "宗達と光悦のコラボが蘇る鶴の舞！！",
    descen: "Sotatsu and Koetsu's Collaboration Revives the Crane Dance！！",
    eracolor: "gold",
    bln: false,
  },
  {
    id: "8",
    image: "/gakisoushi_kawamoto_03-800.webp",
    title: "餓鬼草紙（川本本）",
    path: "gakisoushi_kawamoto",
    desc: "伺　嬰　児　便　飢　餓",
    descen: "asking about infants, stools, starvation",
    eracolor: "orange",
    bln: false,
  },
  {
    id: "9",
    image: "/syuradou_11-1080.webp",
    title: "修羅道絵巻",
    path: "syuradou#10",
    desc: "明治の絵師が描いた修羅絵巻",
    descen: "Shura Emaki painted by a painter of the Meiji era",
    eracolor: "firebrick",
    bln: false,
  },
  {
    id: "10",
    image: "/cyoujyuu_yamazaki_hei_16-800.webp",
    title: "鳥獣人物戯画絵巻 丙巻",
    path: "cyoujyujinbutsugiga_hei#26",
    desc: "もうひとつの鳥獣人物戯画絵巻",
    descen:
      "Another Picture Scroll of Caricatures of Birds, Beasts, and Humans",
    eracolor: "orange",
    bln: false,
  },
];

export default SmoothScrolling;
