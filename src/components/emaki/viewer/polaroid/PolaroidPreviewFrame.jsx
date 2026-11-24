import styles from "@/styles/PolaroidModal.module.css";
import {
  THEMES,
  FORMATS,
  getSenmenFanGeometry,
} from "./polaroidCanvasRenderer";

/**
 * ポラロイド／扇面レイアウトの写真表示フレーム（扇面SVG逆抜きマスク＋3スライスパノラマストリップ）
 */
export function PolaroidPreviewFrame({
  frameRef,
  layoutMode,
  currentTheme,
  dragging,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  handleFrameWheel,
  src,
  curSlot,
  prevSlot,
  nextSlot,
  curDw,
  curDh,
  prevDw,
  prevDh,
  nextDw,
  nextDh,
  stripTransform,
  currentScene,
  isEn,
}) {
  // ===========================================================================
  // 1. 扇面（senmen）SVG 逆抜きマスク＆扇骨ジオメトリ計算
  // ===========================================================================
  const isSenmenLayout = layoutMode === "senmen";
  const senmenW = FORMATS.senmen.photoDw;
  const senmenH = FORMATS.senmen.photoDh;
  const fanGeom = isSenmenLayout
    ? getSenmenFanGeometry(0, 0, senmenW, senmenH)
    : null;
  const fanPathD = fanGeom
    ? (() => {
        const { pivotX, pivotY, outerR, innerR, startAngle, endAngle } = fanGeom;
        const ox1 = pivotX + Math.cos(startAngle) * outerR;
        const oy1 = pivotY + Math.sin(startAngle) * outerR;
        const ox2 = pivotX + Math.cos(endAngle) * outerR;
        const oy2 = pivotY + Math.sin(endAngle) * outerR;
        const ix2 = pivotX + Math.cos(endAngle) * innerR;
        const iy2 = pivotY + Math.sin(endAngle) * innerR;
        const ix1 = pivotX + Math.cos(startAngle) * innerR;
        const iy1 = pivotY + Math.sin(startAngle) * innerR;
        return `M ${ox1} ${oy1} A ${outerR} ${outerR} 0 0 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 0 0 ${ix1} ${iy1} Z`;
      })()
    : "";
  const activeCardBg =
    THEMES[currentTheme]?.cardBg || THEMES[currentTheme]?.bg || "#ffffff";

  // ===========================================================================
  // 2. ドラッグ・ホイール操作対象フレーム描画
  // ===========================================================================
  return (
    <div
      ref={frameRef}
      data-polaroid-frame
      className={`relative shrink-0 ${
        isSenmenLayout ? "aspect-[880/480] bg-transparent" : "aspect-[720/560] bg-neutral-900/5"
      } w-full overflow-hidden select-none touch-none ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleFrameWheel}
    >
      {isSenmenLayout && fanGeom ? (
        <svg
          viewBox={`0 0 ${senmenW} ${senmenH}`}
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <defs>
            <filter id="polaroid-senmen-shadow" x="-15%" y="-15%" width="130%" height="135%">
              <feDropShadow
                dx="0"
                dy="8"
                stdDeviation="10"
                floodColor={currentTheme === "sumi" ? "#000000" : "#2d200e"}
                floodOpacity={currentTheme === "sumi" ? "0.65" : "0.26"}
              />
            </filter>
          </defs>

          {/* 扇形の外側を選択中テーマ背景色で覆う逆抜きマスク（全ブラウザ対応） */}
          <path
            d={`M 0 0 H ${senmenW} V ${senmenH} H 0 Z ${fanPathD}`}
            fillRule="evenodd"
            fill={activeCardBg}
          />

          {/* 要（かなめ）へ集まる黒漆の親骨（左右）と煤竹の中骨 */}
          {Array.from({ length: 11 }, (_, i) => {
            const ang =
              fanGeom.startAngle +
              ((fanGeom.endAngle - fanGeom.startAngle) * i) / 10;
            const isOuterBone = i === 0 || i === 10;
            const boneEndR = fanGeom.innerR * 0.42;
            const x1 = fanGeom.pivotX + Math.cos(ang) * boneEndR;
            const y1 = fanGeom.pivotY + Math.sin(ang) * boneEndR;
            const x2 = fanGeom.pivotX + Math.cos(ang) * fanGeom.innerR;
            const y2 = fanGeom.pivotY + Math.sin(ang) * fanGeom.innerR;
            return (
              <g key={`rib-stub-${i}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isOuterBone ? "#3a2c1e" : "rgba(158, 122, 68, 0.55)"}
                  strokeWidth={isOuterBone ? 6 : 1.8}
                  strokeLinecap="round"
                />
                {isOuterBone ? (
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(218, 182, 108, 0.65)"
                    strokeWidth="1.4"
                  />
                ) : null}
              </g>
            );
          })}

          {/* 要（かなめ）の金鋲 */}
          <circle
            cx={fanGeom.pivotX}
            cy={fanGeom.pivotY - fanGeom.innerR * 0.46}
            r="5"
            fill="#d4af5a"
            stroke="#5c431d"
            strokeWidth="1.4"
          />

          {/* 地紙内の透かし扇骨 */}
          {Array.from({ length: 9 }, (_, idx) => {
            const ang =
              fanGeom.startAngle +
              ((fanGeom.endAngle - fanGeom.startAngle) * (idx + 1)) / 10;
            return (
              <line
                key={`rib-inner-${idx}`}
                x1={fanGeom.pivotX + Math.cos(ang) * fanGeom.innerR}
                y1={fanGeom.pivotY + Math.sin(ang) * fanGeom.innerR}
                x2={fanGeom.pivotX + Math.cos(ang) * fanGeom.outerR}
                y2={fanGeom.pivotY + Math.sin(ang) * fanGeom.outerR}
                stroke="rgba(212, 175, 90, 0.24)"
                strokeWidth="1.4"
              />
            );
          })}

          {/* 扇面（地紙）の立体シャドウ＋二重金箔縁取り */}
          <path
            d={fanPathD}
            fill="none"
            stroke="#c99e44"
            strokeWidth="4.5"
            filter="url(#polaroid-senmen-shadow)"
          />
          <path
            d={fanPathD}
            fill="none"
            stroke="#f0d78c"
            strokeWidth="1.5"
          />
        </svg>
      ) : null}

      {src && curSlot && curDw > 0 ? (
        /* パノラマストリップ（RTL順: next -> cur -> prev） */
        <div className={styles.panoramaStrip} style={stripTransform}>
          {/* 絵巻の進行方向（左側: 次スライス） */}
          {nextSlot ? (
            <img
              crossOrigin="anonymous"
              src={nextSlot.src}
              alt=""
              className={styles.photoImage}
              style={{ width: `${nextDw}px`, height: `${nextDh}px`, flexShrink: 0 }}
              draggable={false}
            />
          ) : null}
          {/* 中央スライス */}
          <img
            crossOrigin="anonymous"
            src={curSlot.src}
            alt={currentScene?.name || currentScene?.title || "Emaki Scene"}
            className={styles.photoImage}
            style={{ width: `${curDw}px`, height: `${curDh}px`, flexShrink: 0, pointerEvents: "none" }}
            draggable={false}
          />
          {/* 絵巻の進行方向（右側: 前スライス） */}
          {prevSlot ? (
            <img
              crossOrigin="anonymous"
              src={prevSlot.src}
              alt=""
              className={styles.photoImage}
              style={{ width: `${prevDw}px`, height: `${prevDh}px`, flexShrink: 0 }}
              draggable={false}
            />
          ) : null}
        </div>
      ) : (
        /* ローディングスピナー */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            minHeight: "240px",
            gap: "12px",
            color: "#888",
            fontSize: "13px",
            fontFamily: "'Noto Serif JP', serif",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              border: "3px solid #e0ded9",
              borderTopColor: "#b8b2a5",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span>{isEn ? "Loading..." : "読み込み中..."}</span>
          <style>{`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}