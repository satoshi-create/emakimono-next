import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { KYOTO_RIVER_POLYLINES } from "@/data/hub/rakuchuRakugaiGeoSpots";

const KYOTO_CENTER = { lat: 35.0036, lng: 135.7681 };
const DEFAULT_ZOOM = 13;
const FOCUS_ZOOM = 15;

/**
 * 制御コンポーネントはモジュールスコープに定義し、再レンダー時の再マウントを防ぐ。
 */
const FocusGeoSpot = ({
  spot,
  markerRefs,
  lastFocusedIdRef,
  useMap,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!spot) {
      lastFocusedIdRef.current = null;
      return;
    }
    const key = `${spot.id}:${map._leaflet_id}`;
    if (lastFocusedIdRef.current === key) return;
    lastFocusedIdRef.current = key;

    map.flyTo([spot.lat, spot.lng], FOCUS_ZOOM, { duration: 0.6 });
    const timer = setTimeout(() => {
      markerRefs.current[spot.id]?.openPopup();
    }, 650);
    return () => clearTimeout(timer);
  }, [spot, map, markerRefs, lastFocusedIdRef]);

  return null;
};

const InvalidateSize = ({ trigger, useMap }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map, trigger]);
  return null;
};

/**
 * 作品ページの観光マップドロワー内で動作する Leaflet 地図コンポーネント。
 * SSR クラッシュを防ぐため leaflet / react-leaflet は useEffect 内で動的ロードする。
 */
