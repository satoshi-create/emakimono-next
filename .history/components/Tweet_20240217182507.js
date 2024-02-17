import React, { useEffect } from "react";
import Link from "next/link";
import styles from "../styles/Tweet.module.css";

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
    <aside className="section-center section-padding twitter-container">
      <a
        // style={tweetStyle}
        className="twitter-timeline"
        href="https://twitter.com/engawakobosato?ref_src=twsrc%5Etfw"
      >
        Tweets by engawatorahiko
      </a>
    </aside>
  );
};

export default Tweet;
