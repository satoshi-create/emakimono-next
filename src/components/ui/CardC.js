import SingleCardC from "@/components/ui/SingleCardC";
import { getRelatedScrolls, normalizeScrollForDisplay } from "@/utils/getRelatedScrolls";
import { useEffect, useState } from "react";

const CardC = ({ data, scrollList = [], loading }) => {
  const relatedScrolls = getRelatedScrolls(scrollList, data, 8);

  const [shuffledScrolls, setShuffledScrolls] = useState(() =>
    relatedScrolls.slice().sort(() => Math.random() - Math.random())
  );

  useEffect(() => {
    setShuffledScrolls(
      relatedScrolls.slice().sort(() => Math.random() - Math.random())
    );
  }, [relatedScrolls.length]);

  const displayItems = shuffledScrolls
    .map(normalizeScrollForDisplay)
    .filter(Boolean);

  return displayItems.map((item, i) => (
    <SingleCardC key={item.scroll_id ?? item.titleen ?? i} item={item} />
  ));
};

export default CardC;
