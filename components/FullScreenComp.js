import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownLeftAndUpRightToCenter,
  faUpRightAndDownLeftFromCenter,
} from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/FullScreenComp.module.css";
import Link from "next/link";

// TODO:CREATE - 「流れる絵巻」をフルスクリーンにすると横向きになる機能を実装する or ライブラリを使わない方式に切り替える

export default function FullScreenComp({ children, index, genjieslug }) {
  const handle = useFullScreenHandle();
  console.log(genjieslug);
  return (
    <>
      <div
        className={`${styles.fullscreen} ${
          index % 2 ? styles.left : styles.right
        }`}
      >
        <div className={`${styles.genjieslugBox}`}>
          {genjieslug.map((item, i) => {
            return (
              <h4 className={`${styles.genjieslugTitle}`} key={i}>
                <Link href={`/genjie/${item.path}`}>
                  <a>{item.title}</a>
                </Link>
              </h4>
            );
          })}
        </div>
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
                  ? { "--left": "1rem", "--rotate": "90deg" }
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
