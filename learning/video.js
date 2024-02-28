import React, { useState, useRef, useEffect } from "react";

const Video = () => {
  const ref = useRef();
  const [toggle, setToggle] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isPlaying) {
      ref.current.play();
    } else {
      ref.current.pause();
    }
  }, [isPlaying]);

  return (
    <>
      <button onClick={() => setToggle(!toggle)}>動画を表示</button>
      {toggle && (
        <div className="hidden">
          <video onClick={() => setIsPlaying(!isPlaying)} ref={ref}>
            <source
              src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm"
              type="video/webm"
            />
            <p>
              お使いのブラウザーは HTML 動画に対応していません。代わりに
              <a href="rabbit320.mp4">動画へのリンク</a>をご利用ください。
            </p>
          </video>
        </div>
      )}
    </>
  );
};

export default Video;
