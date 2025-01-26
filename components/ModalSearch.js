import React, { useContext, useState, useEffect, useReducer } from "react";
import { AppContext } from "../pages/_app";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/Search.css.module.css";
import CardForSearchResults from "./CardForSearchResults";
import ExtractingListData from "../libs/ExtractingListData";
import { useRouter } from "next/router";
import { eraColor, eraItem, typeItem } from "../libs/func";
import styled from "styled-components";

const Button = styled.button`
  &:focus {
    background: ${(props) => eraColor(props.item)};
  }
`;

// Reducer関数
const reducer = (state, action) => {
  switch (action.type) {
    case "SET_FILTERED_DATA":
      return {
        ...state,
        showData: action.payload,
      };
    case "RESET_DATA":
      return {
        ...state,
        showData: state.data,
      };
    default:
      return state;
  }
};

const ModalSearch = () => {
  const { closeSearchModal } = useContext(AppContext);
  const { locale } = useRouter();
  const initialData = ExtractingListData();

  // useReducerで状態を管理
  const [state, dispatch] = useReducer(reducer, {
    data: initialData, // 元データ
    showData: initialData, // 表示するデータ
  });

  const [searchKeyword, setSearchKeyword] = useState("");

  const handleInput = (e) => {
    const keyword = e.currentTarget.value;
    setSearchKeyword(keyword);


  if (keyword.trim() === "") {
    // 入力が空の場合、すべてのデータを表示
    dispatch({ type: "RESET_DATA" });
    return;
  }

    const regx = new RegExp(searchKeyword);

    const filteredData = state.data.filter((item) => {
      const title = item.title + item.edition + item.titleen;
      const data = regx.test(title);
      return data;
    });
    // フィルタリング結果をdispatchで更新
    dispatch({ type: "SET_FILTERED_DATA", payload: filteredData });
  };

  const types = typeItem(state.data).sort((a, b) =>
    a.total > b.total ? -1 : 1
  );

  const eras = ["平安", "鎌倉", "室町", "安土・桃山", "江戸", "明治"];

  const selectTypes = (e) => {
    const el = e.target.value;
    console.log(e.target.value);
    if (el === "全ての作品") {
      dispatch({ type: "RESET_DATA" });
      setShowData(data);
      return;
    }
    const selectTypeItems = state.data.filter((item) => item.type === el);
    dispatch({ type: "SET_FILTERED_DATA", payload: selectTypeItems });
  };

  const selectEras = (e) => {
    const el = e.target.value;
    if (el === "全ての時代") {
      dispatch({ type: "RESET_DATA" });
      setShowData(data);
      return;
    }
    const selectEraItems = state.data.filter((item) => item.era === el);
    dispatch({ type: "SET_FILTERED_DATA", payload: selectEraItems });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchKeyword === "") {
      return;
    }
  };

  return (
    <div className={`${styles.modal}`}>
      <div className={styles.MuiBackdrop} onClick={closeSearchModal}></div>
      <div className={styles.container}>
        <div className={`${styles.closebtn} btn`} onClick={closeSearchModal}>
          <FontAwesomeIcon icon={faClose} />
        </div>
        <div className={styles.typeselect}>
          <button
            value={"全ての作品"}
            className={styles.typeselectbtn}
            onClick={(e) => selectTypes(e)}
          >
            全ての作品
          </button>
          {types.map((item, i) => (
            <button
              key={i}
              value={item.type}
              onClick={(e) => selectTypes(e)}
              className={styles.typeselectbtn}
            >
              {item.type}
            </button>
          ))}
        </div>
        <div className={styles.eraselect}>
          <button
            value={"全ての時代"}
            className={styles.eraselectbtn}
            onClick={(e) => selectEras(e)}
          >
            全ての作品
          </button>
          {eras.map((item, i) => (
            <Button
              item={item}
              key={i}
              value={item}
              onClick={(e) => selectEras(e)}
              className={styles.eraselectbtn}
            >
              {item}
            </Button>
          ))}
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className={styles.faMagnifyingGlassIcon}
          />
          <input
            id="search-keyword"
            type="text"
            onInput={handleInput}
            placeholder={"絵巻とその他のワイド美術を検索"}
          />
        </form>
        <div className={`${styles.contents} scrollbar`}>
          {state.showData.length > 0 ? (
            <CardForSearchResults emakis={state.showData} />
          ) : "data is null"}
        </div>
      </div>
    </div>
  );
};

export default ModalSearch;
