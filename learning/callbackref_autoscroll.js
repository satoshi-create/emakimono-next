import React, { useRef, useLayoutEffect, useEffect } from "react";

const SmoothScrolling = () => {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    const container = containerRef.current;

    const handleScroll = () => {
      // Smoothly scroll to the top of the container
      container.scrollTo(0, 1000);
    };

    // Scroll to the top when the component is mounted
    handleScroll();

    // Add event listener to scroll to the top on subsequent scrolls
    window.addEventListener("scroll", () => {
      console.log("mount");
      handleScroll();
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [containerRef]);

  return (
    <div ref={containerRef}>
      {itemList.map((item, i) => (
        <div className={item} key={i}>
          いとおかし
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
