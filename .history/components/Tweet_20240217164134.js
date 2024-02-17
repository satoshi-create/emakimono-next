import React from "react";

const Tweet = () => {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: generateEmbedHtml(id) }}
      ref={ref}
    />
  );
};

export default Tweet;
