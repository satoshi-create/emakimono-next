import React from "react";

const tweet = () => {
  <>
    <Tweet id="20" />
    <Script
      src="https://platform.twitter.com/widgets.js"
      strategy="lazyOnload"
    />
  </>;
};

export default tweet;
