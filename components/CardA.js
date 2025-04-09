import SingleCardA from "@/components/SingleCardA";
import Title from "@/components/Title";
import { AppContext } from "@/pages/_app";
import styles from "@/styles/CardA.module.css";
import { useContext, useEffect } from "react";

const CardA = ({
  emakis,
  columns,
  sectiontitle,
  needdesc,
  sectiondesc,
  sectiontitleen,
  bcg,
  variant,
}) => {
  const { setisModalOpen } = useContext(AppContext);

  useEffect(() => {
    setisModalOpen(false);
  }, [setisModalOpen]);

  return (
    <section
      className={columns !== "searchbox" && "section-grid section-padding"}
      style={{ background: bcg }}
    >
      <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />
      {sectiondesc && <p className={styles.sectiondesc}>{sectiondesc}</p>}
      <div className={styles[columns]}>
        {emakis.map((item, i) => {
          return (
            <SingleCardA
              item={item}
              sectiontitle={sectiontitle}
              columns={columns}
              needdesc={needdesc}
              key={i}
              variant={variant}
            />
          );
        })}
      </div>
      {/* {linktitle && (
        <Button
          title={
            locale === "en"
              ? `View a list of ${linktitleen} !!`
              : `${linktitle}を見る`
          }
          path={linkpath}
          style={columns}
        />
      )} */}
    </section>
  );
};

export default CardA;
