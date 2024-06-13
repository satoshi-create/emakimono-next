import React ,{useContext}from 'react'
import { AppContext } from "../pages/_app";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClose,
} from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/Search.css.module.css";
import CardA from './CardA';
import ExtractingListData from "../libs/ExtractingListData";
import { useRouter } from "next/router";
import CardC from './CardC';

const ModalSearch = () => {
    const { locale } = useRouter();
    const removeNestedArrayObj = ExtractingListData();
  const data = removeNestedArrayObj;
  
   const { openSearchModalOpen, isSearchModalOpen, closeSearchModal } =
     useContext(AppContext);
  return (
    <div className={styles.modal}>
      <div className={styles.MuiBackdrop} onClick={closeSearchModal}></div>
      <div className={styles.container}>
        <div className={`${styles.closebtn} btn`} onClick={closeSearchModal}>
          <FontAwesomeIcon icon={faClose} />
        </div>
        {/* <div className={styles.tabcontainer}>作品を検索する</div> */}
        <div className={`${styles.contents} scrollbar`}>
          <CardA emakis={data} columns={"searchbox"} />
        </div>
      </div>
    </div>
  );
}

export default ModalSearch