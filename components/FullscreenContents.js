import React from "react";
import FullScreenComp from "./FullScreenComp";
import EmakiConteiner from "./EmakiConteiner";

const FullscreenContents = ({ data }) => {
  const { cyouzyuuzinbutugiga, seiyoukaiga, suibokuga, mone } = data;

  return (
    <>
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
    </>
  );
};

export default FullscreenContents;
