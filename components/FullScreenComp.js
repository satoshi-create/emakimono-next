import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { useFullScreenHandle } from "react-full-screen";
import styles from "../styles/FullScreenComp.module.css";

export default function FullScreenComp({
  children,
  index,
  genjieslug,
  edition,
  title,
  titleen,
}) {
  const handle = useFullScreenHandle();
  const { locale } = useRouter();

  const localeTitle =
    locale === "en" ? `${titleen}` : `${title} ${edition ? edition : ""}`;

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
            <Link href={`/${titleen}`}>
              <a>
                <h4 className={`${styles.genjieslugTitle}`}>{localeTitle}</h4>
              </a>
            </Link>
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
        {/* <button
          onClick={handle.enter}
          className={styles.openIcon}
        >
          <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} />
          <i className="fa fa-expand"></i>
        </button>
        <FullScreen handle={handle}>
          {handle.active && (
            <button
              onClick={handle.exit}
              className={styles.closeIcon}
            >
              <FontAwesomeIcon icon={faDownLeftAndUpRightToCenter} />
            </button>
          )} */}
        {children}
        {/* </FullScreen> */}
      </div>
    </>
  );
}
