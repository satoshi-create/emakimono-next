"use client";

import Link from "next/link";
import { SpotPinLabel } from "./SpotPinLabel";

export function MotifCropCard({
  visual,
  href,
  children,
  style = {},
  overlayMarkers = [],
  spotPin = null,
}) {
  if (!visual) {
    return (
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 10,
          background:
            "repeating-linear-gradient(-12deg, #f4efe6 0, #f4efe6 8px, #ebe4d8 8px, #ebe4d8 16px)",
          border: "2px dashed rgba(120, 90, 60, 0.35)",
          width: "100%",
          minHeight: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(80, 60, 40, 0.75)",
          fontSize: 13,
          fontWeight: 500,
          ...style,
        }}
      >
        {children}
      </div>
    );
  }

  const focusX = typeof visual.x === "number" ? visual.x : 50;
  const focusY = typeof visual.y === "number" ? visual.y : 50;

  const inner = (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 10,
        width: "100%",
        background: "#1a1510",
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          width: "100%",
          aspectRatio: "16 / 10",
          height: 220,
          maxHeight: 220,
        }}
      >
        <img
          src={visual.image}
          alt=""
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `${focusX}% ${focusY}%`,
          }}
        />
        {overlayMarkers.length > 0 && (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              zIndex: 2,
              pointerEvents: "none",
            }}
          >
            {overlayMarkers.map((m) => {
              const primary = m.primary !== false;
              const rx = primary ? 7.2 : 5.5;
              const ry = primary ? 5.4 : 4.2;
              const stroke = primary ? "#b91c1c" : "rgba(185, 28, 28, 0.5)";
              const fill = primary ? "rgba(220, 38, 38, 0.28)" : "rgba(220, 38, 38, 0.1)";
              const badgeR = primary ? 3.6 : 3;
              const bx = Math.min(94, Math.max(6, m.cx + rx * 0.55));
              const by = Math.min(94, Math.max(6, m.cy - ry * 0.95));
              return (
                <g key={`${m.num}-${m.cx}-${m.cy}`}>
                  <ellipse
                    cx={m.cx}
                    cy={m.cy}
                    rx={rx}
                    ry={ry}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={primary ? 0.75 : 0.55}
                  />
                  <circle cx={bx} cy={by} r={badgeR} fill="#dc2626" stroke="#fff" strokeWidth={0.35} />
                  <text
                    x={bx}
                    y={by + 1.15}
                    textAnchor="middle"
                    fontSize={primary ? 4.2 : 3.6}
                    fill="#fff"
                    fontWeight="700"
                    fontFamily="var(--font-ui, system-ui, sans-serif)"
                  >
                    {m.num}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
        {spotPin ? <SpotPinLabel spotPin={spotPin} /> : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ display: "block", textDecoration: "none" }}>
        {inner}
      </Link>
    );
  }
  return inner;
}