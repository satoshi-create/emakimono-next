import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import Title from "@/components/ui/Title";
import linkStyles from "@/styles/HomeSectionLink.module.css";
import { getLocalizedField } from "@/utils/emakiDisplayTitle";

function ThumbStack({ thumbs = [], title }) {
  const list = Array.isArray(thumbs) ? thumbs.filter(Boolean).slice(0, 3) : [];

  if (list.length === 0) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          minHeight: 120,
          background:
            "linear-gradient(145deg, #f5f0e8 0%, #e8e0d4 50%, #ddd4c4 100%)",
          borderRadius: 8,
          border: "1px solid rgba(20, 20, 20, 0.08)",
        }}
      />
    );
  }

  if (list.length === 1) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          minHeight: 120,
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: "6px 4px 2px 8px",
            background:
              "linear-gradient(145deg, #f7f2ea 0%, #ebe3d6 60%, #e0d6c6 100%)",
            borderRadius: 6,
            border: "1px solid rgba(20, 20, 20, 0.1)",
            transform: "rotate(-3deg)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
          }}
        />
        <div
          style={{
            position: "relative",
            width: "88%",
            height: "90%",
            margin: "6% auto 0",
            borderRadius: 6,
            overflow: "hidden",
            border: "1px solid rgba(20, 20, 20, 0.12)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            background: "#f5f5f4",
          }}
        >
          <Image
            alt={title}
            layout="fill"
            objectFit="cover"
            sizes="170px"
            src={list[0]}
          />
        </div>
      </div>
    );
  }

  const layers = [
    { src: list[2], rotate: "4deg", z: 1, left: "4%", top: "10%" },
    { src: list[1], rotate: "-4deg", z: 2, left: "18%", top: "6%" },
    { src: list[0], rotate: "0deg", z: 3, left: "10%", top: "2%" },
  ].filter((l) => l.src);

  // Ensure front card is always first thumb when only 2
  const ordered =
    list.length === 2
      ? [
          { src: list[1], rotate: "-4deg", z: 1, left: "16%", top: "8%" },
          { src: list[0], rotate: "0deg", z: 2, left: "8%", top: "2%" },
        ]
      : layers;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 120,
      }}
    >
      {ordered.map((layer, i) => (
        <div
          key={`${layer.src}-${i}`}
          style={{
            position: "absolute",
            left: layer.left,
            top: layer.top,
            width: "72%",
            height: "86%",
            zIndex: layer.z,
            transform: `rotate(${layer.rotate})`,
            borderRadius: 6,
            overflow: "hidden",
            border: "1px solid rgba(20, 20, 20, 0.14)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.14)",
            background: "#f5f5f4",
          }}
        >
          <Image
            alt=""
            layout="fill"
            objectFit="cover"
            sizes="140px"
            src={layer.src}
          />
        </div>
      ))}
    </div>
  );
}

export function HomeHubSection({ hubs = [], surface = true }) {
  const { locale } = useRouter();
  const isJa = locale === "ja";

  if (!Array.isArray(hubs) || hubs.length === 0) return null;

  return (
    <section
      className="section-grid section-padding"
      style={{
        backgroundColor: surface ? "var(--clr-surface)" : "#ffffff",
      }}
    >
      <Title
        sectiontitle="テーマ・特集ハブ一覧"
        sectiontitleen="Curated Theme Hubs"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))",
          gap: 16,
          marginTop: 8,
        }}
      >
        {hubs.map((hub) => {
          const title = getLocalizedField(
            { title: hub.titleJa, title_en: hub.titleEn },
            "title",
            locale
          );
          const desc = getLocalizedField(
            {
              description: hub.descriptionJa,
              description_en: hub.descriptionEn,
            },
            "description",
            locale
          );
          const thumbs =
            Array.isArray(hub.coverThumbs) && hub.coverThumbs.length > 0
              ? hub.coverThumbs
              : hub.coverThumb
                ? [hub.coverThumb]
                : [];

          return (
            <Link href={hub.path} key={hub.slug} locale={locale} passHref>
              <a
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "stretch",
                  minHeight: 148,
                  background: "#ffffff",
                  border: "1px solid rgba(20, 20, 20, 0.09)",
                  borderRadius: 10,
                  overflow: "hidden",
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                }}
              >
                <div
                  style={{
                    flex: "0 0 clamp(150px, 28%, 170px)",
                    width: "clamp(150px, 28%, 170px)",
                    position: "relative",
                    background: "#f8f6f2",
                    padding: "10px 8px",
                  }}
                >
                  <ThumbStack thumbs={thumbs} title={title} />
                </div>

                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    padding: "14px 16px 12px",
                    minWidth: 0,
                  }}
                >
                  {hub.workCount > 0 && (
                    <span
                      style={{
                        alignSelf: "flex-start",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#57534e",
                        background: "rgba(20, 20, 20, 0.05)",
                        border: "1px solid rgba(20, 20, 20, 0.08)",
                        borderRadius: 4,
                        padding: "2px 8px",
                        marginBottom: 8,
                      }}
                    >
                      {!isJa
                        ? `${hub.workCount} works`
                        : `全${hub.workCount}巻・${hub.workCount}作品収録`}
                    </span>
                  )}

                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      color: "var(--clr-text, #141414)",
                      lineHeight: 1.35,
                    }}
                  >
                    {title}
                  </h3>

                  {desc && (
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: "0.82rem",
                        lineHeight: 1.55,
                        color: "#57534e",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {desc}
                    </p>
                  )}

                  <span
                    style={{
                      marginTop: "auto",
                      paddingTop: 10,
                      alignSelf: "flex-end",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "var(--clr-accent, #ff8c77)",
                    }}
                  >
                    {!isJa ? "View theme →" : "特集ページを見る →"}
                  </span>
                </div>
              </a>
            </Link>
          );
        })}
      </div>

      <div className={linkStyles.wrap}>
        <Link href="/hub" locale={locale}>
          <a className={linkStyles.btn}>
            {!isJa ? "View all theme hubs" : "すべての特集ハブを見る"}
          </a>
        </Link>
      </div>
    </section>
  );
}

export default HomeHubSection;