const ScrollSpotMapCanvas = ({
  geoSpots = [],
  activeGeoSpotId = null,
  onSelectGeoSpot,
  onJumpToScrollSpot,
  locale = "ja",
}) => {
  const [rl, setRl] = useState(null);
  const markerRefs = useRef({});
  const lastFocusedIdRef = useRef(null);

  useEffect(() => {
    let active = true;
    Promise.all([import("leaflet"), import("react-leaflet")]).then(
      ([leafletMod, rlMod]) => {
        if (!active) return;
        setRl({
          L: leafletMod.default || leafletMod,
          MapContainer: rlMod.MapContainer,
          Marker: rlMod.Marker,
          Polyline: rlMod.Polyline,
          Popup: rlMod.Popup,
          TileLayer: rlMod.TileLayer,
          useMap: rlMod.useMap,
        });
      }
    );
    return () => {
      active = false;
    };
  }, []);

  const activeSpot = useMemo(
    () => geoSpots.find((s) => s.id === activeGeoSpotId) || null,
    [geoSpots, activeGeoSpotId]
  );

  // 初期中心は activeGeoSpotId が一致するスポット（なければ京都市街中心）
  const initialCenter = useMemo(() => {
    if (activeSpot) {
      return [activeSpot.lat, activeSpot.lng];
    }
    return [KYOTO_CENTER.lat, KYOTO_CENTER.lng];
    // マウント時の初期座標のみ固定
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!rl) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: "260px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--clr-text-muted, #727272)",
          fontSize: "0.875rem",
          background: "var(--clr-surface, #f9fbff)",
        }}
      >
        {locale === "en" ? "Loading map…" : "地図を読み込み中…"}
      </div>
    );
  }

  const { L, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } = rl;
  const isEn = locale === "en";

  const makeIcon = (num, isActive, category) => {
    const size = isActive ? 36 : 28;
    const isRiver = category === "river";
    const isStreet = category === "street";
    const bg = isRiver
      ? "#0284c7"
      : isStreet
        ? "#15803d"
        : isActive
          ? "#e11d48"
          : "#c2410c";
    const border = isActive ? "3px solid #ffffff" : "2px solid #ffffff";
    const shadow = isActive
      ? isRiver
        ? "0 4px 12px rgba(2, 132, 199, 0.45)"
        : isStreet
          ? "0 4px 12px rgba(21, 128, 61, 0.45)"
          : "0 4px 12px rgba(225, 29, 72, 0.45)"
      : "0 2px 6px rgba(15, 23, 42, 0.35)";
    const fontSize = isActive ? "13px" : "11px";
    const label = isRiver ? "〜" : isStreet ? "＝" : num;

    return L.divIcon({
      className: "",
      html: `<div style="
        width:${size}px;
        height:${size}px;
        border-radius:9999px;
        background:${bg};
        color:#ffffff;
        border:${border};
        box-shadow:${shadow};
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight:700;
        font-size:${fontSize};
        line-height:1;
        transition:transform 0.2s ease;
        transform:${isActive ? "scale(1.08)" : "scale(1)"};
      ">${label}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2 + 4)],
    });
  };

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "260px", position: "relative" }}>
      <MapContainer
        center={initialCenter}
        zoom={DEFAULT_ZOOM}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FocusGeoSpot
          spot={activeSpot}
          markerRefs={markerRefs}
          lastFocusedIdRef={lastFocusedIdRef}
          useMap={useMap}
        />
        <InvalidateSize trigger={geoSpots.length} useMap={useMap} />
        {Object.entries(KYOTO_RIVER_POLYLINES).map(([riverId, positions]) => (
          <Polyline
            key={riverId}
            positions={positions}
            pathOptions={{ color: "#0284c7", weight: 4, opacity: 0.45 }}
          />
        ))}
        {geoSpots.map((spot, idx) => {
          const isActive = spot.id === activeGeoSpotId;
          const area = isEn ? spot.areaEn || spot.areaJa : spot.areaJa || spot.areaEn;
          const name = isEn ? spot.nameEn || spot.nameJa : spot.nameJa || spot.nameEn;
          const desc = isEn ? spot.descEn || spot.descJa : spot.descJa || spot.descEn;
          const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`;

          return (
            <Marker
              key={spot.id}
              position={[spot.lat, spot.lng]}
              icon={makeIcon(idx + 1, isActive, spot.category)}
              zIndexOffset={isActive ? 1000 : 0}
              ref={(el) => {
                if (el) markerRefs.current[spot.id] = el;
              }}
              eventHandlers={{
                click: () => {
                  onSelectGeoSpot?.(spot);
                },
              }}
            >
              <Popup maxWidth={260}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    minWidth: "180px",
                    fontFamily: "var(--font-ui, sans-serif)",
                  }}
                >
                  {area && (
                    <span
                      style={{
                        display: "inline-block",
                        alignSelf: "flex-start",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        background: "#f1f5f9",
                        color: "#334155",
                        fontSize: "11px",
                        fontWeight: 600,
                        lineHeight: 1.4,
                      }}
                    >
                      {area}
                    </span>
                  )}
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#0f172a",
                      lineHeight: 1.35,
                    }}
                  >
                    {name}
                  </div>
                  {desc && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        color: "#475569",
                        lineHeight: 1.5,
                      }}
                    >
                      {desc}
                    </p>
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      marginTop: "4px",
                    }}
                  >
                    {spot.matchedSpotId && (
                      <button
                        type="button"
                        onClick={() => onJumpToScrollSpot?.(spot.matchedSpotId)}
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "none",
                          background: "#e11d48",
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                      >
                        {isEn ? "View this scene in the scroll" : "絵巻のこの場面を見る"}
                      </button>
                    )}
                    <a
                      href={gmapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "12px",
                        color: "var(--clr-link, #065fd4)",
                        textDecoration: "underline",
                        textAlign: "center",
                      }}
                    >
                      {isEn ? "Open in Google Maps" : "Google マップで開く"}
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 1000,
          pointerEvents: "none",
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(4px)",
          borderRadius: "8px",
          padding: "6px 10px",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.14)",
          border: "1px solid rgba(15, 23, 42, 0.08)",
          fontFamily: "var(--font-ui, sans-serif)",
          fontSize: "11px",
          lineHeight: 1.45,
          color: "#1e293b",
          maxWidth: "calc(100% - 60px)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "6px",
            fontWeight: 600,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "9999px",
                background: "#c2410c",
                display: "inline-block",
              }}
            />
            {isEn ? "Temples & Landmarks" : "朱＝寺社・名所"}
          </span>
          <span style={{ color: "#94a3b8" }}>/</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "9999px",
                background: "#0284c7",
                display: "inline-block",
              }}
            />
            {isEn ? "Rivers & Canals (〜)" : "青＝河川・水路"}
          </span>
          <span style={{ color: "#94a3b8" }}>/</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "9999px",
                background: "#15803d",
                display: "inline-block",
              }}
            />
            {isEn ? "Streets (＝)" : "緑＝通り"}
          </span>
        </div>
        <div style={{ marginTop: "3px", color: "#475569", fontSize: "10.5px" }}>
          {isEn
            ? "East (Right Screen) = Higashiyama & Kamo R. / Center = Central Kyoto & Takase R. / West (Left Screen) = Nijo Castle & Oi R."
            : "東（右隻）＝東山・賀茂川 ／ 中央＝洛中・高瀬川 ／ 西（左隻）＝二条城・大堰川"}
        </div>
      </div>
    </div>
  );
};

export default ScrollSpotMapCanvas;
