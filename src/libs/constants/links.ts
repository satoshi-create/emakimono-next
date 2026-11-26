export const CHOUJU_GIGA_HUB_PATH = "/hub/chouju-giga";
export const KUSOUZU_HUB_PATH = "/hub/kusouzu";
export const HYAKKI_HUB_PATH = "/hub/hyakki";
export const RAKUCHU_RAKUGAI_HUB_PATH = "/hub/rakuchu-rakugai";
export const BYOBU_HUB_PATH = "/byobu";

/** トップ「最新の絵巻」キュレーション。新規公開時は先頭に追加（最大5枠）。 */
export const HOME_LATEST_SCROLLS = [
  { titleen: "rakuchu_rakugai_funaki", publishedAt: "2026-11-15", order: 1 },
  { titleen: "rakuchu_rakugai_met", publishedAt: "2026-11-15", order: 2 },
  { titleen: "rakuchu_rakugai_fukuoka", publishedAt: "2026-11-15", order: 3 },
  { titleen: "genjimonogatari-emaki-tokugawa", publishedAt: "2026-09-05", order: 4 },
  { titleen: "naomoto_moushibumi_ekotoba", publishedAt: "2026-09-03", order: 5 },
  { titleen: "hyakki_utokyo", publishedAt: "2026-08-28", order: 6 },
  { titleen: "hyakki_kokkai_a", publishedAt: "2026-08-28", order: 7 },
  { titleen: "hyakki_no_zu_nichibun", publishedAt: "2026-08-28", order: 8 },
];

export const HOME_LATEST_TITLEEN = HOME_LATEST_SCROLLS.map((s) => s.titleen);

export const NOTION_CONTACT_URL =
  "https://sour-brain-48f.notion.site/2f3994f0dfcd80409097f4cb44d2a80a?pvs=105";

/** English contact form (Notion). */
export const NOTION_CONTACT_URL_EN =
  "https://sour-brain-48f.notion.site/cd0994f0dfcd83bca239819bbac61635?pvs=105";

/** Select the contact form URL by locale (ja / en). */
export const getContactUrl = (locale: string): string =>
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
  { labelKey: "nav.items.guide.label", path: "/guide" },
  { labelKey: "nav.items.copyright.label", path: "/copyright" },
  { labelKey: "nav.items.privacy.label", path: "/privacy" },
  { labelKey: "nav.items.terms.label", path: "/terms" },
];

export const relatedSiteLinks = [
  { labelKey: "nav.items.about.label", path: "/about" },
  { labelKey: "nav.items.timeline.label", path: "/timeline" },
  ...legalLinks,
];

/** Sidebar hamburger menu groups (Explore / Learn / Site). */
export const navGroups = [
  {
    id: "explore",
    labelKey: "nav.groupExplore",
    links: [
      { labelKey: "nav.items.emaki.label", path: "/type/emaki" },
      { labelKey: "nav.items.byobu.label", path: BYOBU_HUB_PATH },
      { labelKey: "nav.items.themeHubs.label", path: "/hub" },
      { labelKey: "nav.items.ranking.label", path: "/ranking" },
      {
        labelKey: "nav.items.personalBoard.label",
        path: "/board/personal",
      },
    ],
  },
  {
    id: "learn",
    labelKey: "nav.groupLearn",
    links: [
      {
        labelKey: "nav.items.mangaRoots.label",
        path: "/manga-roots",
      },
      { labelKey: "nav.items.timeline.label", path: "/timeline" },
      { labelKey: "nav.items.guide.label", path: "/guide" },
    ],
  },
  {
    id: "site",
    labelKey: "nav.groupSite",
    links: [
      { labelKey: "nav.items.copyright.label", path: "/copyright" },
      { labelKey: "nav.items.privacy.label", path: "/privacy" },
      { labelKey: "nav.items.terms.label", path: "/terms" },
    ],
  },
];

/** Desktop header nav + footer main links. */
export const primaryNavLinks = [
  { labelKey: "nav.items.home.label", id: "home", path: "/", submenu: "" },
  {
    labelKey: "nav.items.emaki.label",
    id: "emaki",
    path: "/type/emaki",
    submenu: "",
  },
  {
    labelKey: "nav.items.ranking.label",
    id: "ranking",
    path: "/ranking",
    submenu: "",
  },
  {
    labelKey: "nav.items.timeline.label",
    id: "timeline",
    path: "/timeline",
    submenu: "",
  },
  {
    labelKey: "nav.items.about.label",
    id: "about",
    path: "/about",
    submenu: "",
  },
];

/** @deprecated Use navGroups in SidebarHome. */
export const sidebarExtraLinks = navGroups.flatMap((g) => g.links);

const links = primaryNavLinks;

export default links;
