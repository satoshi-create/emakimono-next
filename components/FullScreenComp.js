import React from "react";
import { useRouter } from "next/router";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownLeftAndUpRightToCenter,
  faUpRightAndDownLeftFromCenter,
} from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/FullScreenComp.module.css";
import Link from "next/link";

// TODO:CREATE - 「流れる絵巻」をフルスクリーンにすると横向きになる機能を実装する or ライブラリを使わない方式に切り替える

// https://stackoverflow.com/questions/34034038/how-to-render-react-components-by-using-map-and-join
// const Demo = ({ data }) => (
//   <div>
//     {data.flatMap((t, i) => [...(i ? [", "] : []), <span key={i}>{t}</span>])}
//   </div>
// );

export default function FullScreenComp({
  children,
  index,
  genjieslug,
  edition,
  editionen,
  title,
  titleen,
}) {
  const handle = useFullScreenHandle();
  const { locale } = useRouter();

  const localeTitle =
    locale === "en"
      ? `${titleen}`
      : `${title} ${edition && edition}`;

  return (
    <>
      <div
        className={`${styles.fullscreen} ${
          index % 2 ? styles.left : styles.right
        }`}
      >
        {genjieslug && (
          <div className={`${styles.genjieslugBox}`}>
            {genjieslug.flatMap((item, i) => [
              ...(i ? ["　　"] : []),
              <h4 className={`${styles.genjieslugTitle}`} key={i}>
                <Link href={`/genjie/${item.path}`}>
                  <a>
                    <ruby>
                      {item.title} <rp>(</rp>
                      <rt className={styles.rt}>{item.ruby}</rt>
                      <rp>)</rp>
                    </ruby>
                  </a>
                </Link>
              </h4>,
            ])}
          </div>
        )}
        {!genjieslug && (
          <div className={`${styles.genjieslugBox}`}>
            <h4 className={`${styles.genjieslugTitle}`}>
              <Link href={`/${titleen}`}>
                <a>{localeTitle}</a>
              </Link>
            </h4>
          </div>
        )}
        {/* <div className={`${styles.genjieslugBox}`}>
          {genjieslug.map((item, i) => {
            return (
              <h4 className={`${styles.genjieslugTitle}`} key={i}>
                <Link href={`/genjie/${item.path}`}>
                  <a>
                    <ruby>
                      {item.title} <rp>(</rp>
                      <rt className={styles.rt}>{item.ruby}</rt>
                      <rp>)</rp>
                    </ruby>
                  </a>
                </Link>
              </h4>
            );
          })}
        </div> */}
        <button
          onClick={handle.enter}
          className={styles.openIcon}
          style={
            index % 2
              ? { "--right": "1rem", "--rotate": "90deg" }
              : { "--left": "0" }
          }
        >
          <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} />
          <i className="fa fa-expand"></i>
        </button>
        <FullScreen handle={handle}>
          {handle.active && (
            <button
              onClick={handle.exit}
              className={styles.closeIcon}
              style={
                index % 2
                  ? { "--right": "1rem", "--rotate": "90deg" }
                  : { "--left": "0" }
              }
            >
              <FontAwesomeIcon icon={faDownLeftAndUpRightToCenter} />
            </button>
          )}
          {children}
        </FullScreen>
      </div>
    </>
  );
}
