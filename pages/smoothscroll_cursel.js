import { useRef, useState } from "react";
import { flushSync } from "react-dom";

export default function CatFriends() {
  const selectedRef = useRef(null);
  const [index, setIndex] = useState(0);

  function handleCursel() {
    flushSync(() => {
      if (index < catList.length - 1) {
        setIndex(index + 1);
      } else {
        setIndex(0);
      }
    });
    console.log(index);
    console.log(selectedRef.current);
    selectedRef.current.scrollIntoView({
      behavior: "smooth",
      // block: "nearest",
      // inline: "center",
    });
  }

  return (
    <div>
      <Navigation handleCursel={handleCursel} />
      <List selectedRef={selectedRef} index={index} />
    </div>
  );
}

const Navigation = ({ handleCursel }) => {
  return (
    <nav style={{ position: "absolute", right: "0" }}>
      <button onClick={() => handleCursel()}>Next</button>
    </nav>
  );
};

const List = ({ selectedRef, index }) => {
  return (
    <ul
      style={{
        display: "flex",
        flexDirection: "row-reverse",
        //  overflowを設定しないとrow-reverseが効かない（ほかのflex-drectionは効く）
        overflow: "auto",
      }}
    >
      {catList.map((cat, i) => (
        <li key={cat.id} ref={index === i ? selectedRef : null}>
          <img
            className={index === i ? "active" : ""}
            src={cat.imageUrl}
            alt={"Cat #" + cat.id}
          />
        </li>
      ))}
    </ul>
  );
};
const catList = [];
for (let i = 0; i < 10; i++) {
  catList.push({
    id: i,
    imageUrl: "https://placekitten.com/250/200?image=" + i,
  });
}
