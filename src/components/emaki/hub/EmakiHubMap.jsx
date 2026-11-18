import styles from "@/styles/EmakiHub.module.css";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import {
  getAllRakuchuGeoNodes,
  KYOTO_RIVER_POLYLINES,
} from "@/data/hub/rakuchuRakugaiGeoSpots";

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

function makeRakuchuGeoIcon(L, node) {
  const count = node.appearanceCount ?? (node.presentIn?.length || 1);
  let size;
  let bg;
  let shadow = "";
  if (count >= 3) {
    size = 44;
    bg = "#be123c";
    shadow = "box-shadow:0 0 0 5px rgba(225,29,72,0.22)";
  } else if (count === 2) {
    size = 34;
    bg = "#c2410c";
    shadow = "box-shadow:0 0 0 3px rgba(194,65,12,0.2)";
  } else {
    size = 26;
    if (node.category === "river") bg = "#0284c7";
    else if (node.category === "street") bg = "#15803d";
    else bg = "#475569";
  }
  const html = `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};${shadow};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${
    size >= 40 ? 15 : 12
  }px;line-height:1;border:2px solid rgba(255,255,255,0.9);">${count}</div>`;
  return L.divIcon({
    className: styles.mapPinWrap,
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -Math.round(size / 2)],
  });
}

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
    // ルート解除時は記憶をリセットし、同じルートを再選択しても再発火できるようにする
    if (!routeId) {
      lastRouteRef.current = null;
      return;
    }
    if (!stops.length) return;
    // マップインスタンスが作り直された場合（StrictMode 等）も再フォーカスさせる
    const prev = lastRouteRef.current;
    if (prev && prev.routeId === routeId && prev.mapId === map._leaflet_id) return;
    lastRouteRef.current = { routeId, mapId: map._leaflet_id };
    const bounds = L.latLngBounds(
      stops.map((s) => [s.spot.lat, s.spot.lng])
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
  activeScroll = null,
  activeRoute = null,
  isFullscreen = false,
}) => {
  const [rl, setRl] = useState(null);
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
    const stops = activeRoute.stops.filter((s) => s.spot);
    const indexByTitleen = {};
    stops.forEach((stop, i) => {
      if (stop.titleen) indexByTitleen[stop.titleen] = i;
    });
    return { stops, indexByTitleen };
  }, [activeRoute]);

  const showRakuchuGeoHub = useMemo(
    () =>
      region.id === "kyoto" &&
      items.some((it) => it.titleen && RAKUCHU_TITLEENS.has(it.titleen)),
    [region.id, items]
  );

  const rakuchuGeoNodes = useMemo(() => {
    if (!showRakuchuGeoHub) return [];
    const all = getAllRakuchuGeoNodes();
    if (activeScroll && RAKUCHU_TITLEENS.has(activeScroll)) {
      return all.filter((n) => n.presentIn.includes(activeScroll));
    }
    return all;
  }, [showRakuchuGeoHub, activeScroll]);

  const rakuchuScrollLabels = useMemo(() => {
    const labels = {};
    items.forEach((it) => {
      if (!it.titleen || !RAKUCHU_TITLEENS.has(it.titleen)) return;
      labels[it.titleen] =
        locale === "en"
          ? it.title || it.titleEn || it.titleJa
          : it.titleJa || it.title;
    });
    return labels;
  }, [items, locale]);

  if (!rl) {
    return <div className={styles.mapLoading}>Loading map…</div>;
  }

  const { L, MapContainer, Marker, Popup, TileLayer, Polyline, useMap } = rl;

  // 絵巻風のカスタムピン（デフォルトアイコンはバンドラーで壊れるため不使用）
  const pinColor = region.id === "kyoto" ? "#ff8c77" : "#54896a";
  const routeColor = "#121212";
  const makeIcon = (num, isActive = false, dim = false, isRoute = false) =>
    L.divIcon({
      className: styles.mapPinWrap,
      html: `<div class="${styles.mapPin}${
        isActive ? " " + styles.mapPinActive : ""
      }${dim ? " " + styles.mapPinDim : ""}${
        isRoute ? " " + styles.mapPinRoute : ""
      }" style="background:${isRoute ? routeColor : pinColor}"><span>${num}</span></div>`,
      iconSize: [34, 42],
      iconAnchor: [17, 40],
      popupAnchor: [0, -38],
    });

  // ?scroll= 指定で対象となる作品（現在のリージョン内のみ）
  const activeTarget =
    activeScroll &&
    positioned.find((it) => it.titleen === activeScroll && it.spot);

  return (
    <div className={styles.mapWrap}>
      <MapContainer
        center={[region.center.lat, region.center.lng]}
        zoom={region.zoom}
        className={styles.map}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToRegion
          lat={region.center.lat}
          lng={region.center.lng}
          zoom={region.zoom}
          useMap={useMap}
        />
        <FocusScroll
          target={activeTarget}
          zoom={Math.max(region.zoom, 15)}
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
          <Polyline
            positions={routeData.stops.map((s) => [s.spot.lat, s.spot.lng])}
            pathOptions={{
              color: routeColor,
              weight: 3,
              opacity: 0.75,
              dashArray: "8 8",
            }}
          />
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
            const count =
              node.appearanceCount ?? (node.presentIn?.length || 1);
            const name =
              locale === "en"
                ? node.nameEn || node.nameJa
                : node.nameJa || node.nameEn;
            const area =
              locale === "en"
                ? node.areaEn || node.areaJa
                : node.areaJa || node.areaEn;
            const desc =
              locale === "en"
                ? node.descEn || node.descJa
                : node.descJa || node.descEn;
            const badge =
              locale === "en"
                ? `${count} scroll${count > 1 ? "s" : ""} depict this place`
                : `${count}作品に描かれた名所`;
            return (
              <Marker
                key={`rakuchu-geo-${node.id}`}
                position={[node.lat, node.lng]}
                icon={makeRakuchuGeoIcon(L, node)}
              >
                <Popup className={styles.mapPopup} maxWidth={280}>
                  <div className={styles.mapPopupCard}>
                    <p className={styles.mapPopupTitle}>{name}</p>
                    {area ? (
                      <p className={styles.mapPopupSpot}>{area}</p>
                    ) : null}
                    <p className={styles.mapPopupTitleEn}>{badge}</p>
                    {desc ? (
                      <p className={styles.mapPopupDesc}>{desc}</p>
                    ) : null}
                    {(node.presentIn ?? []).map((titleen) => (
                      <Link
                        key={`${node.id}-${titleen}`}
                        href={`/${titleen}?spot=${pickRakuchuSpotId(
                          node,
                          titleen
                        )}`}
                      >
                        <a
                          className={styles.mapPopupBtn}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {rakuchuScrollLabels[titleen] || titleen}
                        </a>
                      </Link>
                    ))}
                    <a
                      className={styles.mapPopupGmap}
                      href={`https://maps.google.com/?q=${node.lat},${node.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("emakiHub.openMap")}
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        {positioned.map((item) => {
          if (!item.spot) return null;
          if (
            showRakuchuGeoHub &&
            item.titleen &&
            RAKUCHU_TITLEENS.has(item.titleen)
          ) {
            return null;
          }
          const lat = item.pinLat ?? item.spot.lat;
          const lng = item.pinLng ?? item.spot.lng;
          const isComingSoon = item.status === "coming-soon";
          const routeIdx = routeData
            ? routeData.indexByTitleen[item.titleen]
            : undefined;
          const isRoutePin = routeIdx !== undefined;
          return (
            <Marker
              key={item.titleen || item.titleJa}
              position={[lat, lng]}
              icon={makeIcon(
                isRoutePin ? routeIdx + 1 : item.pinNum,
                item.titleen === activeScroll,
                routeData ? !isRoutePin : false,
                isRoutePin
              )}
              ref={(el) => {
                if (el) markerRefs.current[item.titleen || item.titleJa] = el;
              }}
            >
              <Popup className={styles.mapPopup} maxWidth={260}>
                <div className={styles.mapPopupCard}>
                  {item.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumb}
                      alt={item.title || item.titleJa}
                      className={styles.mapPopupImg}
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.mapPopupImgPlaceholder}>
                      {t("emakiHub.comingSoon")}
                    </div>
                  )}
                  <p className={styles.mapPopupTitle}>
                    {item.title || item.titleJa}
                  </p>
                  <p className={styles.mapPopupTitleEn}>
                    {item.titleen || item.titleEn}
                  </p>
                  <p className={styles.mapPopupSpot}>
                    {item.spot.nameJa}（{item.spot.nameEn}）
                  </p>
                  {item.spot.desc && (
                    <p className={styles.mapPopupDesc}>
                      {locale === "en" ? item.spot.desc.en : item.spot.desc.ja}
                    </p>
                  )}
                  {!isComingSoon && item.titleen ? (
                    <Link href={`/${item.titleen}`}>
                      <a
                        className={styles.mapPopupBtn}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t("emakiHub.viewerBtn")}
                      </a>
                    </Link>
                  ) : (
                    <span className={styles.mapPopupSoon}>
                      {t("emakiHub.comingSoon")}
                    </span>
                  )}
                  <a
                    className={styles.mapPopupGmap}
                    href={`https://maps.google.com/?q=${item.spot.lat},${item.spot.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("emakiHub.openMap")}
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
        {/* ルート内の単独観光スポット（絵巻ピン以外） */}
        {routeData?.stops
          .filter((s) => !s.titleen)
          .map((stop, i) => {
            const idx = routeData.stops.indexOf(stop);
            return (
              <Marker
                key={`route-spot-${activeRoute.id}-${idx}`}
                position={[stop.spot.lat, stop.spot.lng]}
                icon={makeIcon(idx + 1, false, false, true)}
              >
                <Popup className={styles.mapPopup} maxWidth={260}>
                  <div className={styles.mapPopupCard}>
                    <div className={styles.mapPopupImgPlaceholder}>
                      {t("emakiHub.routeStopSpot")}
                    </div>
                    <p className={styles.mapPopupTitle}>{stop.spot.nameJa}</p>
                    <p className={styles.mapPopupTitleEn}>{stop.spot.nameEn}</p>
                    {stop.note && (
                      <p className={styles.mapPopupDesc}>
                        {locale === "en" ? stop.note.en : stop.note.ja}
                      </p>
                    )}
                    <a
                      className={styles.mapPopupGmap}
                      href={`https://maps.google.com/?q=${stop.spot.lat},${stop.spot.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("emakiHub.openMap")}
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
};

export default EmakiHubMap;
