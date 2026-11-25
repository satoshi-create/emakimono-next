import styles from "@/styles/EmakiHub.module.css";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import {
  getAllRakuchuGeoNodes,
  KYOTO_RIVER_POLYLINES,
} from "@/data/hub/rakuchuRakugaiGeoSpots";
import { REGIONS } from "@/data/hub/hubData";
import { RakuchuMotifCard } from "@/components/rakuchu-rakugai/RakuchuMotifCard";
import { RAKUCHU_SPOT_MASTERS } from "@/data/rakuchu-rakugai/rakuchuMotifMaster";

const RAKUCHU_TITLEENS = new Set([
  "rakuchu_rakugai_funaki",
  "rakuchu_rakugai_fukuoka",
  "rakuchu_rakugai_met",
]);

function pickRakuchuSpotId(node, titleen) {
  const aliases = node.aliasSpotIds ?? [];
  const id = node.masterId ?? node.id;
  if (aliases.length === 0) return id;
  if (aliases.length === 1) return aliases[0];
  const idx = (node.presentIn ?? []).indexOf(titleen);
  if (idx >= 0 && idx < aliases.length) return aliases[idx];
  return aliases[0];
}

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

function nodeMatchesTheme(node, theme) {
  if (!theme || theme === "all") return true;
  if (theme === "landmark") return node.category === "landmark";
  if (theme === "river") return node.category === "river";
  if (theme === "street") return node.category === "street";
  if (theme === "power") return node.rawCategory === "power";
  return true;
}

function nodeMatchesScroll(node, scroll) {
  if (!scroll || scroll === "all") return true;
  if (Array.isArray(node.scrollLinks) && node.scrollLinks.length > 0) {
    return node.scrollLinks.some((link) => link.titleen === scroll);
  }
  return (node.presentIn ?? []).includes(scroll);
}

function makeRakuchuGeoIcon(L, node, isDim = false) {
  const count = node.appearanceCount ?? (node.presentIn?.length || 1);
  const isRiver = node.category === "river";
  const isStreet = node.category === "street";
  let size = count >= 3 ? 42 : count === 2 ? 34 : 26;
  const bg = isRiver
    ? "#0284c7"
    : isStreet
      ? "#15803d"
      : count >= 3
        ? "#be123c"
        : "#c2410c";
  const border = "2px solid #ffffff";
  const shadow = "0 2px 6px rgba(15, 23, 42, 0.35)";
  const fontSize = count >= 3 ? "14px" : count === 2 ? "12px" : "11px";
  const label = isRiver ? "〜" : isStreet ? "＝" : `${count}`;
  const haloRing =
    count >= 3
      ? `<div style="position:absolute;inset:-5px;border-radius:9999px;border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 0 2px ${bg}66;pointer-events:none;"></div>`
      : "";
  const outerSize = count >= 3 ? size + 10 : size;
  const dimStyle = isDim ? "opacity:0.22;filter:grayscale(0.35);" : "";
  const html = `<div style="position:relative;width:${outerSize}px;height:${outerSize}px;display:flex;align-items:center;justify-content:center;${dimStyle}">
    ${haloRing}
    <div style="width:${size}px;height:${size}px;border-radius:9999px;background:${bg};color:#ffffff;border:${border};box-shadow:${shadow};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${fontSize};line-height:1;position:relative;z-index:1;">${label}</div>
  </div>`;
  return L.divIcon({
    className: styles.mapPinWrap,
    html,
    iconSize: [outerSize, outerSize],
    iconAnchor: [outerSize / 2, outerSize / 2],
    popupAnchor: [0, -(outerSize / 2 + 4)],
  });
}

function makeRouteWaypointIcon(L, num) {
  const size = 28;
  const html = `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:#b91c1c;color:#fff;border:2px solid #fff;box-shadow:0 2px 8px rgba(15,23,42,0.4);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;line-height:1;">${num}</div>`;
  return L.divIcon({
    className: styles.mapPinWrap,
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

const RAKUCHU_SCROLL_CHIP = {
  rakuchu_rakugai_funaki: { labelJa: "舟木本", labelEn: "Funaki scroll" },
  rakuchu_rakugai_fukuoka: { labelJa: "福岡本", labelEn: "Fukuoka scroll" },
  rakuchu_rakugai_met: { labelJa: "メトロポリタン本", labelEn: "Met scroll" },
};

/**
 * 制御コンポーネント（FlyToRegion / FitRoute / FocusScroll）はモジュールスコープに定義する。
 * コンポーネント内部で定義するとレンダーのたびに関数型が変わり、
 * React が毎回アンマウント/再マウントして副作用が再発火するため。
 * useMap は react-leaflet のクライアント動的ロード後に prop として受け取る。
 */
const FlyToRegion = ({ lat, lng, zoom, useMap }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 0.9 });
  }, [map, lat, lng, zoom]);
  return null;
};

