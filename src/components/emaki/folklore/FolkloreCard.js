/**
 * 絵引ハブ用カード。切り抜きサムネ + ディープリンクでビューア該当シーンへ。
 */
import styles from "@/styles/FolkloreCard.module.css";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

/** crop_thumb 未整備時の絵巻代表サムネイル */
const SCROLL_THUMB_FALLBACK = {
  naomoto_moushibumi_ekotoba: "/thumb/naomoto_moushibumi_ekotoba_thumb.webp",
  "eshi-no-soshi_tohaku": "/thumb/eshi-no-soshi_tohaku_thumb.webp",
  gakisoushi_kawamoto: "/thumb/gakisoushi_kawamoto_thumb.webp",
  "Chōjū-jinbutsu-giga_first": "/thumb/cyoujyuu_yamazaki_kou_thumb.webp",
  "Chōjū-jinbutsu-giga_third": "/thumb/cyoujyuu_yamazaki_hei_thumb.webp",
  "Chōjū-jinbutsu-giga_fourth": "/thumb/cyoujyuu_yamazaki_tei_thumb.webp",
};

function resolveFallback(titleen) {
  return (
    SCROLL_THUMB_FALLBACK[titleen] ||
    "/thumb/naomoto_moushibumi_ekotoba_thumb.webp"
  );
}

const FolkloreCard = ({ item }) => {
  const fallback = resolveFallback(item?.titleen);
  const [imgSrc, setImgSrc] = useState(fallback);

  // crop_thumb が実在するときだけ差し替え（未配置 404 を避ける）
  useEffect(() => {
    setImgSrc(fallback);
    const crop = item?.crop_thumb;
    if (!crop || crop === fallback) return undefined;
    let cancelled = false;
    const probe = new window.Image();
    probe.onload = () => {
      if (!cancelled) setImgSrc(crop);
    };
    probe.src = crop;
    return () => {
      cancelled = true;
    };
  }, [item?.crop_thumb, item?.item_id, fallback]);

  if (!item) return null;

  const href = `/${item.titleen}?scene=${encodeURIComponent(
    item.scene_id
  )}&ebiki=${encodeURIComponent(item.item_id)}`;

  return (
    <article className={styles.card}>
      <div className={styles.thumbWrap}>
        <Image
          src={imgSrc}
          alt=""
          layout="fill"
          objectFit="cover"
          loading="lazy"
          className={styles.thumb}
        />
      </div>
      <div className={styles.body}>
        <div className={styles.meta}>
          {item.act_label ? (
            <span className={styles.tag}>{item.act_label}</span>
          ) : null}
          {item.era ? <span className={styles.era}>{item.era}</span> : null}
        </div>
        <h3 className={styles.title}>{item.name}</h3>
        {item.reading ? <p className={styles.reading}>{item.reading}</p> : null}
        <p className={styles.scroll}>
          {item.ebiki?.original_emaki || item.titleen}
          {item.scene_id ? ` · 段 ${item.scene_id}` : ""}
          {item.scene_title ? `（${item.scene_title}）` : ""}
        </p>
        {item.summary ? (
          <p className={styles.summary}>{item.summary}</p>
        ) : null}
        <Link href={href}>
          <a className={styles.cta}>このシーンを絵巻で観る →</a>
        </Link>
      </div>
    </article>
  );
};

export default FolkloreCard;
