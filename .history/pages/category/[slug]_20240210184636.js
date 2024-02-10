import React, { useState, useEffect, useRef } from "react";
import allCats from "../../libs/category";
import emakisData from "../../libs/data";
import Header from "../../components/Header";
import Head from "../../components/Meta";
import CardA from "../../components/CardA";
import Breadcrumbs from "../../components/Breadcrumbs";
import { useRouter } from "next/router";
import { useLocaleData } from "../../libs/func";
import Footer from "../../components/Footer";
import enData from "../../libs/en/data"
import jaData from "../../libs/data"

TODO:category/emaki→emaki page
const Emaki = ({ name, nameen, posts, slug }) => {
  const { locale } = useRouter();

  const tPageDesc =
    locale === "en"
      ? `This is the ${nameen} list page.This site pursues the enjoyment of picture scrolls by scrolling from right to left!`
      : `${name}一覧のページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。`;

  return (
    <>
      <Head pagetitle={locale === "en" ? nameen : name} pageDesc={tPageDesc} />
      <Header slug={`category/${slug}`} />
      <Breadcrumbs name={locale === "en" ? nameen : name} />
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"recommend"}
        sectiontitle={locale === "en" ? nameen : name}
        sectiontitleen={locale === "en" ? name : nameen}
      />
      <Footer />
    </>
  );
};

export default Emaki;

export const getStaticPaths = async () => {
  const paths = allCats.map(({ slug }) => ({
    params: {
      slug: slug,
    },
    locale: "ja",
  }));
  paths.push(...paths.map((item) => ({ ...item, locale: "en" })));
  return {
    paths: paths,
    fallback: false,
  };
};

export const getStaticProps = async (context) => {
  const catslug = context.params.slug;
  const { locale, locales } = context;
  const tEmakisData = locale === "en" ? enData : jaData;

  const cat = allCats.find(({ slug }) => slug === catslug);
  const filterdEmakisData = tEmakisData.filter(
    (item) => item.typeen === catslug
  );

  return {
    props: {
      name: cat.name,
      nameen: cat.nameen,
      posts: filterdEmakisData,
      slug: catslug,
    },
  };
};
