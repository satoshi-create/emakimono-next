import { useState,useContext } from "react";
import {
  ChakraProvider,
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import CardC from "./CardC";
import { AppContext } from "../pages/_app";
import Loader from "./Loader";
import Link from "next/link";

const RecommendEmaki = () => {
    const { result ,loading} = useContext(AppContext);

  const [tabIndex, setTabIndex] = useState(0);

  const handleTabsChange = (index) => {
    setTabIndex(index);
  };
  return (

        <ChakraProvider>
          <Box p={4}>
            <Tabs
              index={tabIndex}
              onChange={handleTabsChange}
              variant="enclosed"
            >
              <TabList mb="1em">
                <Tab>関連絵巻</Tab>
                <Tab>絵巻ランキング</Tab>
              </TabList>
              <TabPanels>
                         <TabPanel>
                  <p>絵巻ランキングのコンテンツがここに表示されます。</p>
                </TabPanel>
                <TabPanel>{loading ? <Loader/> : <CardC data={result} loading={loading} />}
        <Link href={`./ranking`}>
                        <a>
                          <p>全ての絵巻ランキングを見る</p>
                        </a>
                      </Link>
                </TabPanel>

              </TabPanels>
            </Tabs>
          </Box>
        </ChakraProvider>
  );
};

export default RecommendEmaki;
