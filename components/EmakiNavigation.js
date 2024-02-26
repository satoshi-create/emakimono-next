import React from "react";
import styled from "../styles/EmakiNavigation.module.css";
import {
  faAnglesLeft,
  faAnglesRight,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const EmakiNavigation = ({
  handleCurselNext,
  handleCurselPrev,
  endIndex,
  handleToId,
}) => {
  return (
    <aside className={styled.container}>
      <button onClick={() => handleToId(endIndex)}>
        <FontAwesomeIcon icon={faAnglesLeft} />
      </button>
      <button onClick={() => handleCurselNext()}>
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>
      <button onClick={() => handleCurselPrev()}>
        <FontAwesomeIcon icon={faChevronRight} />
      </button>
      <button onClick={() => handleToId(0)}>
        <FontAwesomeIcon icon={faAnglesRight} />
      </button>
    </aside>
  );
};

export default EmakiNavigation;
