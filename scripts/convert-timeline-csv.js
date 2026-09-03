/**
 * docs/絵巻関連年表.csv → src/data/chronology/emakiTimeline.js
 *
 * CSV は一次資料として保持し、このスクリプトで以下を機械処理する:
 *  - 西暦の数値化（「1293ごろ」「13世紀後半〜14世紀前半」等を sortYear 化）と時系列ソート
 *  - 時代（平安〜明治）の自動付与
 *  - 絵巻名 → サイトの titleen / href へのリンク付与（EMAKI_LINK_MAP）
 *
 * 実行: node scripts/convert-timeline-csv.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.join(ROOT, "docs", "絵巻関連年表.csv");
const OUT_PATH = path.join(ROOT, "src", "data", "chronology", "emakiTimeline.js");

/** 常に公開されているハブページ（live 判定で href を優先） */
const CHOUJU_HUB = "/chouju-giga/chapters";
const KUSOUZU_HUB = "/kusouzu/chapters-kusouzu";

/**
 * 絵巻名（CSV の文化遺産列に含まれる文字列）→ サイト作品への対応表。
 * 将来、新規絵巻を公開したらここに titleen を足すだけで年表にリンクが生える。
 * titleen のみ指定した作品は live 判定を build 時に自動で行う。
 */
const EMAKI_LINK_MAP = [
  {
    match: "源氏物語絵巻",
    links: [{ titleen: "genjimonogatari-emaki-tokugawa" }],
  },
  {
    match: "伴大納言絵巻",
    links: [{ titleen: "ban-dainagon-ekotoba_upper" }],
  },
  {
    match: "信貴山縁起絵巻",
    links: [{ titleen: "shigisan-engi-emaki_upper" }],
  },
  {
    match: "鳥獣人物戯",
    links: [
      { name: "鳥獣人物戯画一覧（全4巻）", href: CHOUJU_HUB },
      { titleen: "Chōjū-jinbutsu-giga_first" },
    ],
  },
  {
    match: "年中行事絵巻",
    links: [{ titleen: "annual-events-handscroll_16" }],
  },
  {
    match: "地獄草紙",
    links: [
      { titleen: "jigokusoushi_anzyuin" },
      { titleen: "jigokusoushi_masuda_kou" },
    ],
  },
  {
    match: "餓鬼草紙",
    links: [{ titleen: "gakisoushi_kawamoto" }],
  },
  {
    match: "紫式部日記絵巻",
    links: [{ titleen: "murasaki-shikibu-nikki-emaki" }],
  },
  {
    match: "西行物語絵巻",
    links: [{ titleen: "saigyomonogatariemaki" }],
  },
  {
    match: "絵師草紙",
    links: [{ titleen: "eshi-no-soshi_tohaku" }],
  },
  {
    match: "直幹申文絵詞",
    links: [{ titleen: "naomoto_moushibumi_ekotoba" }],
  },
  {
    match: "長谷雄",
    links: [{ titleen: "haseozoushi-mohon" }],
  },
  {
    match: "鶴図下絵和歌巻",
    links: [{ titleen: "tsuruzusitaewakamaki" }],
  },
  {
    match: "檀林皇后九相観",
    links: [
      { name: "九相図一覧（全十場面）", href: KUSOUZU_HUB },
      { titleen: "nine-stages-of-decay-empress-danrin" },
    ],
  },
  {
    match: "小野小町九相図",
    links: [{ titleen: "kusouzu_wellcome_noble_lady" }],
  },
  {
    match: "鎮火安心図巻",
    links: [{ titleen: "fire-fighting-edo-period" }],
  },
  {
    match: "江戸の華",
    links: [{ titleen: "flowers-of-edo" }],
  },
  {
    match: "神田神社祭礼図",
    links: [{ titleen: "kanda-shrine-festival-chart" }],
  },
  {
    match: "徳川種姫婚礼行列図",
    links: [{ titleen: "tokugawatanehimegyouretuzu" }],
  },
  {
    match: "道成寺絵巻",
    links: [{ titleen: "dojoji-emaki-kokkai" }],
  },
  {
    match: "安政大地震災禍図巻",
    links: [{ titleen: "ansei-edo-earthquake" }],
  },
  {
    match: "九相図（小林永濯）",
    links: [
      { name: "九相図一覧（全十場面）", href: KUSOUZU_HUB },
      { name: "九相図（小林永濯）", titleen: "kusouzu_kobayasieieitaku" },
    ],
  },
  {
    match: "東海道五十三次絵巻",
    links: [{ titleen: "tokaidou" }],
  },
  {
    match: "修羅道絵巻",
    links: [{ titleen: "syuradou" }],
  },
  {
    match: "熱国之巻",
    links: [{ titleen: "nekkokunomaki" }],
  },
];

/** CSV に無いがサイトの主力コンテンツ（九相図系）の追記行。 */
const EXTRA_ROWS = [
  {
    yearText: "13世紀",
    year: 1250,
    politics: "",
    emperor: "",
    eraName: "",
    arts: "九相図巻（くそうずまき）",
    regent: "",
    culture: "仏教の観想画として九相図が描かれる",
    emakiLinks: [
      { name: "九相図一覧（全十場面）", href: KUSOUZU_HUB },
      { titleen: "kusouzumaki" },
    ],
  },
  {
    yearText: "15世紀",
    year: 1450,
    politics: "",
    emperor: "",
    eraName: "",
    arts: "九相詩絵巻",
    regent: "",
    culture: "",
    emakiLinks: [{ titleen: "kusoushiemaki" }],
  },
];

