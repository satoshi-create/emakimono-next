/**
 * 絵巻物 × 日本史の簡易年表（手動キュレーション）。
 *
 * 詳細版（emakiTimeline.js）は CSV 全行をテーブル化するが、本データは
 * 「歴史の流れ → そこで生まれた絵巻」の因果ストーリーに絞った厳選版。
 * スマホでさくっと関連を追うためのもの。ja/en 両方を手動で更新する。
 *
 * emaki 要素の形式は詳細版と同じ { name, titleen, href }。
 * - href（ハブページ）は常に公開
 * - titleen はビューア公開中のみリンク化し、未公開は「準備中」表示になる
 */
const ja = [
  {
    era: "平安",
    eraen: "heiann",
    period: "794〜1191",
    catch: "貴族の文化が花開き、絵巻物が生まれた時代",
    keywords: ["国風文化", "末法思想", "院政"],
    entries: [
      {
        year: 1052,
        event: "末法の世へ",
        story:
          "1052年を境に「末法」に入るとされ、浄土信仰が流行。死後の世界への不安が、地獄や餓鬼を描く絵巻を生みます。",
        emaki: [
          { name: "地獄草紙（安住院本）", titleen: "jigokusoushi_anzyuin" },
          { name: "地獄草紙（益田家甲本）", titleen: "jigokusoushi_masuda_kou" },
          { name: "餓鬼草紙（河本家本）", titleen: "gakisoushi_kawamoto" },
        ],
      },
      {
        year: 1098,
        event: "源氏物語の絵巻化",
        story:
          "宮廷で愛された物語文学が、絵巻物として美しく描かれます。国風文化の集大成です。",
        emaki: [{ name: "源氏物語絵巻", titleen: "genjimonogatari-emaki-tokugawa" }],
      },
      {
        year: 1124,
        event: "応天門の変を描く",
        story:
          "866年の宮廷の政変を題材に、迫真の筆致で物語る「絵語り」の傑作です。",
        emaki: [{ name: "伴大納言絵詞", titleen: "ban-dainagon-ekotoba_upper" }],
      },
      {
        year: 1140,
        event: "院政期の遊び心",
        story:
          "院政期の洒脱な貴族の空気が、動物を擬人化した戯画を生みます。「日本最古の漫画」とも呼ばれる作品です。",
        emaki: [
          { name: "鳥獣戯画一覧（全4巻）", href: "/chouju-giga/chapters" },
          { name: "鳥獣人物戯画（甲巻）", titleen: "Chōjū-jinbutsu-giga_first" },
        ],
      },
      {
        year: 1177,
        event: "年中行事の記録",
        story:
          "宮中の雅やかな行事を、儀式の記録として絵巻に残します。院政期の文化の華やかさを伝えます。",
        emaki: [{ name: "年中行事絵巻", titleen: "annual-events-handscroll_16" }],
      },
    ],
  },
  {
    era: "鎌倉",
    eraen: "kamakura",
    period: "1192〜1335",
    catch: "武士の世が始まり、仏教が民衆に広がった時代",
    keywords: ["鎌倉幕府", "武家文化", "民衆仏教"],
    entries: [
      {
        year: 1213,
        event: "日記文学の絵巻化",
        story:
          "貴族の日記文学や、出家した歌人・西行の物語が、絵巻として後世に伝えられます。",
        emaki: [
          { name: "紫式部日記絵巻", titleen: "murasaki-shikibu-nikki-emaki" },
          { name: "西行物語絵巻", titleen: "saigyomonogatariemaki" },
        ],
      },
      {
        year: 1250,
        event: "九相図の成立",
        story:
          "仏教の無常観が、人の死骸の変化を九段階に描く九相図を生みます。観想のための絵巻です。",
        emaki: [
          { name: "九相図一覧（全十場面）", href: "/kusouzu/chapters-kusouzu" },
          { name: "九相図巻", titleen: "kusouzumaki" },
        ],
      },
      {
        year: 1293,
        event: "蒙古襲来の記録",
        story:
          "1274・1281の元寇。危機を乗り越えた記憶を、朝廷が記録の絵詞として残します。",
        emaki: [{ name: "蒙古襲来絵詞", titleen: "" }],
      },
      {
        year: 1326,
        event: "市井の職人たち",
        story:
          "都に生きる絵師や男の物語を、軽妙な筆致で活写します。描かれる主役が広がった時代です。",
        emaki: [
          { name: "絵師草紙", titleen: "eshi-no-soshi_tohaku" },
          { name: "直幹申文絵詞", titleen: "naomoto_moushibumi_ekotoba" },
        ],
      },
    ],
  },
  {
    era: "室町",
    eraen: "muromachi",
    period: "1336〜1572",
    catch: "禅や水墨画が栄え、戦乱の記憶も絵巻に残った時代",
    keywords: ["南北朝", "禅宗", "水墨画"],
    entries: [
      {
        year: 1347,
        event: "合戦の記憶",
        story:
          "後三年の役（1083〜87）の記憶が、合戦絵巻として描き直され、戦乱の時代に語り継がれます。",
        emaki: [{ name: "後三年合戦絵巻", titleen: "" }],
      },
      {
        year: 1351,
        event: "武士の帰依",
        story:
          "戦乱の世にあって、武士たちの仏教への帰依を描く絵巻が作られます。",
        emaki: [{ name: "慕帰絵詞", titleen: "" }],
      },
      {
        year: 1450,
        event: "九相詩の成立",
        story:
          "九相図に詩を添えた九相詩絵巻が生まれ、絵画と文学が結びつきます。",
        emaki: [{ name: "九相詩絵巻", titleen: "kusoushiemaki" }],
      },
      {
        year: 1485,
        event: "付喪神絵巻の存在",
        story:
          "三条西実隆の『実隆公記』に「付喪神絵」上下を見た記録があり、御伽草子系の付喪神絵巻が室町後期にはすでに存在していたことがわかります。",
        emaki: [{ name: "付喪神絵巻", titleen: "tsukumogami" }],
      },
    ],
  },
  {
    era: "安土・桃山",
    eraen: "aduchimomoyama",
    period: "1573〜1602",
    catch: "桃山文化の華やかさが、書と絵が融合した工芸的な絵巻を生んだ時代",
    keywords: ["桃山文化", "茶の湯", "琳派"],
    entries: [
      {
        year: 1602,
        event: "光悦と宗達の合作",
        story:
          "本阿弥光悦の書と俵屋宗達の下絵が融合し、桃山から江戸へつづく工芸美を絵巻で表現します。",
        emaki: [{ name: "鶴図下絵和歌巻", titleen: "tsuruzusitaewakamaki" }],
      },
    ],
  },
  {
    era: "江戸",
    eraen: "edo",
    period: "1603〜1867",
    catch: "町人の文化が花開き、記録や信仰が絵巻に描かれた時代",
    keywords: ["町人文化", "浮世絵", "九相図の再生"],
    entries: [
      {
        year: 1700,
        event: "九相図の再生",
        story:
          "古典の題材が江戸の仏教画としてよみがえり、檀林皇后や小野小町をモデルに描かれます。",
        emaki: [
          { name: "九相図一覧（全十場面）", href: "/kusouzu/chapters-kusouzu" },
          {
            name: "檀林皇后九相観",
            titleen: "nine-stages-of-decay-empress-danrin",
          },
          {
            name: "小野小町九相図",
            titleen: "kusouzu_wellcome_noble_lady",
          },
        ],
      },
      {
        year: 1800,
        event: "江戸の暮らしを描く",
        story:
          "火消しや祭礼、婚礼など、江戸の町の活気が絵巻に記録されます。",
        emaki: [
          { name: "鎮火安心図巻", titleen: "fire-fighting-edo-period" },
          { name: "江戸の華", titleen: "flowers-of-edo" },
          { name: "神田神社祭礼図", titleen: "kanda-shrine-festival-chart" },
          {
            name: "徳川種姫婚礼行列図",
            titleen: "tokugawatanehimegyouretuzu",
          },
          { name: "道成寺絵巻", titleen: "dojoji-emaki-kokkai" },
        ],
      },
      {
        year: 1855,
        event: "安政の大地震",
        story:
          "1855年の大地震の被害を記録した絵巻が作られ、江戸の災害の記憶を伝えます。",
        emaki: [{ name: "安政大地震災禍図巻", titleen: "ansei-edo-earthquake" }],
      },
    ],
  },
  {
    era: "明治",
    eraen: "meiji",
    period: "1868〜1912",
    catch: "西洋の影響を受けながらも、伝統の絵巻が描き継がれた時代",
    keywords: ["文明開化", "浮世絵の流れ", "近代日本画"],
    entries: [
      {
        year: 1880,
        event: "浮世絵師の九相図",
        story:
          "小林永濯が近世の娼婦をモデルに九相図を描き、江戸の感性を明治に引き継ぎます。",
        emaki: [
          { name: "九相図一覧（全十場面）", href: "/kusouzu/chapters-kusouzu" },
          { name: "九相図（小林永濯）", titleen: "kusouzu_kobayasieieitaku" },
        ],
      },
      {
        year: 1890,
        event: "風景と物語の絵巻",
        story:
          "東海道や修羅道など、浮世絵のテーマが絵巻として描き継がれます。",
        emaki: [
          { name: "東海道五十三次絵巻", titleen: "tokaidou" },
          { name: "修羅道絵巻", titleen: "syuradou" },
          { name: "熱国之巻", titleen: "nekkokunomaki" },
        ],
      },
    ],
  },
];

