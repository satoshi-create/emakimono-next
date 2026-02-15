import { AppContext } from "@/pages/_app";
import { eraColor } from "@/utils/func";
import { ArrowForwardIcon, ViewIcon } from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Button,
  Link as ChakraLink,
  Flex,
  Grid,
  HStack,
  Image,
  Stack,
  Tag,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useContext, useMemo, useState } from "react";

/* ─── メダルカラー ─── */
const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"]; // gold, silver, bronze

/* ─── トップ3 ヒーローセクション ─── */
function Top3Hero({ items, locale }) {
  if (items.length === 0) return null;
  const first = items[0];
  const runners = items.slice(1, 3);

  return (
    <VStack spacing={6} mb={10}>
      {/* 1位: ワイド表示 */}
      <NextLink href={`/${first.titleen}`} passHref>
        <ChakraLink
          textDecoration="none"
          _hover={{ textDecoration: "none" }}
          width="100%"
        >
          <Box
            position="relative"
            borderRadius="xl"
            overflow="hidden"
            transition="all 0.3s"
            _hover={{ boxShadow: "xl", transform: "scale(1.01)" }}
          >
            <Image
              src={first.thumb}
              alt={first.title}
              objectFit="cover"
              width="100%"
              maxH="400px"
            />
            {/* グラデーションオーバーレイ */}
            <Box
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              bgGradient="linear(to-t, blackAlpha.800, transparent)"
              p={6}
            >
              <HStack spacing={2} mb={1}>
                <Text fontSize="2xl" fontWeight="bold" color={medalColors[0]}>
                  {locale === "en" ? "#1" : "1位"}
                </Text>
                <Badge
                  bg={eraColor(first.era) || "gray.500"}
                  color="white"
                  textTransform="none"
                  borderRadius="full"
                  px={2}
                >
                  {locale === "en"
                    ? `${first.eraen} period`
                    : `${first.era}時代`}
                </Badge>
              </HStack>
              <Text fontSize="2xl" fontWeight="bold" color="white">
                {locale === "en" ? first.titleen : first.title}
                {locale === "ja" && first.edition && ` ${first.edition}`}
              </Text>
              <HStack mt={1} color="whiteAlpha.800" fontSize="sm">
                <ViewIcon />
                <Text>
                  {Number(first.pageView).toLocaleString()}
                  {locale === "ja" && "回鑑賞"}
                </Text>
              </HStack>
            </Box>
          </Box>
        </ChakraLink>
      </NextLink>

      {/* 2位・3位: 横並び */}
      {runners.length > 0 && (
        <Grid
          templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)" }}
          gap={4}
          width="100%"
        >
          {runners.map((item, idx) => {
            const rank = idx + 2;
            return (
              <NextLink href={`/${item.titleen}`} passHref key={rank}>
                <ChakraLink
                  textDecoration="none"
                  _hover={{ textDecoration: "none" }}
                >
                  <Box
                    position="relative"
                    borderRadius="xl"
                    overflow="hidden"
                    transition="all 0.3s"
                    _hover={{ boxShadow: "lg", transform: "scale(1.02)" }}
                  >
                    <Image
                      src={item.thumb}
                      alt={item.title}
                      objectFit="cover"
                      width="100%"
                      maxH="240px"
                    />
                    <Box
                      position="absolute"
                      bottom={0}
                      left={0}
                      right={0}
                      bgGradient="linear(to-t, blackAlpha.800, transparent)"
                      p={4}
                    >
                      <HStack spacing={2} mb={1}>
                        <Text
                          fontSize="xl"
                          fontWeight="bold"
                          color={medalColors[rank - 1]}
                        >
                          {locale === "en" ? `#${rank}` : `${rank}位`}
                        </Text>
                        <Badge
                          bg={eraColor(item.era) || "gray.500"}
                          color="white"
                          textTransform="none"
                          borderRadius="full"
                          px={2}
                          fontSize="xs"
                        >
                          {locale === "en"
                            ? `${item.eraen} period`
                            : `${item.era}時代`}
                        </Badge>
                      </HStack>
                      <Text fontSize="lg" fontWeight="bold" color="white">
                        {locale === "en" ? item.titleen : item.title}
                        {locale === "ja" && item.edition && ` ${item.edition}`}
                      </Text>
                      <HStack mt={1} color="whiteAlpha.800" fontSize="xs">
                        <ViewIcon />
                        <Text>
                          {Number(item.pageView).toLocaleString()}
                          {locale === "ja" && "回鑑賞"}
                        </Text>
                      </HStack>
                    </Box>
                  </Box>
                </ChakraLink>
              </NextLink>
            );
          })}
        </Grid>
      )}
    </VStack>
  );
}

