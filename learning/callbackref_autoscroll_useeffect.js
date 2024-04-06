import React, { useState, useEffect, useRef, useCallback } from "react";

const AutoScroll = () => {
  const [cards, setCards] = useState([]);
  // console.log(cards);

  // useEffectの中でhashIdがわかるのでそれを保存しておく変数を作る
  const [hashId, setId] = useState(null);

  useEffect(() => {
    // NextJSだと/apiにバックエンドを生やせ、同じホストからアクセスできる
    // fetch("https://jsonplaceholder.typicode.com/posts")
    //   .then((res) => res.json())
    //   .then((d) => setCards(d));

    async function fetchPlaceholeder() {
      const response = await fetch(
        "https://jsonplaceholder.typicode.com/posts"
      );
      const data = await response.json();
      setCards(data);
    }

    fetchPlaceholeder();

    // URLの#hogeを取り出す
    setId(window.location.hash.replace("#", ""));
  }, []);

  return cards ? (
    <div>
      {cards.map((item, i) => (
        // componentがスクロール対象かどうかを子コンポーネントは知る必要がある
        // また各子コンポーネントがrefを持つ必要があるので別コンポーネントに切り出している
        <Child id={item.id} isScroll={item.id === hashId} key={i}></Child>
      ))}
    </div>
  ) : (
    "loading"
  );
};

const Child = ({ id, isScroll }) => {
  const ref = useRef();
  useEffect(() => {
    // 自分がスクロール対象であればスクロールする
    if (isScroll) {
      ref.current.scrollIntoView();
    }
  }, [isScroll]);
  // const scrollDialog = useCallback((node) => {
  //   if (node !== null) {
  //     node.scrollIntoView({
  //       behavior: "smooth",
  //       block: "start",
  //     });
  //   }
  // }, []);
  return (
    <div
      ref={ref}
      // ref={isScroll ? scrollDialog : null}
      id={id}
      style={{
        width: "300px",
        height: "300px",
        background: "gray",
        margin: "12px",
      }}
    ></div>
  );
};

export default AutoScroll;