/** 西暦 → 時代。boundary はサイトの絵巻メタ（地獄草紙=平安 / 鳥獣丁=鎌倉）に合わせ 1192 を使用 */
const ERA_BY_YEAR = [
  { min: 794, max: 1191, era: "平安", eraen: "heiann" },
  { min: 1192, max: 1335, era: "鎌倉", eraen: "kamakura" },
  { min: 1336, max: 1572, era: "室町", eraen: "muromachi" },
  { min: 1573, max: 1602, era: "安土・桃山", eraen: "aduchimomoyama" },
  { min: 1603, max: 1867, era: "江戸", eraen: "edo" },
  { min: 1868, max: 1912, era: "明治", eraen: "meiji" },
];

/**
 * 年号列をソート用の数値に変換する。
 * - "1293ごろ" → 1293
 * - "1324〜26ごろ" → 1324
 * - "13世紀後半〜14世紀前半" → 1300（13世紀後半=1251〜1300 / 14世紀前半=1301〜1350 の中点）
 */
function parseSortYear(raw) {
  const s = String(raw ?? "").trim();
  const rangeMatch = s.match(/(\d+)世紀(後半)?/g);
  if (rangeMatch && rangeMatch.length >= 1) {
    let start = Infinity;
    let end = -Infinity;
    rangeMatch.forEach((part) => {
      const m = part.match(/^(\d+)世紀(後半)?$/);
      const century = parseInt(m[1], 10);
      const base = (century - 1) * 100 + 1;
      const partStart = m[2] === "後半" ? base + 50 : base;
      const partEnd = m[2] === "後半" ? base + 100 : base + 49;
      start = Math.min(start, partStart);
      end = Math.max(end, partEnd);
    });
    return Math.round((start + end) / 2);
  }
  const plain = s.match(/(\d{3,4})/);
  return plain ? parseInt(plain[1], 10) : 0;
}

function eraByYear(year) {
  return ERA_BY_YEAR.find((e) => year >= e.min && year <= e.max) ?? null;
}

function csvParse(lines) {
  return lines
    .filter((line) => line.trim() !== "")
    .slice(1)
    .map((line) => {
      const cols = line.split(",");
      return {
        year: cols[0]?.trim() ?? "",
        politics: cols[1]?.trim() ?? "",
        emperor: cols[2]?.trim() ?? "",
        eraName: cols[3]?.trim() ?? "",
        arts: cols[4]?.trim() ?? "",
        regent: cols[5]?.trim() ?? "",
        culture: cols[6]?.trim() ?? "",
      };
    });
}

function buildEmakiLinks(artsText) {
  const matched = [];
  for (const { match, links } of EMAKI_LINK_MAP) {
    if (artsText.includes(match)) matched.push(...links);
  }
  return matched;
}

function main() {
  const raw = fs.readFileSync(CSV_PATH, "utf-8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/);
  const csvRows = csvParse(lines);

  const siteMap = {};
  try {
    const dataEmakis = require(path.join(ROOT, "local-data", "pipeline", "dataEmakis.json"));
    dataEmakis.forEach((item) => {
      siteMap[item.titleen] = item;
    });
  } catch (e) {
    console.warn("[convert-timeline] dataEmakis.json を読めませんでした:", e.message);
  }

  const rows = csvRows.map((row, index) => {
    const sortYear = parseSortYear(row.year);
    const emaki = buildEmakiLinks(row.arts).map((link) => {
      const site = link.titleen ? siteMap[link.titleen] : null;
      return {
        name: link.name || site?.title || link.titleen || "",
        titleen: link.titleen || "",
        href: link.href || "",
      };
    });
    return {
      year: sortYear,
      yearText: sortYear > 0 && /^\d+$/.test(row.year) ? null : row.year || null,
      politics: row.politics,
      emperor: row.emperor,
      eraName: row.eraName,
      arts: row.arts,
      regent: row.regent,
      culture: row.culture,
      emaki,
    };
  });

  const extraRows = EXTRA_ROWS.map((row) => {
    const emaki = row.emakiLinks.map((link) => {
      const site = link.titleen ? siteMap[link.titleen] : null;
      return {
        name: link.name || site?.title || link.titleen || "",
        titleen: link.titleen || "",
        href: link.href || "",
      };
    });
    return {
      year: row.year,
      yearText: row.yearText,
      politics: row.politics,
      emperor: row.emperor,
      eraName: row.eraName,
      arts: row.arts,
      regent: row.regent,
      culture: row.culture,
      emaki,
    };
  });

  const allRows = [...rows, ...extraRows].sort((a, b) => a.year - b.year);

  // 時代付与: サイトに作品があればその時代を優先（例: 絵師草紙=鎌倉）
  const enriched = allRows.map((row) => {
    const siteEra = row.emaki
      .map((e) => (e.titleen && siteMap[e.titleen] ? siteMap[e.titleen] : null))
      .find(Boolean);
    const era = siteEra?.era || eraByYear(row.year)?.era || "平安";
    const eraen = siteEra?.eraen || eraByYear(row.year)?.eraen || "heiann";
    return { ...row, era, eraen };
  });

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  const out = `// GENERATED FILE — 手動編集しない。再生成: node scripts/convert-timeline-csv.js
// 出典: docs/絵巻関連年表.csv（一次資料）+ 追記行（九相図系）

const ja = ${JSON.stringify(enriched, null, 2)};

// 本文の英語翻訳は未着手のため空配列。ページ側で ja にフォールバックする。
const en = [];

export { ja, en };
`;

  fs.writeFileSync(OUT_PATH, out, "utf-8");
  console.log(`[convert-timeline] ${enriched.length} 行を ${path.relative(ROOT, OUT_PATH)} に書き出しました。`);
}

main();