/* ─── 4位以降: プログレスバー付きリスト ─── */
function RankingList({ items, startRank, maxPageView, locale }) {
  return (
    <VStack spacing={3} align="stretch">
      {items.map((item, idx) => {
        const rank = startRank + idx;
        const ratio = maxPageView > 0 ? (item.pageView / maxPageView) * 100 : 0;
        return (
          <NextLink href={`/${item.titleen}`} passHref key={rank}>
            <ChakraLink
              textDecoration="none"
              _hover={{ textDecoration: "none" }}
            >
              <Flex
                align="center"
                gap={3}
                p={3}
                borderRadius="lg"
                transition="all 0.2s"
                _hover={{ bg: "gray.50", boxShadow: "sm" }}
              >
                {/* 順位 */}
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color="gray.400"
                  minW="2.5rem"
                  textAlign="center"
                >
                  {rank}
                </Text>
                {/* サムネイル */}
                <Image
                  src={item.thumb}
                  alt={item.title}
                  objectFit="cover"
                  borderRadius="md"
                  width="80px"
                  height="50px"
                  flexShrink={0}
                />
                {/* タイトル + バー */}
                <Box flex={1} minW={0}>
                  <Flex align="center" gap={2} mb={1}>
                    <Text
                      fontSize="sm"
                      fontWeight="600"
                      noOfLines={1}
                    >
                      {locale === "en" ? item.titleen : item.title}
                      {locale === "ja" && item.edition && ` ${item.edition}`}
                    </Text>
                    <Badge
                      bg={eraColor(item.era) || "gray.200"}
                      color={eraColor(item.era) ? "white" : "gray.600"}
                      textTransform="none"
                      borderRadius="full"
                      px={2}
                      fontSize="0.6rem"
                      flexShrink={0}
                    >
                      {locale === "en"
                        ? `${item.eraen}`
                        : `${item.era}`}
                    </Badge>
                  </Flex>
                  {/* プログレスバー */}
                  <Flex align="center" gap={2}>
                    <Box
                      flex={1}
                      h="6px"
                      bg="gray.100"
                      borderRadius="full"
                      overflow="hidden"
                    >
                      <Box
                        h="100%"
                        w={`${ratio}%`}
                        bg="linear-gradient(90deg, #daa520, #b8860b)"
                        borderRadius="full"
                        transition="width 0.6s ease"
                      />
                    </Box>
                    <HStack spacing={1} color="gray.400" fontSize="xs" flexShrink={0}>
                      <ViewIcon boxSize={3} />
                      <Text>{Number(item.pageView).toLocaleString()}</Text>
                    </HStack>
                  </Flex>
                </Box>
              </Flex>
            </ChakraLink>
          </NextLink>
        );
      })}
    </VStack>
  );
}

