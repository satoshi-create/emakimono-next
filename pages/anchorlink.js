// Next.js + React でページ内のスムーススクロールを実装する
// https://www.gaji.jp/blog/2023/10/23/17397/
// import React, { useRef, useCallback } from "react";

// const Acnhorlink = () => {
//   const refElement1 = useRef();
//   const refElement2 = useRef();
//   console.log(refElement1);

//   const scrollToSection1 = useCallback(() => {
//     refElement1.current.scrollIntoView({
//       behavior: "smooth",
//     });
//   }, []);
//   const scrollToSection2 = useCallback(() => {
//     refElement2.current.scrollIntoView({
//       behavior: "smooth",
//     });
//   }, []);

//   return (
//     <>
//       <ul>
//         <li onClick={scrollToSection1}>リスト01</li>
//         <li onClick={scrollToSection2}>リスト02</li>
//         <li>
//           <a href="#link03">リスト03</a>
//         </li>
//       </ul>

//       <div id="link01" ref={refElement1}>
//         <p>ブロック01</p>
//         <img loading="lazy" src="genji_asagao_01-375.webp" />
//       </div>

//       <div id="link02" ref={refElement2}>
//         <p>ブロック02</p>
//         <img loading="lazy" src="genji_asagao_02-375.webp" />
//       </div>

//       <div id="link03">
//         <p>ブロック03</p>
//         <img loading="lazy" src="genji_asagao_03-375.webp" />
//       </div>
//     </>
//   );
// };

// export default Acnhorlink;

// 【小ネタ】Next.jsでハッシュフラグメントを張る
//zenn.dev/tera_ny/articles/94c98f1dac31de
// import AnchorLink from "../components/anchorlink";

// const anchorlink = () => (
//   <main>
//     <AnchorLink to={{ hash: "hoge" }} anchor={"hoge"}>
//       <h1>Hoge</h1>
//     </AnchorLink>
//   </main>
// );

// router/replace
// import { useEffect } from "react";
// import { useRouter } from "next/router";

// const FormComponent = () => {
//   const router = useRouter();

//   return (
//     <button type="button" onClick={() => router.replace("/home")}>
//       Click me
//     </button>
//   );
// };

// export default FormComponent;

// 【Next】動的なページへの遷移後に、指定の位置(hash)までスクロールさせたい
//qiita.com/tak001/items/cae2f2ec2f477c90f268
// import { useEffect } from "react";
// import { useRouter } from "next/router";

// const FormComponent = () => {
//   const router = useRouter();

//   useEffect(() => {
//     // history に追加しないように router.replace
//     router.replace({ hash: scroll }, undefined, {
//       shallow: true,
//     });
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   return <div id={"scroll"}>ここまでスクロールできた</div>;
// };

// export default FormComponent;

import { useEffect } from "react";
import { useRouter } from "next/router";

const FormComponent = () => {
  const router = useRouter();

  useEffect(() => {
    // history に追加しないように router.replace
    // Cancel Rendering Route Error 
    router.replace({ hash: scroll }, undefined, {
      shallow: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
       <div id={"scroll"}>ここまでスクロールできた</div>;
    </>
  );
};

export default FormComponent;
