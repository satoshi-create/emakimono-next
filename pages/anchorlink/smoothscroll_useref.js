// A Look at React Hooks: useRef to Scroll to an Element
// https://lo-victoria.com/a-look-at-react-hooks-useref-to-scroll-to-an-element#heading-step-3-assemble-components
// Example: Scrolling to an element
// https://react.dev/learn/manipulating-the-dom-with-refs#challenges
import { useEffect, useRef } from "react";
import Link from "next/link";

export default function App() {
  const mainRef = useRef();
  const aboutRef = useRef();
  const itemsRef = useRef(null);

  const handleScroll = (ref) => {
    ref.current.scrollIntoView({
      behavior: "smooth",
    });
  };

  function scrollToId(itemId) {
    const map = getMap();
    const node = map.get(itemId);
    node.scrollIntoView({
      behavior: "smooth",
      // // vertical
      // block: "nearest",
      // // horizontal
      // inline: "center",
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
      <Navigation scrollToId={scrollToId} />
      <Main mainRef={mainRef} handleScroll={handleScroll} getMap={getMap} />
      {/* <About aboutRef={aboutRef} handleScroll={handleScroll} /> */}
    </>
  );
}

const Navigation = ({ scrollToId }) => {
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
      <Link href="#9" onClick={() => scrollToId(9)}>
        <a>Jellylorum</a>
      </Link>
      <button onClick={() => scrollToId(0)}>Tom</button>
      <button onClick={() => scrollToId(5)}>Maru</button>
      <button onClick={() => scrollToId(9)}>Jellylorum</button>
    </nav>
  );
};

const Main = ({ mainRef, handleScroll, getMap }) => {
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
      {catList.map((cat) => (
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
