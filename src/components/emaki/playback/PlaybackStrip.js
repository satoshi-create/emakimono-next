import styles from "@/styles/PlaybackSurface.module.css";

const PlaybackStrip = ({ slots, stripTrackRef }) => {
  if (!slots?.length) return null;

  return (
    <div className={styles.stripViewport}>
      <div ref={stripTrackRef} className={styles.stripTrack}>
        {slots.map((slot, i) => (
          <div
            key={`${slot.sceneIndex}-${i}`}
            className={styles.slot}
            style={{ width: slot.widthPx || undefined, minWidth: slot.widthPx || undefined }}
          >
            {slot.displayUrl ? (
              // Playback Surface は next/image を使わない（再生中 IO 回避）
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={styles.slotImg}
                src={slot.displayUrl}
                alt=""
                draggable={false}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaybackStrip;
