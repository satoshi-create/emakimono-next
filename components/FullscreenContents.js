import React from "react";
import FullScreenComp from "./FullScreenComp";
import EmakiConteiner from "./EmakiConteiner";
import Title from "./Title";
import Button from "./Button";
import { useRouter } from "next/router";

const FullscreenContents = ({
  data,
  sectiontitle,
  sectiontitleen,
  linktitle,
  linktitleen,
  linkpath,
  columns,
}) => {
  const { cyouzyuuzinbutugiga, seiyoukaiga, suibokuga, mone } = data;
  const { locale } = useRouter();
  return (
    <section className={`section-center section-padding`}>
      <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />
      <div
        className="section-padding"
        style={{ display: "flex", justifyContent: "flex-start" }}
      >
        <FullScreenComp right={"1rem"}>
          <EmakiConteiner
            data={{ ...cyouzyuuzinbutugiga }}
            height={"50vh"}
            width={"80vw"}
            scroll={false}
            overflowX={"hidden"}
            boxshadow={" 0 5px 15px rgba(0, 0, 0, 20%)"}
          />
        </FullScreenComp>
      </div>
      <div
        className="section-padding"
        style={{ display: "flex", justifyContent: "flex-end" }}
      >
        <FullScreenComp left={"1rem"}>
          <EmakiConteiner
            data={{ ...seiyoukaiga }}
            height={"50vh"}
            width={"80vw"}
            scroll={false}
            overflowX={"hidden"}
            boxshadow={" 0 5px 15px rgba(0, 0, 0, 20%)"}
          />
        </FullScreenComp>
      </div>
      <div
        className="section-padding"
        style={{ display: "flex", justifyContent: "flex-start" }}
      >
        <FullScreenComp right={"1rem"}>
          <EmakiConteiner
            data={{ ...suibokuga }}
            height={"50vh"}
            width={"80vw"}
            scroll={false}
            overflowX={"hidden"}
            boxshadow={" 0 5px 15px rgba(0, 0, 0, 20%)"}
          />
        </FullScreenComp>
      </div>
      <div
        className="section-padding"
        style={{ display: "flex", justifyContent: "flex-end" }}
      >
        <FullScreenComp left={"1rem"}>
          <EmakiConteiner
            data={{ ...mone }}
            height={"50vh"}
            width={"80vw"}
            scroll={false}
            overflowX={"hidden"}
            boxshadow={" 0 5px 15px rgba(0, 0, 0, 20%)"}
          />
        </FullScreenComp>
      </div>
      {linktitle && (
        <Button
          title={
            locale === "en"
              ? `More flowing scrolls !!`
              : `流れる巻物をもっと見る`
          }
          path={`/${linkpath}`}
          style={columns}
        />
      )}
    </section>
  );
};

export default FullscreenContents;
