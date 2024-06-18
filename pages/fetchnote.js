import React from "react";

const FetchData = () => {
  fetch("http://localhost:3000/api/enjoy_emakimono")
    .then((res) => res.json())
    .then((json) => console.log(json))
    .catch(() => alert("error"));

  return <></>;
};

export default FetchData;
