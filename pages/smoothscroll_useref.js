// A Look at React Hooks: useRef to Scroll to an Element
// https://lo-victoria.com/a-look-at-react-hooks-useref-to-scroll-to-an-element#heading-step-3-assemble-components
// Example: Scrolling to an element
// https://react.dev/learn/manipulating-the-dom-with-refs#challenges
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { flushSync } from "react-dom";

export default function App() {
  // const mainRef = useRef();
  // const aboutRef = useRef();
  const itemsRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [currentnode, setCurrentnode] = useState();
  console.log(currentnode);

  const handleScroll = (ref) => {
    ref.current.scrollIntoView({
      behavior: "smooth",
    });
  };

  function scrollToId(itemId) {
    const map = getMap();
    const node = map.get(itemId);
    console.log(node);

    node.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }

  function handleCurselFirst(itemId) {
    const map = getMap();
    const node = map.get(itemId);
    setIndex(0);
    node.scrollIntoView({
      behavior: "smooth",
      inline: "start",
    });
  }
  // flushSyncを使っても同期的に処理されない。
  // refでコールバック関数を使っているから？
  function handleCurselNext() {
    flushSync(() => {
      if (index < catList.length - 1) {
        setIndex((i) => i + 1);
      } else {
        setIndex(0);
      }
    });
    console.log(index);
    const map = getMap();
    const node = map.get(index);

    node.scrollIntoView({
      behavior: "smooth",
      inline: "start",
    });
  }
  function handleCurselPrev() {
    flushSync(() => {
      if (index <= 0) {
        setIndex(0);
      } else {
        setIndex(index - 1);
      }
    });
    console.log(index);
    const map = getMap();
    const node = map.get(index);
    console.log(node);
    node.scrollIntoView({
      behavior: "smooth",
      inline: "start",
    });
  }

  function getMap() {
    if (!itemsRef.current) {
      // Initialize the Map on first usage.
      itemsRef.current = new Map();
    }
    return itemsRef.current;
  }

  return (
    <>
      <button onClick={() => setIndex(index + 1)}>indexplus</button>
      <Navigation
        scrollToId={scrollToId}
        handleCurselFirst={handleCurselFirst}
        handleCurselNext={handleCurselNext}
        handleCurselPrev={handleCurselPrev}
      />
      <Main getMap={getMap} index={index} />
      {/* <About aboutRef={aboutRef} handleScroll={handleScroll} /> */}
    </>
  );
}

const Navigation = ({
  scrollToId,
  handleCurselNext,
  handleCurselPrev,
  handleCurselFirst,
}) => {
  const endIndex = catList.length - 1;
  return (
    <nav
      style={{
        position: "absolute",
        top: "0",
        right: "0",
        display: "flex",
        flexDirection: "column",
        zIndex: "10",
      }}
    >
      <button onClick={() => handleCurselFirst(0)}>go to first</button>
      <button onClick={() => handleCurselNext()}>next</button>
      <button onClick={() => handleCurselPrev()}>prev</button>
      <button onClick={() => scrollToId(5)}>Maru</button>
      <button onClick={() => scrollToId(9)}>Jellylorum</button>
      <button onClick={() => scrollToId(endIndex)}>go to end</button>
    </nav>
  );
};

const Main = ({ getMap, index }) => {
  // useEffect(() => {
  //   if (mainRef && mainRef.current) {
  //     mainRef.current.scrollIntoView({
  //       behavior: "smooth",
  //       // block: "end",
  //       // inline: "nearest",
  //     });
  //   }
  // }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row-reverse",
        //  overflowを設定しないとrow-reverseが効かない（ほかのflex-drectionは効く）
        overflow: "auto",
      }}
    >
      {catList.map((cat, i) => (
        <div
          key={cat.id}
          id={cat.id}
          ref={(node) => {
            const map = getMap();
            if (node) {
              map.set(cat.id, node);
            } else {
              map.delete(cat.id);
            }
            // ref={(node) => {
            //   const map = getMap();
            //   if (node) {
            //     map.set(cat.id, node);
            //   } else {
            //     map.delete(cat.id);
            //   }
          }}
        >
          <img src={cat.imageUrl} alt={"Cat #" + cat.id} />
        </div>
      ))}
    </div>
  );
};

const catList = [];
for (let i = 0; i < 10; i++) {
  catList.push({
    id: i,
    imageUrl: "https://placekitten.com/250/200?image=" + i,
  });
}
