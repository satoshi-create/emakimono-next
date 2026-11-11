import EmakiConteiner from "@/components/emaki/layout/EmakiConteiner";
import EmakiMetadataSection from "@/components/emaki/layout/EmakiMetadataSection";
import ViewerDiscoveryRail from "@/components/discovery/ViewerDiscoveryRail";
import CustomTagCloud from "@/components/keyword/CustomTagCloud";
import Footer from "@/components/layout/Footer";
import { AppContext } from "@/context/AppContext";
import { useSceneLikeCounts } from "@/context/SceneLikeCountsContext";
import styles from "@/styles/EmakiLandscapContent.module.css";
import ExtractingListData from "@/utils/ExtractingListData";
import { isKusouzuScroll } from "@/utils/buildKusouzuHubData";
import { isChojuGigaScroll } from "@/utils/buildChojuGigaHubData";
import { isHyakkiClusterScroll } from "@/utils/buildHyakkiHubData";
import { emakiDisplayTitle } from "@/utils/emakiDisplayTitle";
import {
  filterdKeywords,
  keywordItem,
  useLocaleData,
} from "@/utils/func";
import { faEye, faHeart, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import parse from "html-react-parser";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "next-i18next";

// #region agent log
const dbgRailLandscape = (location, message, data, hypothesisId) => {
  fetch("http://127.0.0.1:7862/ingest/f3f35754-fbbd-48fc-af61-63ae1db56704", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "1249f1",
    },
    body: JSON.stringify({
      sessionId: "1249f1",
      location,
      message,
      data,
      timestamp: Date.now(),
      hypothesisId,
      runId: "post-fix",
    }),
  }).catch(() => {});
};
// #endregion

