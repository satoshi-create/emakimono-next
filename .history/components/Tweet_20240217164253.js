import React, { useEffect, useRef } from "react";

const Tweet = ({id}) => {
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

const generateEmbedHtml = (id: string): string => {
  if (!/^\d+$/u.test(id)) {
    throw new Error(`Invalid tweet ID: ${id}`);
  }

  return `<blockquote class="twitter-tweet"><a href="https://twitter.com/i/status/${id}"></a></blockquote>`;
};

export default Tweet;
