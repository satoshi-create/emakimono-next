import { removeNestedEmakisObj, useLocaleData } from "@/utils/func";

const ExtractingListData = () => {
  const { t: data } = useLocaleData();
  const removeNestedArrayObj = data.map((item) => {
    return removeNestedEmakisObj(item);
  });

  return removeNestedArrayObj;
};

export default ExtractingListData;
