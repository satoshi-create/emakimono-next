import React ,{useContext,useState}from 'react'
import { AppContext } from "../pages/_app";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClose,
} from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/Search.css.module.css";
import CardA from './CardA';
import ExtractingListData from "../libs/ExtractingListData";
import { useRouter } from "next/router";



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

    const types = Array.from(new Set(data.map((item) => item.type)));
    console.log(types);

    const selectTypes = (e) => {
      const el = e.target.value;
      console.log(e.target.value);
      if (el === "作品のタイプ") {
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
        <div className={styles.tabcontainer}>
          {/* <h4>Types</h4> */}
          <select
            onChange={(e) => selectTypes(e)}
            className={styles.typeselect}
          >
            <option value={"作品のタイプ"}>作品のタイプ</option>
            {types.map((type, i) => (
              <option key={i} value={type}>
                {type}
              </option>
            ))}
          </select>
          {/* <label htmlFor="search-keyword">Search</label> */}
          <form>
            <input
              id="search-keyword"
              type="text"
              onInput={handleInput}
              placeholder={"検索"}
            />
          </form>
        </div>
        <div className={`${styles.contents} scrollbar`}>
          <CardA emakis={showData} columns={"searchbox"} />
        </div>
      </div>
    </div>
  );
}

export default ModalSearch