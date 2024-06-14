import React, { useContext, useState } from "react";
import Head from "../components/Meta";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CardA from "../components/CardA";
import ExtractingListData from "../libs/ExtractingListData";
import { useRouter } from "next/router";
import styles from "../styles/Search.css.module.css";

const Search = () => {
  const { locale } = useRouter();
  const removeNestedArrayObj = ExtractingListData();
  const data = removeNestedArrayObj;

  const [searchKeyword, setSearchKeyword] = useState("");
  const [showData, setShowData] = useState(data);
  console.log(showData);

  const regx = new RegExp(searchKeyword);

  const filteredData = data.filter((item) => {
    const title = item.title + item.edition + item.titleen;
    const data = regx.test(title);
    return data;
  });

  const handleInput = (e) => {
    setSearchKeyword(e.currentTarget.value);
    setShowData(filteredData);
  };

  const types = Array.from(new Set(data.map((item) => item.type)));
  console.log(types);

  const selectTypes = (e) => {
    const el = e.target.value;
    console.log(e.target.value);
    if (el === "all") {
      setShowData(data);
      return;
    }
    const selectTypeItems = data.filter((item) => item.type === el);
    setShowData(selectTypeItems);
  };
  
  return (
    <>
      <Head />
      <Header />
      <section
        className={`section-grid section-padding `}
        style={{ paddingBottom: "0" }}
      >
        <div className={styles.searchbox}>
          {/* タイプ選択ドロップダウンメニュー */}
          <h4>Types</h4>
          <select
            onChange={(e) => selectTypes(e)}
            className={styles.typeselect}
          >
            <option value={"all"}>All</option>
            {types.map((type, i) => (
              <option key={i} value={type}>
                {type}
              </option>
            ))}
          </select>
          {/* キーワード検索 */}

          <label htmlFor="search-keyword">Search</label>
          <form>
            <input
              id="search-keyword"
              type="text"
              onInput={handleInput}
              placeholder={"Input search keyword"}
            />
          </form>
        </div>
      </section>
      <CardA emakis={showData} columns={"four"} />
      <Footer />
    </>
  );
};

export default Search;