const en = [
  {
    era: "Heian",
    eraen: "heiann",
    period: "794–1191",
    catch: "The age when aristocratic culture blossomed and emaki were born",
    keywords: ["National culture", "Mappō", "Insei (cloistered rule)"],
    entries: [
      {
        year: 1052,
        event: "The arrival of the Final Dharma",
        story:
          "The year 1052 was seen as the start of the Final Dharma (mappō), and Pure Land faith spread. Anxiety about the afterlife gave rise to scrolls depicting hell and hungry ghosts.",
        emaki: [
          { name: "Jigokusōshi (Anji-in)", titleen: "jigokusoushi_anzyuin" },
          { name: "Jigokusōshi (Masuda)", titleen: "jigokusoushi_masuda_kou" },
          { name: "Gakisōshi (Kawamoto)", titleen: "gakisoushi_kawamoto" },
        ],
      },
      {
        year: 1098,
        event: "The Tale of Genji in pictures",
        story:
          "Courtly tales such as The Tale of Genji were lovingly transcribed into painted scrolls—the culmination of national culture.",
        emaki: [{ name: "Genji Monogatari Emaki", titleen: "genjimonogatari-emaki-tokugawa" }],
      },
      {
        year: 1124,
        event: "The Ōtemmon Incident depicted",
        story:
          "A masterpiece of pictorial storytelling that dramatizes the court intrigue of the Ōtemmon Incident (866).",
        emaki: [{ name: "Ban Dainagon Ekotoba", titleen: "ban-dainagon-ekotoba_upper" }],
      },
      {
        year: 1140,
        event: "Satirical play in the insei age",
        story:
          "The elegant wit of aristocratic society produced caricatures of animals behaving like humans—often called Japan's oldest manga.",
        emaki: [
          { name: "Chōjū-jinbutsu-giga (all 4 scrolls)", href: "/chouju-giga/chapters" },
          { name: "Chōjū-jinbutsu-giga (Kō)", titleen: "Chōjū-jinbutsu-giga_first" },
        ],
      },
      {
        year: 1177,
        event: "Recording annual court events",
        story:
          "The refined ceremonies of the court were preserved as painted records, showing the splendor of the insei age.",
        emaki: [{ name: "Nenchū Gyōji Emaki", titleen: "annual-events-handscroll_16" }],
      },
    ],
  },
  {
    era: "Kamakura",
    eraen: "kamakura",
    period: "1192–1335",
    catch: "The rise of the warrior class and the spread of Buddhism to the people",
    keywords: ["Kamakura shogunate", "Warrior culture", "Popular Buddhism"],
    entries: [
      {
        year: 1213,
        event: "Diaries become scrolls",
        story:
          "Court diaries and the tale of the priest-poet Saigyō were turned into emaki and passed down.",
        emaki: [
          { name: "Murasaki Shikibu Nikki Emaki", titleen: "murasaki-shikibu-nikki-emaki" },
          { name: "Saigyō Monogatari Emaki", titleen: "saigyomonogatariemaki" },
        ],
      },
      {
        year: 1250,
        event: "The kusōzu begin",
        story:
          "The Buddhist idea of impermanence produced kusōzu—scrolls depicting a body's decay in nine stages, made for contemplation.",
        emaki: [
          { name: "Kusōzu (all ten stages)", href: "/kusouzu/chapters-kusouzu" },
          { name: "Kusōzu Maki", titleen: "kusouzumaki" },
        ],
      },
      {
        year: 1293,
        event: "Remembering the Mongol invasions",
        story:
          "After the invasions of 1274 and 1281, the court preserved the memory of the crisis in painted records.",
        emaki: [{ name: "Mōko Shūrai Ekotoba", titleen: "" }],
      },
      {
        year: 1326,
        event: "City folk on scroll",
        story:
          "The lives of a painter and a townsman in the capital were depicted with wit—the subjects of emaki expanded.",
        emaki: [
          { name: "Eshi no Sōshi", titleen: "eshi-no-soshi_tohaku" },
          { name: "Naomoto Moshibumi Ekotoba", titleen: "naomoto_moushibumi_ekotoba" },
        ],
      },
    ],
  },
  {
    era: "Muromachi",
    eraen: "muromachi",
    period: "1336–1572",
    catch: "Zen culture flourished while memories of war remained on scrolls",
    keywords: ["Northern & Southern courts", "Zen Buddhism", "Ink painting"],
    entries: [
      {
        year: 1347,
        event: "Memories of battle",
        story:
          "The Gosannen War (1083–87) was retold as a battle scroll, kept alive through an age of war.",
        emaki: [{ name: "Gosannen Kassen Emaki", titleen: "" }],
      },
      {
        year: 1351,
        event: "Warriors turning to faith",
        story:
          "In turbulent times, scrolls were made depicting warriors' devotion to Buddhism.",
        emaki: [{ name: "Boki Ekotoba", titleen: "" }],
      },
      {
        year: 1450,
        event: "Kusōshi scrolls",
        story:
          "The kusōzu gained accompanying poems, giving rise to kusōshi scrolls that unite painting and literature.",
        emaki: [{ name: "Kusōshi Emaki", titleen: "kusoushiemaki" }],
      },
      {
        year: 1485,
        event: "Tsukumogami scrolls attested",
        story:
          "Sanjonishi Sanetaka's diary (1485) records viewing a two-scroll Tsukumogami painting, showing that otogizoshi-style Tsukumogami scrolls already existed in the late Muromachi period.",
        emaki: [{ name: "Tsukumogami Emaki", titleen: "tsukumogami" }],
      },
    ],
  },
  {
    era: "Azuchi–Momoyama",
    eraen: "aduchimomoyama",
    period: "1573–1602",
    catch: "The splendor of Momoyama culture gave rise to craft-like scrolls blending calligraphy and painting",
    keywords: ["Momoyama culture", "Tea ceremony", "Rinpa"],
    entries: [
      {
        year: 1602,
        event: "Kōetsu & Sōtatsu",
        story:
          "Hon'ami Kōetsu's calligraphy and Tawaraya Sōtatsu's underdrawing come together, expressing the decorative beauty that would continue from Momoyama into Edo.",
        emaki: [{ name: "Tsuru no Shita-e Waka Kan", titleen: "tsuruzusitaewakamaki" }],
      },
    ],
  },
  {
    era: "Edo",
    eraen: "edo",
    period: "1603–1867",
    catch: "Town culture flourished, and records and faith were painted onto scrolls",
    keywords: ["Town culture", "Ukiyo-e", "Kusōzu revival"],
    entries: [
      {
        year: 1700,
        event: "Kusōzu revival",
        story:
          "Classical themes were reborn as Edo-period Buddhist paintings, modeled on Danrin Kōgō and Ono no Komachi.",
        emaki: [
          { name: "Kusōzu (all ten stages)", href: "/kusouzu/chapters-kusouzu" },
          { name: "Danrin Kōgō Kusōkan", titleen: "nine-stages-of-decay-empress-danrin" },
          { name: "Ono no Komachi Kusōzu", titleen: "kusouzu_wellcome_noble_lady" },
        ],
      },
      {
        year: 1800,
        event: "Daily life in Edo",
        story:
          "Fire brigades, festivals, and wedding processions—the vitality of the city was recorded in scrolls.",
        emaki: [
          { name: "Chinka Anshin Zukan", titleen: "fire-fighting-edo-period" },
          { name: "Edo no Hana", titleen: "flowers-of-edo" },
          { name: "Kanda Festival", titleen: "kanda-shrine-festival-chart" },
          { name: "Tokugawa Tane-hime Bridal Procession", titleen: "tokugawatanehimegyouretuzu" },
          { name: "Dōjōji Emaki", titleen: "dojoji-emaki-kokkai" },
        ],
      },
      {
        year: 1855,
        event: "The Ansei earthquake",
        story:
          "A scroll recording the damage of the great earthquake of 1855 preserves the city's memory of disaster.",
        emaki: [{ name: "Ansei Earthquake Scroll", titleen: "ansei-edo-earthquake" }],
      },
    ],
  },
  {
    era: "Meiji",
    eraen: "meiji",
    period: "1868–1912",
    catch: "While absorbing Western influence, the tradition of emaki was carried on",
    keywords: ["Civilization & Enlightenment", "Ukiyo-e legacy", "Modern painting"],
    entries: [
      {
        year: 1880,
        event: "A ukiyo-e artist's kusōzu",
        story:
          "Kobayashi Eitaku painted a kusōzu modeled on a modern courtesan, carrying Edo sensibilities into Meiji.",
        emaki: [
          { name: "Kusōzu (all ten stages)", href: "/kusouzu/chapters-kusouzu" },
          { name: "Kusōzu (Kobayashi Eitaku)", titleen: "kusouzu_kobayasieieitaku" },
        ],
      },
      {
        year: 1890,
        event: "Landscapes and tales",
        story:
          "Themes of ukiyo-e—the Tōkaidō road and the realm of suffering—were painted onto scrolls for a new age.",
        emaki: [
          { name: "Tōkaidō Fifty-three Stations", titleen: "tokaidou" },
          { name: "Shuradō Emaki", titleen: "syuradou" },
          { name: "Nekkoku no Maki", titleen: "nekkokunomaki" },
        ],
      },
    ],
  },
];

export { ja, en };
