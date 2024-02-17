import React, { useEffect } from "react";
import Link from "next/link";

const Tweet = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <a
      style={tweetStyle}
      href="https://twitter.com/ebisucom?ref_src=twsrc%5Etfw"
    >
      Tweets by engawatorahiko
    </a>
  );
};

export default Tweet;

const tweetStyle = {
  color: "red",
    width: "300px";
    height: 400px;
    overflow: hidden;
};
