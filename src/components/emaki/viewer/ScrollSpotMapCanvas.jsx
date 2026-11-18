import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { KYOTO_RIVER_POLYLINES } from "@/data/hub/rakuchuRakugaiGeoSpots";
import { RakuchuMotifCard } from "@/components/rakuchu-rakugai/RakuchuMotifCard";
import { RAKUCHU_SPOT_MASTERS } from "@/data/rakuchu-rakugai/rakuchuMotifMaster";

const KYOTO_CENTER = { lat: 35.0036, lng: 135.7681 };
const DEFAULT_ZOOM = 13;
const FOCUS_ZOOM = 15;

function resolveRakuchuMotif(node) {
  if (!node) return null;
  const masterId = node.masterId ?? node.id;
  const master = RAKUCHU_SPOT_MASTERS.find(
    (m) => m.masterId === masterId || m.id === masterId
  );
  return master
    ? { ...master, ...node, masterId: master.masterId ?? masterId }
    : { ...node, masterId };
}

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
  currentTitleen = null,
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

  const makeIcon = (appearanceCount, isActive, category) => {
    const count = appearanceCount ?? 1;
    let size = count >= 3 ? 42 : count === 2 ? 34 : 26;
    if (isActive) size += 4;
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
      ? "0 6px 18px rgba(15, 23, 42, 0.55)"
      : "0 2px 6px rgba(15, 23, 42, 0.35)";
    const fontSize = count >= 3 ? "14px" : count === 2 ? "12px" : "11px";
    const label = isRiver ? "〜" : isStreet ? "＝" : `${count}`;
    const haloRing =
      count >= 3
        ? `<div style="
          position:absolute;
          inset:-5px;
          border-radius:9999px;
          border:2px solid rgba(255,255,255,0.9);
          box-shadow:0 0 0 2px ${bg}66;
          pointer-events:none;
        "></div>`
        : "";

    const outerSize = count >= 3 ? size + 10 : size;

    return L.divIcon({
      className: "",
      html: `<div style="position:relative;width:${outerSize}px;height:${outerSize}px;display:flex;align-items:center;justify-content:center;">
        ${haloRing}
        <div style="
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
          position:relative;
          z-index:1;
        ">${label}</div>
      </div>`,
      iconSize: [outerSize, outerSize],
      iconAnchor: [outerSize / 2, outerSize / 2],
      popupAnchor: [0, -(outerSize / 2 + 4)],
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
          const appearanceCount = spot.appearanceCount ?? 1;

          return (
            <Marker
              key={spot.id}
              position={[spot.lat, spot.lng]}
              icon={makeIcon(appearanceCount, isActive, spot.category)}
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
              <Popup
                maxWidth={290}
                minWidth={250}
                autoPan
                autoPanPaddingTopLeft={[24, 48]}
                autoPanPaddingBottomRight={[24, 40]}
              >
                <RakuchuMotifCard
                  motif={resolveRakuchuMotif(spot)}
                  variant="popup"
                  currentScrollTitleen={currentTitleen}
                  onJumpToCurrentScroll={(href) => {
                    const m =
                      typeof href === "string"
                        ? href.match(/[?&]spot=([^&]+)/)
                        : null;
                    if (m) onJumpToScrollSpot?.(decodeURIComponent(m[1]));
                    else if (spot.matchedSpotId)
                      onJumpToScrollSpot?.(spot.matchedSpotId);
                  }}
                  locale={locale}
                />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <div
        style={{
          position: "absolute",
          top: 8,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 450,
          pointerEvents: "none",
          background: "rgba(255, 255, 255, 0.88)",
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(148, 163, 184, 0.4)",
          borderRadius: "6px",
          padding: "4px 10px",
          fontSize: 11,
          fontWeight: 600,
          color: "#1e293b",
          boxShadow: "0 1px 4px rgba(15, 23, 42, 0.1)",
          fontFamily: "var(--font-ui, sans-serif)",
          whiteSpace: "nowrap",
        }}
      >
        {isEn ? "N · Rakuhoku / Imperial Palace" : "北（洛北・御所）"}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 450,
          pointerEvents: "none",
          background: "rgba(255, 255, 255, 0.88)",
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(148, 163, 184, 0.4)",
          borderRadius: "6px",
          padding: "4px 10px",
          fontSize: 11,
          fontWeight: 600,
          color: "#1e293b",
          boxShadow: "0 1px 4px rgba(15, 23, 42, 0.1)",
          fontFamily: "var(--font-ui, sans-serif)",
          whiteSpace: "nowrap",
        }}
      >
        {isEn ? "S · Rakunan / To-ji / Fushimi" : "南（洛南・東寺・伏見）"}
      </div>
      <div
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 450,
          pointerEvents: "none",
          background: "rgba(255, 255, 255, 0.88)",
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(148, 163, 184, 0.4)",
          borderRadius: "6px",
          padding: "8px 4px",
          fontSize: 11,
          fontWeight: 600,
          color: "#1e293b",
          boxShadow: "0 1px 4px rgba(15, 23, 42, 0.1)",
          fontFamily: "var(--font-ui, sans-serif)",
          writingMode: "vertical-rl",
        }}
      >
        {isEn ? (
          <>
            E <span style={{ color: "#b91c1c" }}>[Right Screen]</span> Higashiyama / Kamo River
          </>
        ) : (
          <>
            東<span style={{ color: "#b91c1c" }}>【右隻】</span>東山・鴨川
          </>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          left: 8,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 450,
          pointerEvents: "none",
          background: "rgba(255, 255, 255, 0.88)",
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(148, 163, 184, 0.4)",
          borderRadius: "6px",
          padding: "8px 4px",
          fontSize: 11,
          fontWeight: 600,
          color: "#1e293b",
          boxShadow: "0 1px 4px rgba(15, 23, 42, 0.1)",
          fontFamily: "var(--font-ui, sans-serif)",
          writingMode: "vertical-rl",
        }}
      >
        {isEn ? (
          <>
            W <span style={{ color: "#1d4ed8" }}>[Left Screen]</span> Nijo Castle / Arashiyama
          </>
        ) : (
          <>
            西<span style={{ color: "#1d4ed8" }}>【左隻】</span>二条城・嵐山
          </>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 6,
          left: 8,
          zIndex: 450,
          pointerEvents: "none",
          background: "rgba(255, 255, 255, 0.88)",
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(148, 163, 184, 0.4)",
          borderRadius: "6px",
          padding: "4px 8px",
          fontSize: 11,
          fontWeight: 600,
          color: "#1e293b",
          boxShadow: "0 1px 4px rgba(15, 23, 42, 0.1)",
          fontFamily: "var(--font-ui, sans-serif)",
          whiteSpace: "nowrap",
        }}
      >
        {isEn
          ? "●Landmark ●River ●Street | Size = Scrolls (1-3)"
          : "●寺社 ●川 ●道 ｜ 円＝登場数(1〜3)"}
      </div>
    </div>
  );
};

export default ScrollSpotMapCanvas;
