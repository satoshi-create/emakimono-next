import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExpand,
  faUpRightAndDownLeftFromCenter,
} from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/FullScreenComp.module.css";

export default function FullScreenComp({ children, right, left, padding }) {
  const handle = useFullScreenHandle();
  return (
    <div className={styles.fullscreen} style={{ margin: padding }}>
      <button
        onClick={handle.enter}
        className={styles.openIcon}
        style={{ "--right": right, "--left": left }}
      >
        <FontAwesomeIcon icon={faExpand} />
        <i className="fa fa-expand"></i>
      </button>

      <FullScreen handle={handle}>
        {handle.active && (
          <button
            onClick={handle.exit}
            className={styles.closeIcon}
            style={{ "--right": right, "--left": left }}
          >
            <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} />
          </button>
        )}
        {children}
      </FullScreen>
    </div>
  );
}