const EmakiLandscapContent = ({
  data,
  selectedRef,
  navIndex,
  articleRef,
  viewerFullscreen = false,
}) => {
  const { rankingData } = useContext(AppContext);
  const { totalCount } = useSceneLikeCounts();
  const { locale } = useRouter();
  const { t } = useTranslation("common");
  const { t: alldata } = useLocaleData();
  const [railOpen, setRailOpen] = useState(true);
  /** transform 0.42s + レイアウト落ち着き（チラ見えクリック後の開閉チャタリング防止） */
  const RAIL_THEATER_SUPPRESS_MS = 1200;
  /** スクロールでシアター化した直後は境界到達での自動再開を抑止 */
  const RAIL_DISMISS_REOPEN_COOLDOWN_MS = 1200;
  const suppressRailTheaterRef = useRef(0);
  /** チラ見えクリック展開後、展開時 scrollLeft から閾値以上動くまでシアター閉じを無視 */
  const railPinFromExpandRef = useRef(false);
  const railPinScrollLeftRef = useRef(0);
  const railOpenRef = useRef(railOpen);
  const theaterDismissedAtRef = useRef(0);
  const lastScrollCloseNotifyRef = useRef(0);

  useEffect(() => {
    railOpenRef.current = railOpen;
  }, [railOpen]);

  const armRailTheaterSuppress = useCallback(() => {
    suppressRailTheaterRef.current = Date.now() + RAIL_THEATER_SUPPRESS_MS;
  }, []);

  const onUserScrollStart = useCallback(() => {
    const suppressed = Date.now() < suppressRailTheaterRef.current;
    const now = Date.now();
  // #region agent log
    dbgRailLandscape(
      "EmakiLandscapContent:onUserScrollStart",
      suppressed ? "scroll-close-suppressed" : "scroll-close-attempt",
      {
        railOpen: railOpenRef.current,
        suppressed,
        suppressRemainMs: Math.max(
          0,
          suppressRailTheaterRef.current - Date.now()
        ),
        debounceRemainMs: Math.max(
          0,
          120 - (now - lastScrollCloseNotifyRef.current)
        ),
      },
      "A"
    );
  // #endregion
    if (suppressed) return;
    if (!railOpenRef.current || viewerFullscreen) return;
    if (now - lastScrollCloseNotifyRef.current < 120) return;
    lastScrollCloseNotifyRef.current = now;
    theaterDismissedAtRef.current = now;
    railPinFromExpandRef.current = false;
    setRailOpen(false);
  }, [viewerFullscreen]);

  const onReachStartBoundary = useCallback(() => {
    const suppressed = Date.now() < suppressRailTheaterRef.current;
    const dismissCooldown =
      Date.now() - theaterDismissedAtRef.current <
      RAIL_DISMISS_REOPEN_COOLDOWN_MS;
  // #region agent log
    dbgRailLandscape(
      "EmakiLandscapContent:onReachStartBoundary",
      suppressed
        ? "boundary-open-suppressed"
        : dismissCooldown
          ? "boundary-open-dismiss-cooldown"
          : "boundary-open-attempt",
      {
        railOpen: railOpenRef.current,
        suppressed,
        dismissCooldown,
        suppressRemainMs: Math.max(
          0,
          suppressRailTheaterRef.current - Date.now()
        ),
      },
      "B"
    );
  // #endregion
    if (suppressed || dismissCooldown) return;
    if (!railOpenRef.current && !viewerFullscreen) {
      setRailOpen(true);
    }
  }, [viewerFullscreen]);

  useEffect(() => {
  // #region agent log
    dbgRailLandscape(
      "EmakiLandscapContent:railOpen",
      "railOpen-changed",
      { railOpen, viewerFullscreen },
      "D"
    );
  // #endregion
  }, [railOpen, viewerFullscreen]);

  const removeNestedArrayObj = ExtractingListData();
  const allKeywords = keywordItem(removeNestedArrayObj);

  const {
    typeen,
    title,
    titleen,
    edition,
    author,
    authoren,
    desc,
    descen,
    keyword,
  } = data;

  // ランキング順位・閲覧数を検索
  const rankInfo = useMemo(() => {
    const index = rankingData.findIndex((item) => item.titleen === titleen);
    if (index < 0) return null;
    return { rank: index + 1, pageView: rankingData[index].pageView };
  }, [rankingData, titleen]);

  const descTJa = desc
    ? desc
    : `「${title} ${edition ? edition : ""}」${
        author ? `（${author}）` : ""
      }の全シーンを、縦書き、横スクロールで楽しむことができます。`;

  const descTJaSeiyoukaiga = desc
    ? desc
    : `「${title} ${edition ? edition : ""}」${
        author ? `（${author}）` : ""
      }の全シーンを、横スクロールで楽しむことができます。`;

  const descJa = typeen === "seiyoukaiga" ? descTJaSeiyoukaiga : descTJa;

  const descEn = descen
    ? descen
    : `You can enjoy all the scenes of the " ${emakiDisplayTitle(data, "en")} ${
        authoren && `（${authoren}）`
      } " in vertical and right to left scrolling mode.`;

  // 紹介文を「。」/「.」で段落分割して複数 <p> で表示（HTML を含む desc は分割しない）
  const descToParagraphs = (text) => {
    if (!text || text.includes("<")) return null;
    return text
      .split(/(?<=[。.])/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((p, i) => <p key={i}>{p}</p>);
  };

  const editionLinks = alldata.filter(
    (item) => item.title === title && item.edition !== edition,
  );

  const LinksToKusouzu = alldata.filter(
    (item) => isKusouzuScroll(item) && item.titleen !== titleen,
  );

  const LinksToChojuGiga = alldata.filter(
    (item) => isChojuGigaScroll(item) && item.titleen !== titleen,
  );

  const LinksToHyakki = alldata.filter(
    (item) => isHyakkiClusterScroll(item) && item.titleen !== titleen,
  );

  const isKusouzu = isKusouzuScroll(data);
  const isChojuGiga = isChojuGigaScroll(data);
  const isHyakki = isHyakkiClusterScroll(data);

  return (
    <>
      <div
        className={
          viewerFullscreen ? styles.fullscreenShell : "emaki-page-landscape-grid"
        }
      >
        <div
          className={
            viewerFullscreen
              ? styles.fullscreenViewer
              : `${styles.wrapper}${railOpen ? "" : ` ${styles.theater}`}`
          }
        >
          <div
            className={viewerFullscreen ? null : styles.viewerCell}
          >
            <EmakiConteiner
              key={data.id}
              data={{ ...data }}
              scroll={true}
              selectedRef={selectedRef}
              navIndex={navIndex}
              articleRef={articleRef}
              onUserScrollStart={onUserScrollStart}
              onReachStartBoundary={onReachStartBoundary}
              theaterSuppressRef={suppressRailTheaterRef}
              railPinFromExpandRef={railPinFromExpandRef}
              railPinScrollLeftRef={railPinScrollLeftRef}
              overflowX={"scroll"}
              height={
                viewerFullscreen
                  ? "var(--vh-100)"
                  : railOpen
                    ? "var(--vh-75)"
                    : "var(--vh-85)"
              }
              editionLinks={[
                ...editionLinks,
                ...(isKusouzu ? LinksToKusouzu : []),
                ...(isHyakki ? LinksToHyakki : []),
              ]}
              showKusouzuHubLink={isKusouzu}
              showChojuGigaHubLink={isChojuGiga}
              showHyakkiHubLink={isHyakki}
            />
          </div>
          {!viewerFullscreen && (
            <aside
              className={`${styles.discoveryRail} scrollbar`}
              onPointerDown={() => {
                if (!railOpen) {
                  armRailTheaterSuppress();
                  // #region agent log
                  dbgRailLandscape(
                    "EmakiLandscapContent:aside",
                    "aside-pointerdown-expand",
                    { railOpen },
                    "A"
                  );
                  // #endregion
                }
              }}
              onClick={() => {
                // シアター中（下に沈んでいる時）にクリックされたら上へスライド復帰
                if (!railOpen) {
                  armRailTheaterSuppress();
                  theaterDismissedAtRef.current = 0;
                  railPinFromExpandRef.current = true;
                  railPinScrollLeftRef.current =
                    articleRef?.current?.scrollLeft ?? 0;
                  // #region agent log
                  dbgRailLandscape(
                    "EmakiLandscapContent:aside",
                    "aside-click-expand",
                    {
                      railOpen,
                      pinScrollLeft: railPinScrollLeftRef.current,
                    },
                    "A"
                  );
                  // #endregion
                  setRailOpen(true);
                }
              }}
              role={!railOpen ? "button" : undefined}
              tabIndex={!railOpen ? 0 : undefined}
              aria-label={!railOpen ? t("discovery.railExpandAria") : undefined}
            >
              {/* onClose を渡さないことでサイドバー右上の「閉じる」ボタンを非表示化 */}
              <ViewerDiscoveryRail data={data} />
            </aside>
          )}
          {!viewerFullscreen && (
            <>
          <div className={styles.metadata}>
            <div className={styles.metadataA}>
              <div className={styles.titleRow}>
                <div className={styles.titleLeading}>
                  <h1 className={styles.title}>
                    {emakiDisplayTitle(data, locale)}{" "}
                    {locale === "ja" && edition}
                  </h1>
                  {totalCount > 0 && (
                    <span
                      className={styles.totalLikesBadge}
                      aria-label={locale === "en" ? "Total likes" : "いいね総計"}
                      title={locale === "en" ? "Total likes" : "いいね総計"}
                    >
                      <FontAwesomeIcon icon={faHeart} aria-hidden />
                      {totalCount.toLocaleString()}
                    </span>
                  )}
                  {rankInfo && (
                    <Link href="/ranking">
                      <a className={styles.rankTag}>
                        <FontAwesomeIcon
                          icon={faTrophy}
                          className={styles.rankIcon}
                        />
                        {locale === "en"
                          ? `#${rankInfo.rank}`
                          : `${rankInfo.rank}位`}
                        <span className={styles.rankDivider}>|</span>
                        <FontAwesomeIcon
                          icon={faEye}
                          className={styles.rankViewIcon}
                        />
                        {Number(rankInfo.pageView).toLocaleString()}
                      </a>
                    </Link>
                  )}
                </div>
              </div>
              {author && (
                <Link href={`/author/${authoren}`}>
                  <a className={styles.authorLink}>
                    <h2 className={styles.author}>
                      {locale === "ja" ? author : authoren}
                    </h2>
                  </a>
                </Link>
              )}
            </div>
            <EmakiMetadataSection
              data={data}
              locale={locale}
              styles={styles}
              descContent={
                descToParagraphs(locale === "en" ? descEn : descJa) ??
                parse(locale === "en" ? descEn : descJa)
              }
              eraTagTextColor
              showRepresentativeLink={isKusouzu && titleen !== "kusouzumaki"}
              tagCloud={
                keyword ? (
                  <div className={styles.tagCloud}>
                    <CustomTagCloud
                      tags={filterdKeywords(keyword, allKeywords)}
                      emakiPage={true}
                    />
                  </div>
                ) : null
              }
            />
          </div>
            </>
          )}
        </div>
      </div>
      {!viewerFullscreen && <Footer />}
    </>
  );
};

export default EmakiLandscapContent;
