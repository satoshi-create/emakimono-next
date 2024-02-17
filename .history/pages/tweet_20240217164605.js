import React from "react";
import Tweet from "../components/Tweet";

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
