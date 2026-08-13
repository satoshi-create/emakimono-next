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

const links = [
  { name: "ホーム", nameen: "Home", id: "home", path: "/", submenu: "" },
  {
    name: "About",
    nameen: "About",
    id: "about",
    path: "/about",
    submenu: "",
  },
  {
    name: "絵巻一覧",
    nameen: "Emaki Gallery",
    id: "emaki",
    path: "/type/emaki",
    submenu: "",
  },
  {
    name: "年表",
    nameen: "Timeline",
    id: "timeline",
    path: "/timeline",
    submenu: "",
  },
  // {
  //   name: "お問い合わせ",
  //   nameen: "Contact",
  //   id: "contact",
  //   path: "/type/emaki",
  //   submenu: "",
  // },
];

export const CHOUJU_GIGA_HUB_PATH = "/chouju-giga/chapters";
export const KUSOUZU_HUB_PATH = "/kusouzu/chapters-kusouzu";

export const sidebarExtraLinks = [
  {
    name: "絵巻物ランキング",
    nameen: "Emaki Rankings",
    path: "/ranking",
  },
  {
    name: "絵巻物と日本史の年表",
    nameen: "Emaki Timeline",
    path: "/timeline",
  },
  ...legalLinks,
];

export default links;
