import { useCallback, useState } from "react";

function MeasureExample() {
  const [height, setHeight] = useState({});
  console.log(height);

  const measuredRef = useCallback((node) => {
    if (node !== null) {
      console.log(node.getBoundingClientRect());

      let { width, height, top, bottom } = node.getBoundingClientRect();
      setHeight({ width, height, bottom, top });

      // for (const key in rect) {
      //   if (typeof rect[key] !== "function") {
      //     let para = document.createElement("p");
      //     para.textContent = `${key} : ${rect[key]}`;
      //     document.body.appendChild(para);
      //   }
      // }
    }
  }, []);

  return (
    <div
      style={{
        display: "flex",
        placeContent: "center",
        placeItems: "center",
        height: "100vh",
      }}
    >
      <div
        style={{
          width: "400px",
          height: "400px",
          backgroundColor: "red",
          margin: "auto",
          padding: "10rem",
        }}
        ref={measuredRef}
      ></div>
    </div>
  );
}

export default MeasureExample;
