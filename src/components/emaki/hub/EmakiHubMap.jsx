import styles from "@/styles/EmakiHub.module.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

/**
 * Leaflet 地図ビュー。
 * react-leaflet / leaflet はクライアント側でのみ動的ロードする
 * （サーバーレンダリング時に window 未定義でクラッシュするのを防ぐ）。
 * リージョン変更時に flyTo で中心を移動する。
 */
const EmakiHubMap = ({ region, items, t }) => {
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

  if (!rl) {
    return <div className={styles.mapLoading}>Loading map…</div>;
  }

  const { L, MapContainer, Marker, Popup, TileLayer, useMap } = rl;

  // 絵巻風のカスタムピン（デフォルトアイコンはバンドラーで壊れるため不使用）
  const pinColor = region.id === "kyoto" ? "#ff8c77" : "#54896a";
  const emakiIcon = L.divIcon({
    className: styles.mapPinWrap,
    html: `<div class="${styles.mapPin}" style="background:${pinColor}"><span>巻</span></div>`,
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
        scrollWheelZoom={false}
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
        {items.map((item) => {
          if (!item.spot) return null;
          const { lat, lng } = item.spot;
          const isComingSoon = item.status === "coming-soon";
          return (
            <Marker
              key={item.titleen || item.titleJa}
              position={[lat, lng]}
              icon={emakiIcon}
            >
              <Popup className={styles.mapPopup}>
                <div className={styles.mapPopupCard}>
                  <p className={styles.mapPopupTitle}>
                    {item.title || item.titleJa}
                  </p>
                  <p className={styles.mapPopupTitleEn}>
                    {item.titleen || item.titleEn}
                  </p>
                  <p className={styles.mapPopupSpot}>
                    {item.spot.nameJa}（{item.spot.nameEn}）
                  </p>
                  {!isComingSoon && item.titleen ? (
                    <Link href={`/${item.titleen}`}>
                      <a className={styles.mapPopupBtn}>
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
                    href={`https://maps.google.com/?q=${lat},${lng}`}
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
