import React from "react";
import styled from "../styles/EmakiNavigation.module.css";
import {
  faAnglesLeft,
  faAnglesRight,
  faChevronLeft,
  faChevronRight,
  faHouse,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { ArrowRight, ChevronRight } from "react-feather";
import Link from "next/link";
import { useRouter } from "next/router";
import ToggleEkotoba from "./ToggleEkotoba";

const EmakiNavigation = ({
  handleCurselNext,
  handleCurselPrev,
  endIndex,
  handleToId,
  data,
}) => {
  const router = useRouter();

  return (
    <aside className={styled.container}>
      <button onClick={() => handleToId(endIndex)} className={styled.button}>
        <i>
          <FontAwesomeIcon icon={faAnglesLeft} />
        </i>
      </button>
      <button onClick={() => handleCurselNext()} className={styled.button}>
        <i>
          <FontAwesomeIcon icon={faChevronLeft} />
        </i>
      </button>
      <button
        onClick={() => router.push("/")}
        className={styled.button}
        title={"次に進む"}
      >
        <i>
          <FontAwesomeIcon icon={faHouse} />
        </i>
      </button>
      <ToggleEkotoba data={data} />
      <button onClick={() => handleCurselPrev()} className={styled.button}>
        <i>
          <FontAwesomeIcon icon={faChevronRight} />
        </i>
      </button>
      <button onClick={() => handleToId(0)} className={styled.button}>
        <i>
          <FontAwesomeIcon icon={faAnglesRight} />
        </i>
      </button>
    </aside>
  );
};

export default EmakiNavigation;