/* ─── メインコンポーネント ─── */
export default function RankingCard({ isCompact = false }) {
  const { locale } = useRouter();
  const { rankingData } = useContext(AppContext);
  const [selectedEra, setSelectedEra] = useState(null);

  // 時代一覧を抽出
  const eras = useMemo(() => {
    const set = new Set();
    rankingData.forEach((item) => {
      if (item.era) set.add(item.era);
    });
    return Array.from(set);
  }, [rankingData]);

  // フィルタ適用
  const filteredData = useMemo(() => {
    if (!selectedEra) return rankingData;
    return rankingData.filter((item) => item.era === selectedEra);
  }, [rankingData, selectedEra]);

  // isCompact: RecommendEmaki 用の既存レイアウト
  if (isCompact) {
    return <CompactList data={rankingData.slice(0, 6)} locale={locale} />;
  }

  const maxPageView =
    filteredData.length > 0 ? Number(filteredData[0].pageView) : 0;

  return (
    <Box maxWidth="4xl" margin="auto">
      {/* 時代フィルタ */}
      <Wrap spacing={2} mb={8} justify="center">
        <WrapItem>
          <Tag
            size="lg"
            variant={selectedEra === null ? "solid" : "outline"}
            colorScheme="gray"
            cursor="pointer"
            onClick={() => setSelectedEra(null)}
            borderRadius="full"
          >
            {locale === "en" ? "All" : "すべて"}
          </Tag>
        </WrapItem>
        {eras.map((era) => {
          const color = eraColor(era);
          const isActive = selectedEra === era;
          return (
            <WrapItem key={era}>
              <Tag
                size="lg"
                cursor="pointer"
                onClick={() => setSelectedEra(era)}
                borderRadius="full"
                bg={isActive ? color || "gray.600" : "transparent"}
                color={isActive ? "white" : color || "gray.600"}
                border="1px solid"
                borderColor={color || "gray.300"}
                transition="all 0.2s"
                _hover={{
                  bg: color || "gray.600",
                  color: "white",
                }}
              >
                {locale === "en" ? `${era}` : `${era}時代`}
              </Tag>
            </WrapItem>
          );
        })}
      </Wrap>

      {filteredData.length === 0 ? (
        <Text textAlign="center" color="gray.400" py={10}>
          {locale === "en" ? "No data" : "データがありません"}
        </Text>
      ) : (
        <>
          {/* トップ3 ヒーロー */}
          <Top3Hero items={filteredData.slice(0, 3)} locale={locale} />

          {/* 4位以降: プログレスバー付きリスト */}
          {filteredData.length > 3 && (
            <RankingList
              items={filteredData.slice(3)}
              startRank={4}
              maxPageView={maxPageView}
              locale={locale}
            />
          )}
        </>
      )}
    </Box>
  );
}

/* ─── Compact表示 (RecommendEmaki 用) ─── */
function CompactList({ data, locale }) {
  return (
    <Box maxWidth="4xl" margin="auto">
      <Stack direction="column" align="stretch" rowGap="2">
        {data.map((item, i) => {
          const { title, titleen, thumb, type, typeen, era, eraen, edition, pageView } =
            item;
          return (
            <NextLink href={`/${titleen}`} passHref key={i}>
              <ChakraLink
                textDecoration="none"
                _hover={{ textDecoration: "none" }}
                flex="1"
              >
                <Box
                  borderWidth={1}
                  borderRadius="lg"
                  overflow="hidden"
                  transition="all 0.3s"
                  _hover={{ boxShadow: "lg" }}
                >
                  <Flex direction="row">
                    <Box position="relative" width="150px">
                      <Badge
                        position="absolute"
                        top={2}
                        left={2}
                        zIndex={1}
                        colorScheme={
                          i + 1 === 1
                            ? "red"
                            : i + 1 === 2
                            ? "orange"
                            : "yellow"
                        }
                        fontSize="sm"
                        fontWeight="bold"
                        paddingX={1}
                        paddingY={0.5}
                      >
                        {i + 1}位
                      </Badge>
                      <Image
                        src={thumb}
                        alt={title}
                        objectFit="cover"
                        width="100%"
                        height="auto"
                      />
                    </Box>
                    <Box p={2} flex={1}>
                      <VStack align="start" spacing={1}>
                        <HStack>
                          <Badge
                            variant="outline"
                            textTransform="none"
                            borderRadius={10}
                          >
                            {locale === "en" ? typeen : type}
                          </Badge>
                          <Badge
                            variant="outline"
                            textTransform="none"
                            borderRadius={10}
                          >
                            {locale === "en"
                              ? `${eraen} period`
                              : `${era}時代`}
                          </Badge>
                        </HStack>
                        <Text fontSize="md" fontWeight="bold">
                          {locale === "en" ? titleen : title}
                          {locale === "ja" && edition}
                        </Text>
                      </VStack>
                      <HStack marginTop={2} color="gray.500" fontSize="sm">
                        <ViewIcon />
                        <Text>{Number(pageView).toLocaleString()}回鑑賞</Text>
                      </HStack>
                    </Box>
                  </Flex>
                </Box>
              </ChakraLink>
            </NextLink>
          );
        })}
      </Stack>
      <Box marginTop={6} textAlign="right">
        <NextLink href="/ranking" passHref>
          <Button
            as={ChakraLink}
            rightIcon={<ArrowForwardIcon />}
            borderRadius="md"
            borderWidth="1px"
            fontSize="small"
          >
            {locale === "en"
              ? "View All Emaki Rankings"
              : "全ての絵巻ランキングを見る"}
          </Button>
        </NextLink>
      </Box>
    </Box>
  );
}
