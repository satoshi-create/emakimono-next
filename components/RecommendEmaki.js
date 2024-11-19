import { useState, useContext } from "react";
import {
  ChakraProvider,
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  Flex,
} from "@chakra-ui/react";
import { LinkIcon, StarIcon } from "@chakra-ui/icons";
import CardC from "./CardC";
import { AppContext } from "../pages/_app";
import Link from "next/link";
import RankingCard from "./RankingCard";

const RecommendEmaki = ({ data }) => {

  const [tabIndex, setTabIndex] = useState(0);


  const handleTabsChange = (index) => {
    setTabIndex(index);
  };

  return (
    <ChakraProvider>
      <Box p={4}>
        <Tabs index={tabIndex} onChange={handleTabsChange} variant="enclosed">
          <TabList mb="1em">
            <Tab>
              <Flex align="center">
                <StarIcon mr={2} />
                <Text>絵巻ランキング</Text>
              </Flex>
            </Tab>
            <Tab>
              <Flex align="center">
                <LinkIcon mr={2} />
                <Text>関連絵巻</Text>
              </Flex>
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <RankingCard isCompact={true} />
            </TabPanel>
            <TabPanel>
              <CardC data={data} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </ChakraProvider>
  );
};

export default RecommendEmaki;
