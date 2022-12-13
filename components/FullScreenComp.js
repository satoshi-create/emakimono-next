import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsAlt,
  faExpandArrowsAlt,
} from "@fortawesome/free-solid-svg-icons";

export default function FullScreenComp({ children }) {
  const handle = useFullScreenHandle();

  return (
    <div className="App">
      <button onClick={handle.enter} className="openIcon">
        <FontAwesomeIcon icon={faExpandArrowsAlt} />
        <i className="fa fa-expand"></i>
      </button>

      <FullScreen handle={handle}>
        {handle.active && (
          <button onClick={handle.exit} className="closeIcon">
            <FontAwesomeIcon icon={faArrowsAlt} />
          </button>
        )}
        {children}
      </FullScreen>
    </div>
  );
}
