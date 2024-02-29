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

// TODO: 「先頭に戻る」を押しても反応がない
const EmakiNavigation = ({
  handleToId,
  data,
  scrollNextRef,
  scrollPrevRef,
}) => {
  const router = useRouter();
  const endIndex = data.emakis.length - 1;
  console.log(data.type);

  return (
    <aside className={styled.container}>
      <button
        onClick={() => handleToId(data.type === "西洋絵画" ? 0 : endIndex)}
        className={styled.button}
      >
        <i>
          <FontAwesomeIcon icon={faAnglesLeft} />
        </i>
      </button>
      <button ref={scrollNextRef} className={styled.button}>
        <i>
          <FontAwesomeIcon icon={faChevronLeft} />
        </i>
      </button>
      <button onClick={() => router.push("/")} className={styled.button}>
        <i>
          <FontAwesomeIcon icon={faHouse} />
        </i>
      </button>
      <ToggleEkotoba data={data} />
      <button ref={scrollPrevRef} className={styled.button}>
        <i>
          <FontAwesomeIcon icon={faChevronRight} />
        </i>
      </button>
      <button
        onClick={() => handleToId(data.type === "西洋絵画" ? endIndex : 0)}
        className={styled.button}
      >
        <i>
          <FontAwesomeIcon icon={faAnglesRight} />
        </i>
      </button>
    </aside>
  );
};

export default EmakiNavigation;
