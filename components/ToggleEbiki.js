import { AppContext } from "@/pages/_app";
import { faBook, faBookOpen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext } from "react";
import ActionButton from "./ActionButton";

const ToggleEbiki = () => {
  const { handleEbikiToggle, ebikiToggle } = useContext(AppContext);

  return (
    <ActionButton
      icon={
        ebikiToggle ? (
          <FontAwesomeIcon icon={faBook} style={{ fontSize: "1.5em" }} />
        ) : (
          <FontAwesomeIcon icon={faBookOpen} style={{ fontSize: "1.5em" }} />
        )
      }
      label={ebikiToggle ? "絵引きを閉じる" : "絵引きを見る"}
      description={ebikiToggle ? "絵引きを閉じる" : "絵引きを見る"}
      onClick={handleEbikiToggle}
    />
  );
};

export default ToggleEbiki;