const FitRoute = ({ stops, routeId, L, lastRouteRef, useMap }) => {
  const map = useMap();
  useEffect(() => {
    if (!routeId) {
      lastRouteRef.current = null;
      return;
    }
    if (!stops.length) return;
    const prev = lastRouteRef.current;
    if (prev && prev.routeId === routeId && prev.mapId === map._leaflet_id) return;
    lastRouteRef.current = { routeId, mapId: map._leaflet_id };
    const bounds = L.latLngBounds(
      stops.map((s) => {
        const lat = s.lat ?? s.spot?.lat;
        const lng = s.lng ?? s.spot?.lng;
        return [lat, lng];
      })
    );
    map.flyToBounds(bounds, {
      padding: [50, 50],
      maxZoom: 15,
      duration: 0.9,
    });
  }, [map, routeId, stops, L, lastRouteRef]);
  return null;
};

const FocusScroll = ({ target, zoom, markerRefs, lastFocusedRef, useMap }) => {
  const map = useMap();
  useEffect(() => {
    const key = target ? target.titleen || target.titleJa : null;
    if (!target || lastFocusedRef.current === key) return;
    lastFocusedRef.current = key;
    const lat = target.pinLat ?? target.spot.lat;
    const lng = target.pinLng ?? target.spot.lng;
    map.flyTo([lat, lng], zoom, { duration: 1 });
    const timer = setTimeout(() => {
      markerRefs.current[key]?.openPopup();
    }, 1200);
    return () => clearTimeout(timer);
  }, [target, map, zoom, markerRefs, lastFocusedRef]);
  return null;
};

// 全画面切替でコンテナサイズが変わった際に Leaflet のレイアウトを更新する
const InvalidateSize = ({ isFullscreen, useMap }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(timer);
  }, [map, isFullscreen]);
  useEffect(() => {
    const el = map.getContainer()?.parentElement;
    if (!el) return undefined;
    const invalidate = () => map.invalidateSize();
    const ro = new ResizeObserver(invalidate);
    ro.observe(el);
    window.addEventListener("resize", invalidate);
    invalidate();
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", invalidate);
    };
  }, [map]);
  return null;
};

/**
 * Leaflet 地図ビュー。
 * react-leaflet / leaflet はクライアント側でのみ動的ロードする
 * （サーバーレンダリング時に window 未定義でクラッシュするのを防ぐ）。
 * リージョン変更時に flyTo で中心を移動する。
 */
