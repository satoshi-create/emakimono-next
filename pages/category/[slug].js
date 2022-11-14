import React, { useState, useEffect, useRef } from "react";
import allCats from "../../libs/category";
import emakisData from "../../libs/data";
import Header from "../../components/Header";
import Head from "../../components/Meta";
import CardA from "../../components/CardA";
import Breadcrumbs from "../../components/Breadcrumbs";

const Emaki = ({ name, nameen, posts }) => {

  // const [newImages, setNewImages] = useState(false);
  // const [photos, setPhotos] = useState([]);
  // const [page, setPage] = useState(10);
  // const mounted = useRef(false);

  // console.log(newImages);
  // console.log(page);
  // const fetchImages = async () => {
  //   const slicePhotos = posts.slice(0, `${page}`);
  //   console.log(slicePhotos);
  //   setPhotos((oldPhotos) => {
  //     if (page === 1) {
  //       return slicePhotos;
  //     } else {
  //       return [...oldPhotos, ...slicePhotos];
  //     }
  //   });
  //   setNewImages(false);
  // };

  // useEffect(() => {
  //   fetchImages();
  // }, [page]);

  // useEffect(() => {
  //   if (!mounted.current) {
  //     mounted.current = true;
  //     return;
  //   }
  //   if (!newImages) return;
  //   setPage((oldPage) => oldPage + 10);
  // }, [newImages]);

  // const event = () => {
  //   if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
  //     setNewImages(true);
  //   }
  // };

  // useEffect(() => {
  //   window.addEventListener("scroll", event);
  //   return () => window.removeEventListener("scroll", event);
  // }, []);

  return (
    <>
      <Head pagetitle={name} pageDesc={`${name}のページです`} />
      <Header />
      <Breadcrumbs name={name} />
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"favorite"}
        sectiontitle={name}
        sectiontitleen={nameen}
      />
    </>
  );
};

export default Emaki;

export const getStaticPaths = async () => {
  const paths = allCats.map(({ slug }) => `/category/${slug}`);
  return {
    paths: paths,
    fallback: false,
  };
};

export const getStaticProps = async (context) => {
  const catslug = context.params.slug;

  const cat = allCats.find(({ slug }) => slug === catslug);
  const filterdEmakisData = emakisData.filter(
    (item) => item.typeen === catslug
  );

  return {
    props: {
      name: cat.name,
      nameen: cat.id,
      posts: filterdEmakisData,
    },
  };
};
