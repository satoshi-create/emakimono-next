import React, { useCallback, useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const SmoothScrolling = () => {
  const router = useRouter();
  const [index, setIndex] = useState(80);
  const [toggle, setToggle] = useState(false);
  const [hash, setHash] = useState(0);

  // ボタンを押すと同時にハッシュをindexに格納
  const handleTogggle = () => {
    setIndex(hash);
    setToggle(!toggle);
  };

  //  再レンダリングが始まったらアンカー先までスムーズスクロール
  const scrollDialog = useCallback((node) => {
    if (node !== null) {
      node.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  useEffect(() => {
    // ハッシュフラグを取得し、stringからnumbarに変換
    const fetchHashflag = () => {
      const hashflag = Number(router.asPath.split("#")[1]);

      setHash(hashflag);
    };
    // レンダリング完了時に発火
    fetchHashflag();
  }, [router.asPath]);

  return (
    <div>
      <button onClick={handleTogggle}>button</button>
      {toggle &&
        itemList.map((item, i) => (
          <div
            className={item}
            key={i}
            ref={index === i ? scrollDialog : null}
            id={i}
          >
            {itemList.map((item, i) => (
              <div className={item} key={i} id={i}>
                あおによし
              </div>
            ))}
          </div>
        ))}
    </div>
  );
};

const itemList = [];
for (let i = 0; i < 100; i++) {
  itemList.push("tile");
}

export default SmoothScrolling;
