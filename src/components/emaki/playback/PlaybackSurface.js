import PlaybackStrip from "@/components/emaki/playback/PlaybackStrip";
import styles from "@/styles/PlaybackSurface.module.css";

const PlaybackSurface = ({ slots, stripTrackRef, screenHeight, screenWidth }) => (
  <div
    className={styles.surface}
    aria-hidden="true"
    style={{
      "--screen-height": screenHeight,
      "--screen-width": screenWidth,
    }}
  >
    <PlaybackStrip slots={slots} stripTrackRef={stripTrackRef} />
  </div>
);

export default PlaybackSurface;
