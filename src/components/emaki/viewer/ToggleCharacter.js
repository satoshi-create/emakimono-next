import ActionButton from "@/components/emaki/viewer/ActionButton";
import { AppContext } from "@/pages/_app";
import { faUser, faUserSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext } from "react";
import { useTranslation } from "next-i18next";

const ToggleCharacter = ({ isUIVisible = true }) => {
  const { handleCharacterToggle, characterToggle } = useContext(AppContext);
  const { t } = useTranslation("common");

  const description = characterToggle
    ? t("viewer.hideCharacterNames")
    : t("viewer.showCharacterNames");

  return (
    <ActionButton
      icon={
        characterToggle ? (
          <FontAwesomeIcon icon={faUserSlash} style={{ fontSize: "1.5em" }} />
        ) : (
          <FontAwesomeIcon icon={faUser} style={{ fontSize: "1.5em" }} />
        )
      }
      label={description}
      description={description}
      onClick={handleCharacterToggle}
      isUIVisible={isUIVisible}
    />
  );
};

export default ToggleCharacter;