const EmakiHubMap = ({
  region,
  items,
  locale,
  t,
  activeScroll = "all",
  activeRoute = null,
  activeTheme = "all",
  isFullscreen = false,
}) => {
  const isJa = locale === "ja";
  const [rl, setRl] = useState(null);
  const [openPopupKey, setOpenPopupKey] = useState(null);
  const markerRefs = useRef({});
  // 自動フォーカス済みの作品を記憶し、テーマ切替等の再レンダーで再実行させない
  const lastFocusedRef = useRef(null);
  const lastRouteRef = useRef(null);

  useEffect(() => {
    let active = true;
    Promise.all([import("leaflet"), import("react-leaflet")]).then(
      ([leafletMod, rlMod]) => {
        if (!active) return;
        setRl({
          L: leafletMod.default || leafletMod,
          MapContainer: rlMod.MapContainer,
          Marker: rlMod.Marker,
          Popup: rlMod.Popup,
          TileLayer: rlMod.TileLayer,
          Polyline: rlMod.Polyline,
          useMap: rlMod.useMap,
        });
      }
    );
    return () => {
      active = false;
    };
  }, []);

  // 同一座標の作品をグループ化し、n 個目は ±0.002deg 程度ずつ横にオフセット。
  // pinLat/pinLng をずらした位置、pinNum を表示用番号として付与する。
  // フック数の整合のため early return より前で必ず呼ぶ。
  const positioned = useMemo(() => {
    const groups = {};
    items.forEach((it) => {
      if (!it.spot) return;
      const key = `${it.spot.lat},${it.spot.lng}`;
      (groups[key] = groups[key] || []).push(it);
    });
    return items.map((it, i) => {
      if (!it.spot) return { ...it, pinNum: i + 1 };
      const key = `${it.spot.lat},${it.spot.lng}`;
      const group = groups[key];
      if (group.length <= 1) return { ...it, pinNum: i + 1 };
      const idx = group.indexOf(it);
      const d = (idx - (group.length - 1) / 2) * 0.002;
      return {
        ...it,
        pinNum: i + 1,
        pinLat: it.spot.lat + d,
        pinLng: it.spot.lng + d,
      };
    });
  }, [items]);

  // アクティブルートの stops（spot を持つもののみ）。titleen 対応の番号マップを作る
  const routeData = useMemo(() => {
    if (!activeRoute) return null;
    const raw = activeRoute.waypoints ?? activeRoute.stops ?? [];
    const stops = raw
      .map((wp) => ({
        ...wp,
        spot:
          wp.spot ??
          (wp.lat != null && wp.lng != null
            ? {
                lat: wp.lat,
                lng: wp.lng,
                nameJa: wp.nameJa,
                nameEn: wp.nameEn,
              }
            : null),
      }))
      .filter((s) => s.spot?.lat != null && s.spot?.lng != null);
    const indexByTitleen = {};
    const indexByKey = {};
    stops.forEach((stop, i) => {
      if (stop.titleen) indexByTitleen[stop.titleen] = i;
      indexByKey[`${stop.spot.lat},${stop.spot.lng}-${i}`] = i;
    });
    return { stops, indexByTitleen, indexByKey };
  }, [activeRoute]);

  const regionObj =
    typeof region === "string"
      ? REGIONS[region] || REGIONS.kyoto
      : region || REGIONS.kyoto;
  const regionId =
    regionObj?.id || (typeof region === "string" ? region : "kyoto");
  const centerLat = Array.isArray(regionObj?.center)
    ? regionObj.center[0]
    : regionObj?.center?.lat ?? 35.0116;
  const centerLng = Array.isArray(regionObj?.center)
    ? regionObj.center[1]
    : regionObj?.center?.lng ?? 135.7681;
  const zoomLevel = regionObj?.zoom ?? 13;

  const isKyoto = regionId === "kyoto";
  const showRakuchuGeoHub = isKyoto;

  const rakuchuGeoNodes = useMemo(() => {
    if (!isKyoto) return [];
    const nodes = getAllRakuchuGeoNodes();
    if (!activeScroll || activeScroll === "all") return nodes;
    return nodes.filter((node) => nodeMatchesScroll(node, activeScroll));
  }, [isKyoto, activeScroll]);

  const rakuchuScrollLabels = useMemo(() => {
    const labels = {};
    items.forEach((it) => {
      if (!it.titleen || !RAKUCHU_TITLEENS.has(it.titleen)) return;
      labels[it.titleen] = isJa
        ? it.titleJa || it.title
        : it.title || it.titleEn || it.titleJa;
    });
    return labels;
  }, [items, isJa]);

  if (!rl) {
    return <div className={styles.mapLoading}>Loading map…</div>;
  }

  const { L, MapContainer, Marker, Popup, TileLayer, Polyline, useMap } = rl;
  const themeActive = activeTheme && activeTheme !== "all";

  // ?scroll= 指定で対象となる作品（現在のリージョン内のみ）
  const activeTarget =
    activeScroll &&
    activeScroll !== "all" &&
    positioned.find((it) => it.titleen === activeScroll && it.spot);

  const mapWrapStyle = {
    height: "100%",
    width: "100%",
    ...(isKyoto ? { position: "relative" } : {}),
  };

  return (
    <div className={styles.mapWrap} style={mapWrapStyle}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={zoomLevel}
        className={styles.map}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToRegion
          lat={centerLat}
          lng={centerLng}
          zoom={zoomLevel}
          useMap={useMap}
        />
        <FocusScroll
          target={activeTarget}
          zoom={Math.max(zoomLevel, 15)}
          markerRefs={markerRefs}
          lastFocusedRef={lastFocusedRef}
          useMap={useMap}
        />
        <FitRoute
          stops={routeData?.stops ?? []}
          routeId={activeRoute?.id}
          L={L}
          lastRouteRef={lastRouteRef}
          useMap={useMap}
        />
        <InvalidateSize isFullscreen={isFullscreen} useMap={useMap} />
        {routeData && (
          <>
            <Polyline
              positions={routeData.stops.map((s) => [s.spot.lat, s.spot.lng])}
              pathOptions={{
                color: "#b91c1c",
                weight: 4,
                opacity: 0.85,
                dashArray: "8, 6",
              }}
            />
            {routeData.stops.map((stop, idx) => {
              const markerUniqueKey = `route-${idx}-${stop.spotId}`;
              return (
              <Marker
                key={`route-wp-${activeRoute.id}-${idx}`}
                position={[stop.spot.lat, stop.spot.lng]}
                icon={makeRouteWaypointIcon(L, idx + 1)}
                zIndexOffset={800 + idx}
                eventHandlers={{
                  popupopen: () => setOpenPopupKey(markerUniqueKey),
                  popupclose: () =>
                    setOpenPopupKey((prev) =>
                      prev === markerUniqueKey ? null : prev
                    ),
                }}
              >
                <Popup
                  className={styles.mapPopup}
                  maxWidth={290}
                  minWidth={250}
                  autoPan
                  autoPanPaddingTopLeft={[24, 48]}
                  autoPanPaddingBottomRight={[24, 40]}
                >
                  {openPopupKey === markerUniqueKey ? (
                    <RakuchuMotifCard
                      motif={resolveRakuchuMotif(stop.spot)}
                      variant="popup"
                      locale={locale}
                    />
                  ) : null}
                </Popup>
              </Marker>
              );
            })}
          </>
        )}
        {showRakuchuGeoHub &&
          Object.entries(KYOTO_RIVER_POLYLINES).map(([riverId, positions]) => (
            <Polyline
              key={`kyoto-river-${riverId}`}
              positions={positions}
              pathOptions={{
                color: "#0284c7",
                weight: 3.5,
                opacity: 0.35,
              }}
            />
          ))}
        {showRakuchuGeoHub &&
          rakuchuGeoNodes.map((node) => {
            const matchesTheme = nodeMatchesTheme(node, activeTheme);
            const matchesScroll = nodeMatchesScroll(node, activeScroll);
            if (themeActive && !matchesTheme) return null;
            if (activeScroll && activeScroll !== "all" && !matchesScroll) {
              return null;
            }
            const markerUniqueKey = `spot-${node.id || node.masterId}`;
            return (
              <Marker
                key={`rakuchu-geo-${node.id}`}
                position={[node.lat, node.lng]}
                icon={makeRakuchuGeoIcon(L, node, themeActive && !matchesTheme)}
                eventHandlers={{
                  popupopen: () => setOpenPopupKey(markerUniqueKey),
                  popupclose: () =>
                    setOpenPopupKey((prev) =>
                      prev === markerUniqueKey ? null : prev
                    ),
                }}
              >
                <Popup
                  className={styles.mapPopup}
                  maxWidth={290}
                  minWidth={250}
                  autoPan
                  autoPanPaddingTopLeft={[24, 48]}
                  autoPanPaddingBottomRight={[24, 40]}
                >
                  {openPopupKey === markerUniqueKey ? (
                    <RakuchuMotifCard
                      motif={resolveRakuchuMotif(node)}
                      variant="popup"
                      locale={locale}
                    />
                  ) : null}
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
      {isKyoto && (
        <>
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
            {isJa ? "北（洛北・御所）" : "N · Rakuhoku / Imperial Palace"}
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
            {isJa ? "南（洛南・東寺・伏見）" : "S · Rakunan / To-ji / Fushimi"}
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
            {isJa ? (
              <>
                東<span style={{ color: "#b91c1c" }}>【右隻】</span>東山・鴨川
              </>
            ) : (
              <>
                E{" "}
                <span style={{ color: "#b91c1c" }}>[Right Screen]</span>{" "}
                Higashiyama / Kamo River
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
            {isJa ? (
              <>
                西<span style={{ color: "#b91c1c" }}>【左隻】</span>二条城・嵐山
              </>
            ) : (
              <>
                W <span style={{ color: "#b91c1c" }}>[Left Screen]</span> Nijo
                Castle / Arashiyama
              </>
            )}
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 10,
              zIndex: 450,
              pointerEvents: "none",
              background: "rgba(255, 255, 255, 0.88)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(148, 163, 184, 0.4)",
              borderRadius: "6px",
              padding: "4px 10px",
              fontSize: 10.5,
              fontWeight: 600,
              color: "#334155",
              boxShadow: "0 1px 4px rgba(15, 23, 42, 0.1)",
              fontFamily: "var(--font-ui, sans-serif)",
              whiteSpace: "nowrap",
            }}
          >
            {isJa ? (
              <>
                <span style={{ color: "#c2410c" }}>●</span>寺社{" "}
                <span style={{ color: "#0284c7" }}>●</span>川{" "}
                <span style={{ color: "#15803d" }}>●</span>道 ｜
                円＝登場数(1〜3)
              </>
            ) : (
              <>
                <span style={{ color: "#c2410c" }}>●</span> Temples{" "}
                <span style={{ color: "#0284c7" }}>●</span> River{" "}
                <span style={{ color: "#15803d" }}>●</span> Street | Circle =
                scroll count (1–3)
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EmakiHubMap;
