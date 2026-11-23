import { AppContext } from "@/context/AppContext";
import { getAllHubPages, getHubSlugsForEmaki } from "@/libs/hubPages";
import styles from "@/styles/CardA.module.css";
import { eraColor } from "@/utils/func";
import { faEye, faTrash, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useMemo } from "react";

const SingleCardA = ({ item, sectiontitle, columns, needdesc, variant }) => {
  const { locale } = useRouter();
  const { closeSearchModal, rankingData } = useContext(AppContext);
  const {
    titleen,
    title,
    thumb,
    edition,
    author,
    authoren,
    era,
    eraen,
    desc,
    typeen,
    type,
    subtype,
    keyword,
  } = item;

  // ランキング順位・閲覧数を検索
  const rankInfo = useMemo(() => {
    const index = rankingData.findIndex((r) => r.titleen === titleen);
    if (index < 0) return null;
    return { rank: index + 1, pageView: rankingData[index].pageView };
  }, [rankingData, titleen]);

  const viewerHref = item.viewerHref || `/${titleen}`;
  const polaroidClipHref = viewerHref.includes("?")
    ? `${viewerHref}&polaroid=1`
    : `${viewerHref}?polaroid=1`;
  const candidateHubs = useMemo(() => {
    const slugs = getHubSlugsForEmaki(item);
    if (!slugs.length) return [];
    const bySlug = new Map(getAllHubPages().map((h) => [h.slug, h]));
    return slugs.map((s) => bySlug.get(s)).filter(Boolean);
  }, [item]);
  const filterDesc = typeof desc === "string" ? desc.substring(0, 40) : "";
  const descTemp = `${title} ${
    author && `（${author}）`
  }の全シーンを、縦書き、横スクロールで楽しむことができます。`;

  const baseUrl =
    "https://res.cloudinary.com/dw2gjxrrf/image/upload/fl_progressive";

  const handleDevDeleteScroll = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = window.confirm(
      `開発環境: 「${title || titleen}」（${titleen}）のローカルJSON・画像・サムネイルを削除しますか？`
    );
    if (!confirmed) return;
    try {
      const res = await fetch("/api/dev/delete-scroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleen }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        window.location.reload();
      } else {
        alert(
          data.error ||
            data.message ||
            `削除に失敗しました (${res.status})`
        );
      }
    } catch (err) {
      alert(err?.message || String(err));
    }
  };

  return (
    <div className={styles.cardOuter} onClick={closeSearchModal}>
      {sectiontitle === "さまざまな絵巻" && (
        <h4 className={styles.subtype} id="alart" value="test">
          {sectiontitle === "さまざまな絵巻" && `${subtype}絵巻`}
          {sectiontitle === "横スクロールで楽しむワイド美術" && type}
        </h4>
      )}
      <div className={styles.card} style={{ position: "relative" }}>
        {process.env.NODE_ENV === "development" && titleen ? (
          <button
            type="button"
            aria-label="開発: 作品削除"
            onClick={handleDevDeleteScroll}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              padding: 0,
              border: "1px solid rgba(185, 28, 28, 0.5)",
              borderRadius: 6,
              backgroundColor: "rgba(220, 38, 38, 0.9)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            <FontAwesomeIcon icon={faTrash} style={{ fontSize: 14 }} />
          </button>
        ) : null}
        <div className={styles.single} style={{ position: "relative" }}>
          {candidateHubs.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                zIndex: 15,
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
                maxWidth: "calc(100% - 48px)",
                pointerEvents: "none",
              }}
            >
              {candidateHubs.slice(0, 2).map((hub) => (
                <span
                  key={hub.slug}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "rgba(236, 253, 245, 0.94)",
                    color: "#065f46",
                    border: "1px solid #6ee7b7",
                    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.14)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span aria-hidden="true">📷</span>
                  <span>
                    {locale === "en"
                      ? `${hub.titleEn || hub.titleJa} Board`
                      : `${hub.titleJa || hub.titleEn} 候補`}
                  </span>
                </span>
              ))}
            </div>
          )}
          <Link href={viewerHref}>
            <a className={styles.singleLink}>
              <Image
                src={thumb}
                alt={title}
                layout="fill"
                objectFit="cover"
                sizes="(max-width: 767px) 50vw, (max-width: 1200px) 25vw, 300px"
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
              />
            </a>
          </Link>
        </div>
        <div className={styles.footer}>
          <div className={styles.cat}>
            <Link href={`/type/${typeen}`}>
              <a className={styles.type}>{locale === "en" ? typeen : type}</a>
            </Link>
            <Link href={`/era/${eraen}`}>
              <a
                className={`${styles.era}`}
                style={{
                  border: eraColor(era),
                  backgroundColor: eraColor(era),
                  color: eraColor(era) ? "white" : "black",
                }}
              >
                {locale === "en" ? `${eraen} period` : `${era}時代`}
              </a>
            </Link>
            {rankInfo && (
              <Link href="/ranking">
                <a className={styles.rankBadge}>
                  <FontAwesomeIcon icon={faTrophy} className={styles.rankBadgeIcon} />
                  {locale === "en" ? `#${rankInfo.rank}` : `${rankInfo.rank}位`}
                </a>
              </Link>
            )}
          </div>
          <div className={styles.contentBlock}>
            <Link href={viewerHref}>
              <a>
                <h3 className={styles.title}>
                  {locale === "ja" ? title : titleen} {locale === "ja" && edition}
                </h3>
              </a>
            </Link>
            {author ? (
              <Link href={`/author/${authoren}`}>
                <a className={styles.authorLink}>
                  <h4 className={styles.author}>
                    {locale === "ja" ? author : authoren}
                  </h4>
                </a>
              </Link>
            ) : (
              <div className={styles.authorSpacer} aria-hidden="true" />
            )}
          </div>
          {needdesc && (
            <div className={styles.desc}>
              {desc ? `${filterDesc}...` : descTemp}
            </div>
          )}
          {variant !== "editionlink" && (
            <div
              className={styles.viewemaki}
              style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}
            >
              <Link href={viewerHref}>
                <a>
                  <button className={styles.viewemakiBtn}>
                    {locale === "en"
                      ? "Enjoy by right to left scroll !!"
                      : "横スクロールで見る"}
                  </button>
                </a>
              </Link>
              <Link href={polaroidClipHref}>
                <a
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #fcd34d",
                    background: "#fffbeb",
                    color: "#92400e",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span aria-hidden="true">📷</span>
                  <span>{locale === "en" ? "Clip to Board" : "切り抜いて貼る"}</span>
                </a>
              </Link>
            </div>
          )}

          <div className={styles.keywordRow}>
            {rankInfo && (
              <span className={styles.viewCount}>
                <FontAwesomeIcon icon={faEye} />
                {` ${Number(rankInfo.pageView).toLocaleString()}`}
              </span>
            )}
            {keyword && (
              <div className={styles.keyword}>
                {keyword.slice(0, 3).map((item, index) => {
                  const { name, slug, id } = item;
                  return (
                    <Link href={`/keyword/${slug}`} key={index}>
                      <a className={styles.keywordLink}>
                        {locale === "en" ? id : name}
                      </a>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleCardA;
