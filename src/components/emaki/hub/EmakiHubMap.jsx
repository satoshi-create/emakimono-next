import styles from "@/styles/EmakiHub.module.css";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

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
        {positioned.map((item) => {
          if (!item.spot) return null;
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
