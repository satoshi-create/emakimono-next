import styles from "@/styles/EmakiHub.module.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";

/**
 * Leaflet 地図ビュー。
 * react-leaflet / leaflet はクライアント側でのみ動的ロードする
 * （サーバーレンダリング時に window 未定義でクラッシュするのを防ぐ）。
 * リージョン変更時に flyTo で中心を移動する。
 */
const EmakiHubMap = ({ region, items, locale, t }) => {
  const [rl, setRl] = useState(null);

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

  if (!rl) {
    return <div className={styles.mapLoading}>Loading map…</div>;
  }

  const { L, MapContainer, Marker, Popup, TileLayer, useMap } = rl;

  // 絵巻風のカスタムピン（デフォルトアイコンはバンドラーで壊れるため不使用）
  const pinColor = region.id === "kyoto" ? "#ff8c77" : "#54896a";
  const makeIcon = (num) =>
    L.divIcon({
      className: styles.mapPinWrap,
      html: `<div class="${styles.mapPin}" style="background:${pinColor}"><span>${num}</span></div>`,
      iconSize: [34, 42],
      iconAnchor: [17, 40],
      popupAnchor: [0, -38],
    });

  // リージョン変更時に地図中心を移動する制御コンポーネント
  const FlyToRegion = ({ lat, lng, zoom }) => {
    const map = useMap();
    useEffect(() => {
      map.flyTo([lat, lng], zoom, { duration: 0.9 });
    }, [map, lat, lng, zoom]);
    return null;
  };

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
        />
        {positioned.map((item) => {
          if (!item.spot) return null;
          const lat = item.pinLat ?? item.spot.lat;
          const lng = item.pinLng ?? item.spot.lng;
          const isComingSoon = item.status === "coming-soon";
          return (
            <Marker
              key={item.titleen || item.titleJa}
              position={[lat, lng]}
              icon={makeIcon(item.pinNum)}
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
      </MapContainer>
    </div>
  );
};

export default EmakiHubMap;
