import React from 'react'

const GridImageCard = () => {
  return (
    <div>GridImageCard</div>
  )
}

export default GridImageCard

const gridImageCard = ({ item }) => {
  const { image, title, path, desc, descen, eracolor, bln, id } = item;
  return (
    <figure className={styles.figure}>
      <Image
        src={image}
        layout="fill"
        objectFit="cover"
        className={styles.image}
        sName={styles.image}
        alt={title}
        loading="lazy"
        placeholder="blur"
        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
      />
      <div className={`${styles.infocontainer} ${styles[eracolor]}`}></div>
      <div
        className={styles.info}
        onMouseOver={() => enterImage(id)}
        onMouseOut={() => leaveImage(id)}
      >
        {bln ? (
          <div className={styles.link}>
            <Button
              title={"横スクロールで見る"}
              path={path}
              style={"gridimage"}
            />
          </div>
        ) : (
          <p className={styles.desc}>{locale === "en" ? descen : desc}</p>
        )}
      </div>
    </figure>
  );
};