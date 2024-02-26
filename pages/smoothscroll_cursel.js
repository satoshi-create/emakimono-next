import { border } from "@chakra-ui/react";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";

export default function CatFriends() {
  const selectedRef = useRef(null);
  const [index, setIndex] = useState(0);
  const endIndex = catList.length - 1;
  console.log(index);
  function handleCurselNext() {
    flushSync(() => {
      if (index < catList.length - 1) {
        setIndex(index + 1);
      } else {
        setIndex(endIndex);
      }
    });

    console.log(selectedRef.current);
    selectedRef.current.scrollIntoView({
      behavior: "smooth",
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

    console.log(selectedRef.current);
    selectedRef.current.scrollIntoView({
      behavior: "smooth",
    });
  }

  function handleToId(id) {
    flushSync(() => {
      setIndex(id);
    });
    selectedRef.current.scrollIntoView({
      behavior: "smooth",
    });
  }

  return (
    <div>
      <Navigation
        handleCurselNext={handleCurselNext}
        handleToId={handleToId}
        handleCurselPrev={handleCurselPrev}
        endIndex={endIndex}
      />
      <List selectedRef={selectedRef} index={index} />
    </div>
  );
}

const Navigation = ({
  handleCurselNext,
  handleToId,
  handleCurselPrev,
  endIndex,
}) => {
  return (
    <nav style={{ position: "absolute", right: "0" }}>
      <button onClick={() => handleToId(endIndex)}>go to end</button>
      <button onClick={() => handleCurselNext()}>Next</button>
      <button onClick={() => handleToId(9)}>Jellylorum</button>
      <button onClick={() => handleToId(5)}>Maru</button>
      <button onClick={() => handleCurselPrev()}>Prev</button>
      <button onClick={() => handleToId(0)}>go to first</button>
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
