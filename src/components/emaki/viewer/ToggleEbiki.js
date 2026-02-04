import ActionButton from "@/components/emaki/viewer/ActionButton";
import { AppContext } from "@/pages/_app";
import { faBook, faBookOpen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext } from "react";
import { useTranslation } from "next-i18next";

const ToggleEbiki = ({ isUIVisible = true }) => {
  const { handleEbikiToggle, ebikiToggle } = useContext(AppContext);
  const { t } = useTranslation("common");

  const description = ebikiToggle
    ? t("viewer.hidePictureIndex")
    : t("viewer.showPictureIndex");

  return (
    <ActionButton
      icon={
        ebikiToggle ? (
          <FontAwesomeIcon icon={faBook} style={{ fontSize: "1.5em" }} />
        ) : (
          <FontAwesomeIcon icon={faBookOpen} style={{ fontSize: "1.5em" }} />
        )
      }
      label={description}
      description={description}
      onClick={handleEbikiToggle}
      isUIVisible={isUIVisible}
    />
  );
};

export default ToggleEbiki;
