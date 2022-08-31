import React, { useState } from "react";

const NextContext = React.createContext();

const NextProvider = ({ children }) => {
  const [count, setcount] = useState(10);
  return (
    <NextContext.Provider value={{ count, setcount }}>
      {children}
    </NextContext.Provider>
  );
};

export { NextContext, NextProvider };
