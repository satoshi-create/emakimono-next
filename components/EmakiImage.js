import React from "react";

const EmakiImage = ({ item: { srcSp, srcTb, src, load, name } }) => {
  return (
    <div className="box">
      <picture>
        <source
          data-srcset={srcSp}
          media="(max-height: 375px)"
          type="image/webp"
        />
        <source
          data-srcset={srcTb}
          media="(max-height: 800px)"
          type="image/webp"
        />
        <source data-srcset={src} type="image/webp" />
        <img
          decoding="async"
          src={
            load
              ? srcSp
              : "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
          }
          className="loading lazyload"
          alt={name}
          data-expand="600"
        />
      </picture>
    </div>
  );
};

export default EmakiImage;

// <div className="box" key={index}>
//   <picture>
//     <source
//       data-srcset={srcSp}
//       media="(max-height: 375px)"
//       type="image/webp"
//     />
//     <source
//       data-srcset={srcTb}
//       media="(max-height: 800px)"
//       type="image/webp"
//     />
//     <source data-srcset={src} type="image/webp" />
//     <img
//       decoding="async"
//       src={
//         load
//           ? srcSp
//           : "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
//       }
//       className="loading lazyload"
//       alt={name}
//       data-expand="600"
//     />
//   </picture>
// </div>
