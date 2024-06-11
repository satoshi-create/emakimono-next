import React, { useContext,useState } from "react";
import Head from "../components/Meta";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CardA from "../components/CardA";
import ExtractingListData from "../libs/ExtractingListData";
import { useRouter } from "next/router";
import SearchForm from "../components/SearchForm";
import { AppContext } from "../pages/_app";

const Search = () => {
  const { searchKeyword } = useContext(AppContext);
  const { locale } = useRouter();
  const removeNestedArrayObj = ExtractingListData();
  const data = removeNestedArrayObj;


  // console.log(data);

  // const searchKeyword = "人"
  // const filteredData = data.filter(item => item.titleen === searchkeywod)
  // console.log(filteredData);

  const categories = Array.from(new Set(data.map((item) => item.type)));
  console.log(categories);
  
  const selectCategory = (category) => {
    return filter((item) => item.category === category);
  }

  const regx = new RegExp(searchKeyword);

  const filteredData = showData.filter((item) => {
    const title = item.title + item.edition + item.titleen;
    const data = regx.test(title);
    setShowdData(data)
  });

  //himenon.github.io/docs/javascript/simple-react-local-search-form/
  // ["a", "b", "c"].filter((text) => {
  //   return new RegExp(searchKeyword).test(text); // 入力キーワードを正規表現にする
  // });

  // RegExp.prototype.test();

  return (
    <>
      <Head />
      <Header />
      <SearchForm />
      {categories.map((category, i) => (
        <div key={i}>
          <button onClick={() => selectCategory(category)}>{category}</button>
        </div>
      ))}
      <p>検索結果：{showData.length}件</p>
      {showData.length > 0 && (
        <CardA
          emakis={showData}
          columns={"four"}
          // sectionname={"recommend"}
          // sectiontitle={locale === "en" ? `List of ${nameen}` : `${name}一覧`}
          // sectiontitleen={locale === "en" ? `${name}一覧` : `List of ${nameen}`}
        />
      )}

      <Footer />
    </>
  );
};

export default Search;
