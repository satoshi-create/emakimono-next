import { AppContext } from "@/context/AppContext";
import { getPlaybackSceneWidthCss } from "@/libs/emakiImageLoading/playbackDomWindow";
import { memo, useContext } from "react";

/** 再生 windowing: レイアウト幅のみ保持し画像 DOM を載せない */
const PlaybackSceneSpacer = ({ srcWidth, srcHeight }) => {
  const { orientation, toggleFullscreen } = useContext(AppContext);

  return (
    <div
      className="playback-scene-spacer"
      style={{
        width: getPlaybackSceneWidthCss(srcWidth, srcHeight, {
          toggleFullscreen,
          orientation,
        }),
        height: "100%",
        flexShrink: 0,
        backgroundColor: "#f5f0e6",
      }}
      aria-hidden
    />
  );
};

export default memo(PlaybackSceneSpacer);
