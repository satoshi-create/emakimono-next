import { useCallback, useState } from "react";

function MeasureExample() {
  const [height, setHeight] = useState(0);
  console.log(height);

  const measuredRef = useCallback((node) => {
    if (node !== null) {
      setHeight(node.getBoundingClientRect().width);
    }
  }, []);

  return (
    <>
      <h1 ref={measuredRef}>Hello, world</h1>
      <h2>The above header is {Math.round(height)}px tall</h2>
    </>
  );
}

export default MeasureExample;
