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
    <Link href="https://twitter.com/ebisucom?ref_src=twsrc%5Etfw">
      <a className="twitter-timeline">Tweets by engawatorahiko</a>
    </Link>
  );
};

export default Tweet;
