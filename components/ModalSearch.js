import React ,{useContext,useState}from 'react'
import { AppContext } from "../pages/_app";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClose,
  faMagnifyingGlass
} from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/Search.css.module.css";
import CardA from './CardA';
import ExtractingListData from "../libs/ExtractingListData";
import { useRouter } from "next/router";
import {eraColor, eraItem,typeItem } from "../libs/func";


const ModalSearch = () => {
  const { openSearchModalOpen, isSearchModalOpen, closeSearchModal } =
    useContext(AppContext);
  const { locale } = useRouter();
  const removeNestedArrayObj = ExtractingListData();
  const data = removeNestedArrayObj;

  const [searchKeyword, setSearchKeyword] = useState("");
  const [showData, setShowData] = useState(data);

  const handleInput = (e) => {
    setSearchKeyword(e.currentTarget.value);
    setShowData(filteredData);
  };

  const regx = new RegExp(searchKeyword);

  const filteredData = data.filter((item) => {
    const title = item.title + item.edition + item.titleen;
    const data = regx.test(title);
    return data;
  });


  const types = typeItem(data).sort((a,b) =>(a.total > b.total ? -1 :1));
  console.log(types);
  // const filterdTypes = typeItem(showData);

  const eras = eraItem(data).sort((a, b) => (a.total > b.total ? -1 : 1));
  console.log(eras);
  

  const selectTypes = (e) => {
    const el = e.target.value;
    console.log(e.target.value);
    if (el === "全ての作品") {
      setShowData(data);
      return;
    }
    const selectTypeItems = data.filter((item) => item.type === el);
    setShowData(selectTypeItems);
  };

  return (
    <div className={styles.modal}>
      <div className={styles.MuiBackdrop} onClick={closeSearchModal}></div>
      <div className={styles.container}>
        <div className={`${styles.closebtn} btn`} onClick={closeSearchModal}>
          <FontAwesomeIcon icon={faClose} />
        </div>
        {/* <select onChange={(e) => selectTypes(e)} className={styles.typeselect}>
          <option value={"作品のタイプ"}>作品のタイプ</option>
          {types.map((type, i) => (
            <option key={i} value={type}>
              {type}
            </option>
          ))}
        </select> */}
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
              {/* {type.type}（{type.total}） */}
              {item.type}
            </button>
          ))}
        </div>
        <div className={styles.eraselect}>
          <button
            value={"全ての時代"}
            className={styles.eraselectbtn}
            onClick={(e) => selectTypes(e)}
          >
            全ての作品
          </button>
          {eras.map((item, i) => (
            <button
              key={i}
              value={item.era}
              onClick={(e) => selectTypes(e)}
              className={styles.eraselectbtn}
              style={{
                backgroundColor: eraColor(item.era),
              }}
            >
              {/* {type.type}（{type.total}） */}
              {item.era}
            </button>
          ))}
        </div>
        <form className={styles.form}>
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
          {/* {filteredData.length === 0 && <p>作品はありません</p>}
             {filteredData.length === 0 ? <p>作品はありません</p> : (
              <CardA emakis={showData} columns={"searchbox"} />
        )} */}
          <CardA emakis={showData} columns={"searchbox"} />
        </div>
      </div>
    </div>
  );
}

export default ModalSearch