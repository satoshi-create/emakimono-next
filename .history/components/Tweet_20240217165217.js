import React, { useEffect } from 'react';

const TwitterTimeline = () => {

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []); 

  return (
    <a
      class="twitter-timeline"
      href="https://twitter.com/engawatorahiko?ref_src=twsrc%5Etfw"
    >
      Tweets by engawatorahiko
    </a>
  );
};

export default TwitterTimeline;

