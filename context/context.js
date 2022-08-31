import React, { useState } from "react";

const NextContext = React.createContext();

const NextProvider = ({ children }) => {
  const [ekotobaToggle, setekotobaToggle] = useState(false);
  const [oepnSidebar, setOepnSidebar] = useState(false);
  const [ekotobaImageToggle, setEkotobaImageToggle] = useState(false);
  return (
    <NextContext.Provider
      value={{
        ekotobaToggle,
        setekotobaToggle,
        oepnSidebar,
        setOepnSidebar,
        ekotobaImageToggle,
        setEkotobaImageToggle,
      }}
    >
      {children}
    </NextContext.Provider>
  );
};

export { NextContext, NextProvider };
