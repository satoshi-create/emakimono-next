import React, { useRef } from "react";

const Smoothscrill_userefmap = () => {
  const fruits = ["apple", "banana", "orange", "lemon", "grape"];
  const fruitRefs = useRef([]);

  return (
    <div className="App">
      {fruits.map((fruit, index) => (
        <div key={fruit}>
          <input ref={fruitRefs.current[index]} fruit={fruit} />
        </div>
      ))}
    </div>
  );
};

export default Smoothscrill_userefmap;
