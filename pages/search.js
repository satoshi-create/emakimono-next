import React,{useContext} from "react";
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

  const filteredData = data.filter((item) => {
    return new RegExp(searchKeyword).test(item.title);
  });

  console.log(filteredData);

  //himenon.github.io/docs/javascript/simple-react-local-search-form/
  // ["a", "b", "c"].filter((text) => {
  //   return new RegExp(searchKeyword).test(text); // 入力キーワードを正規表現にする
  // });

  // RegExp.prototype.test();

return (
    <>
      <Head />
      <Header />
      <SearchForm/>

      <CardA
        emakis={filteredData}
        columns={"four"}
        // sectionname={"recommend"}
        // sectiontitle={locale === "en" ? `List of ${nameen}` : `${name}一覧`}
        // sectiontitleen={locale === "en" ? `${name}一覧` : `List of ${nameen}`}
      />
      <Footer />
    </>
  );
};

export default Search;
