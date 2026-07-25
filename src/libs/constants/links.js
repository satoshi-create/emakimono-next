export const NOTION_CONTACT_URL =
  "https://sour-brain-48f.notion.site/2f3994f0dfcd80409097f4cb44d2a80a?pvs=105";

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
  { name: "プライバシー", nameen: "Privacy", path: "/privacy" },
  { name: "利用規約", nameen: "Terms", path: "/terms" },
];

export const relatedSiteLinks = [
  { name: "About", nameen: "About", path: "/about" },
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
  // {
  //   name: "お問い合わせ",
  //   nameen: "Contact",
  //   id: "contact",
  //   path: "/type/emaki",
  //   submenu: "",
  // },
];

export const sidebarExtraLinks = [
  {
    name: "絵巻物ランキング",
    nameen: "Emaki Rankings",
    path: "/ranking",
  },
  ...legalLinks,
];

export default links;
