import React from "react";
import { useRouter } from "next/router";
import { getMotifDefinition } from "@/utils/motifNetwork";
import { resolveReferenceUrl } from "@/utils/amazonUrl";

const CommentaryExploreView = ({
  souData,
  activeMotif,
  selectedMotifId,
  onSelectMotif,
}) => {
  const [fadeOpacity, setFadeOpacity] = React.useState(1);
  const router = useRouter();
  const isEn = router.locale === "en";

  if (!souData) return null;

  const availableMotifs = React.useMemo(() => {
    if (!Array.isArray(souData.motifs)) return [];
    return souData.motifs.map((mId) => {
      const def = getMotifDefinition(mId);
      return {
        id: mId,
        nameJa: def ? def.label : mId,
        nameEn: def ? (def.labelEn || def.label) : mId,
      };
    });
  }, [souData.motifs]);

  // モチーフの自動スライド（8秒間隔・フェード付き）
  React.useEffect(() => {
    if (availableMotifs.length <= 1) return undefined;

    const timer = setInterval(() => {
      // 1. フェードアウト
      setFadeOpacity(0);
      setTimeout(() => {
        // 2. データ更新
        onSelectMotif((prevId) => {
          const currentIdx = availableMotifs.findIndex((m) => m.id === prevId);
          const nextIdx = (currentIdx + 1) % availableMotifs.length;
          return availableMotifs[nextIdx].id;
        });
        // 3. フェードイン
        setFadeOpacity(1);
      }, 250);
    }, 12000);

    return () => clearInterval(timer);
  }, [availableMotifs, onSelectMotif]);

  const currentIndex = Math.max(
    0,
    availableMotifs.findIndex((m) => m.id === selectedMotifId)
  );
  const currentMotif = availableMotifs[currentIndex] || availableMotifs[0];

  // 選択中モチーフに応じた動的な問いかけ文を解決
  const activePrompt = React.useMemo(() => {
    // 1. 章側のモチーフ別 prompt（英語時は promptsEn を優先、無ければ motifs.json へ流す）
    if (isEn && souData?.promptsEn && selectedMotifId && souData.promptsEn[selectedMotifId]) {
      return String(souData.promptsEn[selectedMotifId]).replace(/[\s\.…・]+$/, "");
    }
    if (!isEn && souData?.prompts && selectedMotifId && souData.prompts[selectedMotifId]) {
      return String(souData.prompts[selectedMotifId]).replace(/[\s\.…・]+$/, "");
    }

    // 2. motifs.json の共通 prompt（英語時は promptEn、日本語時は prompt）
    if (activeMotif) {
      const motifPrompt = isEn ? (activeMotif.promptEn || activeMotif.prompt) : activeMotif.prompt;
      if (motifPrompt) {
        return String(motifPrompt).replace(/[\s\.…・]+$/, "");
      }
    }

    // 3. 章全体の共通 prompt（英語時は promptEn、日本語時は prompt）
    if (souData) {
      const scenePrompt = isEn ? souData.promptEn : souData.prompt;
      if (scenePrompt) {
        return String(scenePrompt).replace(/[\s\.…・]+$/, "");
      }
    }

    // 4. モチーフ名からの自動生成フォールバック
    if (activeMotif) {
      const label = isEn ? (activeMotif.labelEn || activeMotif.label) : activeMotif.label;
      if (label) {
        return isEn
          ? `What was the artist's intent behind the depiction of "${label}"?`
          : `「${label}」の描写から読み解く、絵師の意図とは？`;
      }
    }
    return null;
  }, [souData, selectedMotifId, activeMotif, isEn]);

  const handleSelectIndex = (idx) => {
    if (idx === currentIndex || !availableMotifs[idx]) return;
    setFadeOpacity(0);
    setTimeout(() => {
      onSelectMotif(availableMotifs[idx].id);
      setFadeOpacity(1);
    }, 200);
  };

  const handleNextMotif = (e) => {
    e.stopPropagation();
    if (availableMotifs.length <= 1) return;
    const nextIdx = (currentIndex + 1) % availableMotifs.length;
    handleSelectIndex(nextIdx);
  };

  return (
    <div
      style={{
        marginTop: "0.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        fontSize: "0.8125rem",
        color: "#44403c",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* フェード切り替え対象エリア（問い掛け＋書籍リンク） */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          opacity: fadeOpacity,
          transition: "opacity 0.25s ease-in-out",
        }}
      >
        {/* 1. 導入文（電球アイコン＋強調ボールド＋末尾ハッシュタグ） */}
        {activePrompt && (
          <p
            style={{
              lineHeight: 1.55,
              color: "#292524",
              fontSize: "0.875rem",
              fontWeight: 700,
              margin: 0,
            }}
          >
            <span style={{ marginRight: "0.25rem" }}>💡</span>
            <span>{activePrompt}</span>
            {currentMotif && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleNextMotif}
                title="クリックで次の切り口へ"
                style={{
                  marginLeft: "0.5rem",
                  cursor: "pointer",
                  userSelect: "none",
                  fontSize: "0.71875rem",
                  fontWeight: 300,
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "baseline",
                  gap: "0.125rem",
                  opacity: 0.9,
                }}
              >
                <span>
                  ── #
                  {isEn
                    ? (activeMotif?.labelEn || currentMotif?.nameEn || activeMotif?.label || currentMotif?.nameJa)
                    : (activeMotif?.label || currentMotif?.nameJa)}
                </span>
                {availableMotifs.length > 1 && (
                  <span style={{ fontSize: "0.5625rem", opacity: 0.8 }}></span>
                )}
              </span>
            )}
          </p>
        )}

        {/* 2. 関連書籍（導入文からの視線に沿う左揃え・視認性向上） */}
        {activeMotif?.amazonSearch && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "0.125rem",
              justifyContent: "flex-end",
            }}
          >
            <a
              href={resolveReferenceUrl(activeMotif.amazonSearch)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              style={{
                color: "#374151",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                fontSize: "0.8125rem",
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <span style={{ color: "var(--accent-color, #92400e)", fontSize: "0.875rem" }}>📖</span>
              <span
                style={{
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                  fontWeight: 500,
                  color: "#2563eb",
                }}
              >
                {isEn
                  ? activeMotif.amazonSearch.titleEn || activeMotif.amazonSearch.title
                  : activeMotif.amazonSearch.title}
              </span>
              <span
                style={{
                  fontSize: "0.5625rem",
                  color: "#9ca3af",
                  border: "1px solid #d1d5db",
                  padding: "0 0.25rem",
                  borderRadius: "0.125rem",
                  lineHeight: "1.2",
                  display: "inline-block",
                  verticalAlign: "middle",
                }}
              >
                PR
              </span>
            </a>
          </div>
        )}
      </div>

      {/* 3. 最下部中央寄せのカルーセルドットインジケーター */}
      {availableMotifs.length > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.375rem",
            paddingTop: "0.125rem",
          }}
        >
          {availableMotifs.map((motif, idx) => {
            const isActive = idx === currentIndex;
            return (
              <span
                key={motif.id}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectIndex(idx);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectIndex(idx);
                  }
                }}
                title={isEn ? (motif.nameEn || motif.nameJa) : motif.nameJa}
                style={{
                  cursor: "pointer",
                  width: isActive ? "14px" : "5px",
                  height: "5px",
                  borderRadius: "9999px",
                  backgroundColor: isActive
                    ? "var(--accent-color, #92400e)"
                    : "#d6d3d1",
                  transition: "all 0.3s ease",
                  display: "inline-block",
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommentaryExploreView;
