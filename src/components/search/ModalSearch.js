import CardForSearchResults from "@/components/search/CardForSearchResults";
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/Search.css.module.css";
import ExtractingListData from "@/utils/ExtractingListData";
import { authorItem, eraColor, typeItem } from "@/utils/func";
import { faClose, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { useContext, useReducer, useRef, useState } from "react";
import styled from "styled-components";
import { toRomaji } from "wanakana";

const Button = styled.button`
  &:focus {
    background: ${(props) => eraColor(props.item)};
  }
`;
// 1回のロードで追加する件数
const ITEMS_PER_PAGE = 10;

// Reducer関数（データの更新を管理）
const reducer = (state, action) => {
  switch (action.type) {
    case "SET_FILTERED_DATA": // 検索結果をセット
      return {
        ...state,
        showData: action.payload,
        page: 1,
      };
    case "RESET_DATA": // データをリセット（初期状態に戻す）
      return {
        ...state,
        showData: state.data.slice(0, ITEMS_PER_PAGE),
        page: 1,
      };
    default:
      return state;
  }
};

const ModalSearch = () => {
  const { closeSearchModal } = useContext(AppContext);
  const { locale } = useRouter();
  const initialData = ExtractingListData(); // 初期データを取得

  // useReducerで状態を管理
  const [state, dispatch] = useReducer(reducer, {
    data: initialData, // 元データ
    showData: initialData.slice(0, ITEMS_PER_PAGE), // 最初の10件のみ表示
    page: 1, // 現在のページ（ロードした回数）
  });

  const [searchKeyword, setSearchKeyword] = useState(""); // 検索キーワード
  const [displayKeyword, setDisplayKeyword] = useState(""); // results for に表示する用
  const [isComposing, setIsComposing] = useState(false); // 日本語入力中かどうか
  const observerTarget = useRef(); // スクロール監視対象の要素

  const filterData = (keyword, updateDisplay = true) => {
    if (keyword.trim() === "") {
      // 入力が空の場合、すべてのデータを表示
      dispatch({ type: "RESET_DATA" });
      return;
    }

    // 入力文字列をローマ字に変換
    const romajiKeyword = toRomaji(keyword);

    // 大文字・小文字を区別しない正規表現
    const regx = new RegExp(romajiKeyword, "i");
    const filteredData = state.data.filter((item) => {
      // データ内のタイトルをローマ字に変換
      const title = toRomaji(
        item.title + item.edition + item.titleen + item.author + item.authoren
      );

      // ローマ字またはそのままの文字列で一致するかを確認
      return regx.test(title);
    });

    // 検索結果を更新（最初の10件のみ表示）
    dispatch({
      type: "SET_FILTERED_DATA",
      payload: filteredData.slice(0, ITEMS_PER_PAGE),
    });
    if (updateDisplay) {
      setDisplayKeyword(keyword); // 手動入力時のみ更新
    }
  };

  const handleInput = (e) => {
    const keyword = e.currentTarget.value;
    setSearchKeyword(keyword);
    // 日本語入力中でもリアルタイムフィルタリングを実行
    filterData(keyword, true);
  };

  const handleCompositionStart = () => {
    setIsComposing(true); // 日本語入力開始
  };

  const handleCompositionEnd = (e) => {
    setIsComposing(false); // 日本語入力終了
    // 入力が確定した時点でフィルタリングをもう一度実行
    filterData(e.currentTarget.value);
  };

  /**
   * IntersectionObserver を使用してスクロールを監視
   * 一番下の要素が表示されたら新しいデータをロード
   */
  // useEffect(() => {
  //   const observer = new IntersectionObserver(
  //     (entries) => {
  //       const target = entries[0];
  //       // console.log("🟢 Observer triggered!", target.isIntersecting); // デバッグ用
  //       if (target.isIntersecting) {
  //         // console.log("🔵 Loading more items...");
  //         loadMoreItems(); // 追加データを読み込む
  //       }
  //     },
  //     { threshold: 0.1 } // 100%表示されたら実行
  //   );

  //   if (observerTarget.current) {
  //     observer.observe(observerTarget.current);
  //     // console.log("✅ Observer is set on target");
  //   } else {
  //     console.error("❌ observerTarget is null");
  //   }

  //   return () => {
  //     if (observerTarget.current) observer.unobserve(observerTarget.current);
  //   };
  // }, [state.showData, loadMoreItems]); // showData が更新されたら監視をセットし直す

  /**
   * 無限スクロールで追加データを読み込む
   */
  // const loadMoreItems = useCallback(() => {
  //   const start = state.page * ITEMS_PER_PAGE; // 次のデータの開始位置
  //   const end = start + ITEMS_PER_PAGE; // 次のデータの終了位置
  //   const newItems = state.data.slice(start, end); // 次の10件を取得

  //   if (newItems.length > 0) {
  //     dispatch({
  //       type: "SET_FILTERED_DATA",
  //       payload: [...state.showData, ...newItems],
  //     });
  //     state.page++; // ページを1つ増やす
  //   }
  // }, [state.page, state.data, state.showData, dispatch]);

  const types = typeItem(state.data).sort((a, b) =>
    a.total > b.total ? -1 : 1
  );

  const authors = authorItem(state.data).sort((a, b) =>
    a.total > b.total ? -1 : 1
  );

  const eras = [
    { era: "平安", eraen: "heiann" },
    { era: "鎌倉", eraen: "kamakura" },
    { era: "室町", eraen: "muromachi" },
    // { era: "安土・桃山", eraen: "aduchimomoyama" },
    // { era: "江戸", eraen: "edo" },
    // { era: "明治", eraen: "meiji" },
  ];

  const selectAll = (e) => {
    dispatch({ type: "RESET_DATA" });
    setSearchKeyword("");
    return;
  };

  const selectTypes = (e) => {
    const el = e.target.value;
    const selectTypeItems =
      locale === "en"
        ? state.data.filter((item) => item.typeen === el)
        : state.data.filter((item) => item.type === el);
    dispatch({ type: "SET_FILTERED_DATA", payload: selectTypeItems });
    setSearchKeyword(""); // 🔹 検索ボックスは空のまま
    setDisplayKeyword(el); // 🔹 "results for" にのみ表示
  };

  const selectEras = (e) => {
    const el = e.target.value;
    const selectEraItems =
      locale === "en"
        ? state.data.filter((item) => item.eraen === el)
        : state.data.filter((item) => item.era === el);

    dispatch({ type: "SET_FILTERED_DATA", payload: selectEraItems });
    setSearchKeyword(""); // 🔹 検索ボックスは空のまま
    setDisplayKeyword(el); // 🔹 "results for" にのみ表示
  };

  const selectAuthor = (e) => {
    const el = e.target.value;
    const selectAuthorItems =
      locale === "en"
        ? state.data.filter((item) => item.authoren === el)
        : state.data.filter((item) => item.author === el);

    dispatch({ type: "SET_FILTERED_DATA", payload: selectAuthorItems });
    setSearchKeyword(""); // 🔹 検索ボックスは空のまま
    setDisplayKeyword(el); // 🔹 "results for" にのみ表示
  };

  const handleReset = () => {
    setSearchKeyword(""); // 🔹 検索ボックスを空にする
    setDisplayKeyword(""); // 🔹 "results for" もクリア
    dispatch({ type: "RESET_DATA" }); // 🔹 検索結果を初期状態に戻す
  };

  return (
    <div className={`${styles.modal}`}>
      <div className={styles.MuiBackdrop} onClick={closeSearchModal}></div>
      <div className={styles.container}>
        <div className={`${styles.closebtn} btn`} onClick={closeSearchModal}>
          <FontAwesomeIcon icon={faClose} />
        </div>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className={styles.faMagnifyingGlassIcon}
          />
          <input
            id="search-keyword"
            type="text"
            value={searchKeyword}
            onChange={handleInput} // 入力時のイベント
            onCompositionStart={handleCompositionStart} // 日本語入力開始時
            onCompositionEnd={handleCompositionEnd} // 日本語入力確定時
            placeholder={
              locale == "en" ? "Search Emaki Gallary" : "絵巻を検索する"
            }
          />
          {/* 🔹 リセットボタンを追加 */}
          {searchKeyword && (
            <button
              type="button"
              className={styles.resetButton}
              onClick={handleReset}
            >
              ✖
            </button>
          )}
        </form>
        <div className={styles.underline}></div>
        <div className={`${styles.selectbtn} scrollbar`}>
          <button
            value={"全ての作品"}
            className={styles.typeselectbtn}
            onClick={(e) => selectAll(e)}
          >
            {locale == "en" ? "View All Contents" : "全ての作品"}
          </button>
          <div className={styles.typeselect}>
            <h4>{locale == "en" ? "View by Genre" : "タイプから見る"}</h4>
            <div className={styles.selectbtnbox}>
              {types.map((item, i) => (
                <button
                  key={i}
                  value={locale == "en" ? item.typeen : item.type}
                  onClick={(e) => selectTypes(e)}
                  className={styles.typeselectbtn}
                >
                  {locale == "en" ? item.typeen : item.type}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.eraselect}>
            <h4>{locale == "en" ? "View by Date" : "制作年から見る"}</h4>
            <div className={styles.selectbtnbox}>
              {eras.map((item, i) => (
                <Button
                  item={locale == "en" ? item.eraen : item.era}
                  key={i}
                  value={locale == "en" ? item.eraen : item.era}
                  onClick={(e) => selectEras(e)}
                  className={styles.eraselectbtn}
                >
                  {locale == "en" ? item.eraen : item.era}
                </Button>
              ))}
            </div>
          </div>
          <div className={styles.authorselect}>
            <h4>{locale == "en" ? "View by Artist" : "絵師から見る"}</h4>
            <div className={styles.selectbtnbox}>
              {authors.map((item, i) => (
                <button
                  key={i}
                  value={locale == "en" ? item.authoren : item.author}
                  onClick={(e) => selectAuthor(e)}
                  className={styles.typeselectbtn}
                >
                  {locale == "en" ? item.authoren : item.author}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className={`${styles.contents} scrollbar`}>
          <p className={styles.resultsmsg}>
            Results for <span>&quot;{displayKeyword}&quot;</span>
          </p>
          {state.showData.length > 0 ? (
            <>
              <CardForSearchResults emakis={state.showData} />
              <div ref={observerTarget} style={{ height: "100px" }}></div>
            </>
          ) : (
            <p className={styles.noresultsmsg}>
              No results for <span>&quot;{searchKeyword}&quot;</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalSearch;
