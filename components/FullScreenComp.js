import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownLeftAndUpRightToCenter,
  faUpRightAndDownLeftFromCenter,
} from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/FullScreenComp.module.css";

export default function FullScreenComp({ children, iconStyle, padding }) {
  const handle = useFullScreenHandle();
  return (
    <>
      <div className={styles.fullscreen} style={{ margin: padding }}>
        <button
          onClick={handle.enter}
          className={styles.openIcon}
          style={
            iconStyle
              ? { "--left": "1rem", "--rotate": "90deg" }
              : { "--right": "1rem" }
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
                iconStyle
                  ? { "--left": "1rem", "--rotate": "90deg" }
                  : { "--right": "1rem" }
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
