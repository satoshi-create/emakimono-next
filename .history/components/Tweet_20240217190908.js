import React, { useEffect } from "react";

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
        href="https://twitter.com/enjoy_emakimono?ref_src=twsrc%5Etfw"
      >
        Tweets by enjoy_emakimono
      </a>
    </aside>
  );
};

export default Tweet;

<a class="twitter-timeline" href="https://twitter.com/enjoy_emakimono?ref_src=twsrc%5Etfw">Tweets by enjoy_emakimono</a> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>