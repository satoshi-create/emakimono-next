/**
 * EmakiLandscapContent.js
 * 
 * 【責務（Phase 1 責務分離後）】
 * - ランドスケープ表示時の全体レイアウト（2列グリッド／シアターモード）の構築
 * - タイトル、いいね数、ランキング、メタデータ、タグクラウド、フッター等の描画
 * - Discoveryレール（サイドバー）の開閉・排他制御ロジックは useViewerDiscoveryRailState フックへ完全委譲
 * 
 * 【バグとの関連】
 * - バグ1（開閉ループ）: useViewerDiscoveryRailState が提供する railOpen フラグに基づき、
 *   ビューアの高さ（--vh-75 vs --vh-85）とグリッドクラス（.theater）を切り替える。
 * - バグ2（フッター突き抜け）: 本コンポーネント内の .wrapper グリッド内で aside.discoveryRail が
 *   position: sticky として描画される（CSSの境界制約に依存）。
 */
import EmakiConteiner from "@/components/emaki/layout/EmakiConteiner";
import EmakiMetadataSection from "@/components/emaki/layout/EmakiMetadataSection";
import ViewerDiscoveryRail from "@/components/discovery/ViewerDiscoveryRail";
import CustomTagCloud from "@/components/keyword/CustomTagCloud";
import Footer from "@/components/layout/Footer";
import { AppContext } from "@/context/AppContext";
import { useSceneLikeCounts } from "@/context/SceneLikeCountsContext";
import styles from "@/styles/EmakiLandscapContent.module.css";
import useViewerDiscoveryRailState from "@/hooks/emaki/useViewerDiscoveryRailState";
import ExtractingListData from "@/utils/ExtractingListData";
import { isKusouzuScroll } from "@/utils/buildKusouzuHubData";
import { isChojuGigaScroll } from "@/utils/buildChojuGigaHubData";
import { isHyakkiClusterScroll } from "@/utils/buildHyakkiHubData";
import { emakiDisplayTitle } from "@/utils/emakiDisplayTitle";
import { isByobuScroll } from "@/utils/isByobuScroll";
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
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "next-i18next";

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

  // 【責務分離】サイドバーの開閉状態・クールダウン・ハンドラを専用フックから取得
  const {
    railOpen,
    suppressRailTheaterRef,
    expandClickGuardUntilRef,
    railPinFromExpandRef,
    railPinScrollLeftRef,
    onUserScrollStart,
    onReachStartBoundary,
    handleRailPointerDown,
    handleRailClick,
    toggleRail,
  } = useViewerDiscoveryRailState({
    viewerFullscreen,
    articleRef,
    stickyTheater: isByobuScroll(data),
  });

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
        {/* レール開閉状態（railOpen）に応じて .theater クラスを付与しグリッド構造を変更 */}
        <div
          className={
            viewerFullscreen
              ? styles.fullscreenViewer
              : `${styles.wrapper}${railOpen ? "" : ` ${styles.theater}`}`
          }
        >
          {/* ビューア領域（行1 / 列1）。シアター時は全幅へ拡張 */}
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
              isTheaterMode={!railOpen}
              onToggleTheater={toggleRail}
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

          {/* Discoveryレール（外枠: sticky・防壁 / 内枠: transform スライド） */}
          {!viewerFullscreen && (
            <aside
              className={`${styles.discoveryRail} scrollbar`}
              onPointerDown={handleRailPointerDown}
              onClick={handleRailClick}
              role={!railOpen ? "button" : undefined}
              tabIndex={!railOpen ? 0 : undefined}
              aria-label={!railOpen ? t("discovery.railExpandAria") : undefined}
            >
              {/* 内枠ラッパーを配線して責務を物理分離 */}
              <div className={styles.discoveryRailSlide}>
                <ViewerDiscoveryRail
                  data={data}
                  expandClickGuardUntilRef={expandClickGuardUntilRef}
                />
              </div>
            </aside>
          )}

          {/* メタデータ領域（行2 / 列1） */}
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
      {/* フッター領域（wrapper グリッドの外側） */}
      {!viewerFullscreen && <Footer />}
    </>
  );
};

export default EmakiLandscapContent;