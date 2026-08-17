/**
 * 巻末ナッジカード: 巻末到達中に次巻・ハブへのリンクを左端に表示する。
 *
 * 抽出元: EmakiConteiner.js の巻末ナッジ JSX（インライン style は無変更のまま移動）。
 * 表示条件（hasNextVolume でラップ / showEndNudge で開閉）は呼び出し側が制御する。
 */
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { HUB_PATH } from "@/components/emaki/kusouzu/KusouzuHubLink";
import { HUB_PATH as GIGA_HUB_PATH } from "@/components/emaki/chouju-giga/ChojuGigaHubLink";
import nudgeStyles from "@/styles/KusouzuHubLink.module.css";

const EndNudgeCard = ({
  editionLinks = [],
  showKusouzuHubLink = false,
  showChojuGigaHubLink = false,
  showEndNudge,
}) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();

  return (
    <div
      style={{
        position: "sticky",
        left: 0,
        flexShrink: 0,
        width: 0,
        height: "100%",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: "12px",
          left: "12px",
          width: "180px",
          pointerEvents: showEndNudge ? "auto" : "none",
          opacity: showEndNudge ? 1 : 0,
          transform: showEndNudge ? "translateX(0)" : "translateX(-12px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(8px)",
          borderRadius: "10px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: "1px",
        }}
      >
        {showKusouzuHubLink && (
          <Link href={HUB_PATH}>
            <a className={nudgeStyles.nudge}>
              <span className={nudgeStyles.nudgeLabel}>
                {t("kusouzuHub.hubNudgeLabel")}
              </span>
            </a>
          </Link>
        )}
        {showChojuGigaHubLink && (
          <Link href={GIGA_HUB_PATH}>
            <a className={nudgeStyles.nudge}>
              <span className={nudgeStyles.nudgeLabel}>
                {t("choujuGigaHub.hubNudgeLabel")}
              </span>
            </a>
          </Link>
        )}
        {editionLinks.map((item, i) => (
          <Link key={i} href={`/${item.titleen}`}>
            <a
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px",
                textDecoration: "none",
                color: "#333",
                background:
                  i > 0
                    ? "linear-gradient(to bottom, rgba(0,0,0,0.04), transparent)"
                    : "transparent",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,140,100,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  i > 0
                    ? "linear-gradient(to bottom, rgba(0,0,0,0.04), transparent)"
                    : "transparent";
              }}
            >
              <Image
                src={item.thumb}
                width={48}
                height={27}
                alt={item.title}
                style={{ borderRadius: "4px", objectFit: "cover" }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  lineHeight: 1.3,
                  flex: 1,
                }}
              >
                {locale === "en" ? item.titleen : item.edition || item.title}
              </span>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default EndNudgeCard;
