import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const Breadcrumbs = ({ type, title, titleen, typeen }) => {
  const router = useRouter();
  const paths = decodeURI(router.asPath).substring(1).split("/");
  console.log(typeen);

  const roots = [""];
  for (let i = 0; i < paths.length; i++) roots.push(roots[i] + "/" + paths[i]);

  return (
    <ol>
      <Link href={"/"}>
        <a>Top</a>
      </Link>
      {">"}
      <Link href={`/${typeen}`}>
        <a>{type}</a>
      </Link>
      {">"}
      <Link href={`/${typeen}/${titleen}`}>
        <a>{title}</a>
      </Link>
      {/* {paths.map((x, i) => (
        <>
          {">"}
          <Link href={roots[i + 1]} key={i}>
            <a>{x}</a>
          </Link>
        </>
      ))} */}
      {/* {lists.map((list, index) => {
        const { name, path } = list;
        return (
          <li key={index}>
            <Link href={path}>
              <a>{name}</a>
            </Link>
          </li>
        );
      })}
      {">"}
      {title} */}
    </ol>
  );
};

export default Breadcrumbs;
