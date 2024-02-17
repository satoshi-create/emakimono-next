import React, { useEffect, useRef } from "react";

const Tweet = () => {
  const ref = useRef < HTMLDivElement > null;
  return (
    <div
      dangerouslySetInnerHTML={{ __html: generateEmbedHtml(id) }}
      ref={ref}
    />
  );
};

export default Tweet;
