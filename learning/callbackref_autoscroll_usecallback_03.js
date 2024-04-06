import React, { useCallback, useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const SmoothScrolling = () => {
  const ref = useRef();
  const [index, setIndex] = useState(null);

  const router = useRouter();

  const scrollDialog = useCallback(() => {
    if (ref.current) {
      // ref.current.scrollTop(0);
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [ref]);

  useEffect(() => {
    const hash = window.location.hash;
    const pathAndSlug = router.asPath.split("#")[0];
    window.location.replace(pathAndSlug);

    setIndex(hash);
    if (index) {
      scrollDialog();
    }
  }, [scrollDialog, index, setIndex, router.asPath]);

  return (
    <>
      <div>
        {/* sec1 */}
        {itemList.map((item, i) => (
          <div className={item} key={i} id={i} ref={index === i ? ref : null}>
            {itemList.map((item, i) => (
              <div className={item} key={i}>
                あおによし
              </div>
            ))}
          </div>
        ))}
      </div>
      <div>{/* sec1 */}</div>
    </>
  );
};

const itemList = [];
for (let i = 0; i < 100; i++) {
  itemList.push("tile");
}

export default SmoothScrolling;
