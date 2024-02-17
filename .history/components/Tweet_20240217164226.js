import React, { useEffect, useRef } from "react";

const Tweet: React.FC<{ id: string }> = ({ id }) => {
  const ref = useRef < HTMLDivElement > null;

  useEffect(() => {
    // @ts-expect-error
    window.twttr?.widgets.load(ref.current);
  }, [id]);

  return (
    <div
      dangerouslySetInnerHTML={{ __html: generateEmbedHtml(id) }}
      ref={ref}
    />
  );
};

export default Tweet;
