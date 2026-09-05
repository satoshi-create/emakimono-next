export const CHOUJU_GIGA_HUB_PATH = "/chouju-giga/chapters";
export const KUSOUZU_HUB_PATH = "/kusouzu/chapters-kusouzu";

/** トップ「最新の絵巻」キュレーション。新規公開時は先頭に追加。 */
export const HOME_LATEST_SCROLLS = [
  { titleen: "genjimonogatari-emaki-tokugawa", publishedAt: "2026-09-05", order: 1 },
  { titleen: "naomoto_moushibumi_ekotoba", publishedAt: "2026-09-03", order: 2 },
  { titleen: "hyakki_utokyo", publishedAt: "2026-08-28", order: 3 },
];

export const HOME_LATEST_TITLEEN = HOME_LATEST_SCROLLS.map((s) => s.titleen);

export const NOTION_CONTACT_URL =
  "https://sour-brain-48f.notion.site/2f3994f0dfcd80409097f4cb44d2a80a?pvs=105";

/** English contact form (Notion). */
export const NOTION_CONTACT_URL_EN =
  "https://sour-brain-48f.notion.site/cd0994f0dfcd83bca239819bbac61635?pvs=105";

/** Select the contact form URL by locale (ja / en). */
export const getContactUrl = (locale) =>
  locale === "en" ? NOTION_CONTACT_URL_EN : NOTION_CONTACT_URL;

export const GITHUB_REPO_URL =
  "https://github.com/satoshi-create/emakimono-next";

export const operatorSocialLinks = [
  { label: "GitHub", url: "https://github.com/satoshi-create" },
  { label: "X（Twitter）", labelEn: "X (Twitter)", url: "https://x.com/enjoy_emakimono" },
  {
    label: "LinkedIn",
    labelEn: "LinkedIn",
    url: "https://www.linkedin.com/in/satoprofile/",
  },
];

export const legalLinks = [
  { name: "使い方ガイド", nameen: "Guide", path: "/guide" },
  { name: "著作権・ライセンス", nameen: "Copyright", path: "/copyright" },
  { name: "プライバシー", nameen: "Privacy", path: "/privacy" },
  { name: "利用規約", nameen: "Terms", path: "/terms" },
];

export const relatedSiteLinks = [
  { name: "About", nameen: "About", path: "/about" },
  {
    name: "絵巻物と日本史の年表",
    nameen: "Emaki Timeline",
    path: "/timeline",
  },
  ...legalLinks,
];

/** Sidebar hamburger menu groups (Explore / Learn / Site). */
export const navGroups = [
  {
    id: "explore",
    labelKey: "nav.groupExplore",
    links: [
      { name: "絵巻一覧", nameen: "Emaki Gallery", path: "/type/emaki" },
      {
        name: "鳥獣人物戯画一覧",
        nameen: "Chōjū-jinbutsu-giga",
        path: CHOUJU_GIGA_HUB_PATH,
      },
      {
        name: "九相図一覧",
        nameen: "Kusōzu Gallery",
        path: KUSOUZU_HUB_PATH,
      },
      { name: "ランキング", nameen: "Rankings", path: "/ranking" },
      { name: "観光マップ", nameen: "Sightseeing Map", path: "/emaki-hub" },
      {
        name: "マンガのルーツ",
        nameen: "Manga Roots",
        path: "/manga-roots",
      },
    ],
  },
  {
    id: "learn",
    labelKey: "nav.groupLearn",
    links: [
      { name: "About", nameen: "About", path: "/about" },
      { name: "年表", nameen: "Timeline", path: "/timeline" },
      { name: "使い方ガイド", nameen: "Guide", path: "/guide" },
    ],
  },
  {
    id: "site",
    labelKey: "nav.groupSite",
    links: [
      { name: "著作権・ライセンス", nameen: "Copyright", path: "/copyright" },
      { name: "プライバシー", nameen: "Privacy", path: "/privacy" },
      { name: "利用規約", nameen: "Terms", path: "/terms" },
    ],
  },
];

/** Desktop header nav + footer main links. */
export const primaryNavLinks = [
  { name: "ホーム", nameen: "Home", id: "home", path: "/", submenu: "" },
  {
    name: "絵巻一覧",
    nameen: "Emaki Gallery",
    id: "emaki",
    path: "/type/emaki",
    submenu: "",
  },
  {
    name: "ランキング",
    nameen: "Rankings",
    id: "ranking",
    path: "/ranking",
    submenu: "",
  },
  {
    name: "年表",
    nameen: "Timeline",
    id: "timeline",
    path: "/timeline",
    submenu: "",
  },
  {
    name: "About",
    nameen: "About",
    id: "about",
    path: "/about",
    submenu: "",
  },
];

/** @deprecated Use navGroups in SidebarHome. */
export const sidebarExtraLinks = navGroups.flatMap((g) => g.links);

const links = primaryNavLinks;

export default links;
