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
     className="twitter-timeline" 
     href="https://twitter.com/PHARMA_W0RKS?ref_src=twsrc%5Etfw" 
     target="_blank" rel="noopener noreferrer" 
    > 
    Tweets by PHARMA_W0RKS 
   </a>
  );
};

export default TwitterTimeline;

