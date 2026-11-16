"use client";

import Link from "next/link";

export function SpotPinLabel({ spotPin, href }) {
  const pinInner = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 9px",
        borderRadius: 6,
        border: `1px solid ${spotPin.borderColor}`,
        background: spotPin.bg,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.22)",
        fontSize: 11,
        fontWeight: 700,
        color: spotPin.textColor,
        fontFamily: "var(--font-classical)",
        whiteSpace: "nowrap",
        maxWidth: "min(92%, 11rem)",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      <span
        style={{
          flexShrink: 0,
          display: "inline-block",
          ...spotPin.dotStyle,
        }}
      />
      {spotPin.label}
    </div>
  );
  if (href) {
    return (
      <Link
        href={href}
        style={{
          position: "absolute",
          left: `${spotPin.cx}%`,
          top: `${spotPin.cy}%`,
          transform: "translate(-50%, calc(-100% - 8px))",
          zIndex: 4,
          textDecoration: "none",
        }}
        aria-label={spotPin.label}
      >
        {pinInner}
      </Link>
    );
  }
  return (
    <div
      style={{
        position: "absolute",
        left: `${spotPin.cx}%`,
        top: `${spotPin.cy}%`,
        transform: "translate(-50%, calc(-100% - 8px))",
        zIndex: 4,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      {pinInner}
    </div>
  );
}