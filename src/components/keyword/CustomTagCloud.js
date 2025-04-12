import { useState } from "react";
import { TagCloud } from "react-tagcloud";
// import { useRouter } from 'next/router';
import { ArrowForwardIcon } from "@chakra-ui/icons";
import { Box, Button, Link as ChakraLink } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";

const CustomTagCloud = ({ tags, emakiPage }) => {
  const { locale } = useRouter();
  const [hoveredTag, setHoveredTag] = useState(null);

  // 日本の伝統色のパレット
  const traditionalColors = [
    "#6A4C32", // 茶色 (Cha-iro)
    "#A69E92", // 鳩羽色 (Hatoba-iro)
    "#8D742A", // 黄唐茶 (Kigaracha)
    "#D8A373", // 柴色 (Shiba-iro)
    "#8A5A44", // 焦茶 (Kogecha)
    "#B79B5B", // 利休白茶 (Rikyu-shiracha)
  ];

  //   const handleTagClick = (slug) => {
  //     // タグをクリックしたときに遷移
  //         if (!slug) {
  //           console.error("Slug is undefined.");

  //           return;
  //         }
  //   router.push(`/keyword/${slug}`); // タグ一覧ページのパスを指定
  // };

  // const handleTagClick = (tag) => {
  //   console.log(`Tag clicked: ${tag.name}`); // デバッグ用のコンソールログ
  //   alert(`'${tag.name}' was selected!  Total: ${tag.total}`);
  // };

  // カスタムフォントサイズ計算
  const calculateFontSize = (total, minTotal, maxTotal, minSize, maxSize) => {
    const sizeRange = maxSize - minSize;
    const totalRange = maxTotal - minTotal;
    return ((total - minTotal) / totalRange) * sizeRange + minSize;
  };

  // 各タグに対して固定の色を割り当てる
  const assignColorsToTags = (tags) => {
    return tags.map((tag) => ({
      ...tag,
      color:
        traditionalColors[Math.floor(Math.random() * traditionalColors.length)],
    }));
  };

  // 初期化: タグに色を固定
  const tagsWithColors = assignColorsToTags(tags);

  // const getColorWithShade = (size, maxSize) => {
  //   const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
  //   const opacity = size / maxSize; // フォントサイズに応じた透明度

  //   // 16進数カラーをRGBA形式に変換
  //   const r = parseInt(color.slice(1, 3), 16);
  //   const g = parseInt(color.slice(3, 5), 16);
  //   const b = parseInt(color.slice(5, 7), 16);

  //   console.log(
  //     `Selected Color: ${color}, RGBA: rgba(${r}, ${g}, ${b}, ${opacity.toFixed(
  //       2
  //     )})`
  //   ); // デバッグ
  //   return `rgba(${r}, ${g}, ${b}, ${opacity.toFixed(2)})`;
  // };

  // 色を取得（明度と彩度を調整）
  const getColorWithShade = () => {
    const color =
      traditionalColors[Math.floor(Math.random() * traditionalColors.length)];
    return color; // 直接色を適用（明度と彩度は元の色で調整済み）
  };

  // const getColorFromPalette = () => {
  //   return colorPalette[Math.floor(Math.random() * colorPalette.length)];
  // };

  // console.log(getColorWithShade(30, 50)); // デバッグ

  // タグの最大・最小値を計算
  const minTotal = Math.min(...tags.map((tag) => tag.total));
  const maxTotal = Math.max(...tags.map((tag) => tag.total));

  const customRenderer = (tag) => {
    const isHovered = hoveredTag === tag.name; // ホバー中のタグを確認
    const fontSize = calculateFontSize(tag.total, minTotal, maxTotal, 30, 100); // サイズ範囲 20~50
    const fontSizeEmakiPage = calculateFontSize(
      tag.total,
      minTotal,
      maxTotal,
      20,
      50
    ); // サイズ範囲 20~50

    return (
      <Link href={`/keyword/${tag.slug}`} key={tag.name}>
        <a
          key={tag.name}
          onMouseEnter={() => setHoveredTag(tag.name)}
          onMouseLeave={() => setHoveredTag(null)}
          // onClick={() => handleTagClick(tag.slug)} // クリック時に遷移処理
          style={{
            fontFamily: "RocknRoll One, serif",
            fontSize: `${emakiPage ? fontSizeEmakiPage : fontSize}px`,
            color: isHovered
              ? "#D8A373" // ホバー中の色
              : tag.color,
            margin: "5px",
            textDecoration: isHovered ? "underline" : "none", // ホバー中に下線
            transition: "color 0.3s, text-decoration 0.3s", // スムーズなアニメーション
            cursor: "pointer", // ポインターを表示
            margin: "5px",
          }}
        >
          {locale === "en" ? tag.id : tag.name}
        </a>
      </Link>
    );
  };

  return (
    <>
      <TagCloud
        tags={tagsWithColors}
        minSize={20}
        maxSize={50}
        renderer={customRenderer}
      />
      {emakiPage && (
        <Box marginTop={6} textAlign="right">
          <Link href={`keyword/keywordlist`}>
            <ChakraLink textDecoration="none">
              <Button
                rightIcon={<ArrowForwardIcon />}
                fontSize="sm"
                color="rgb(114 114 114)"
                fontWeight="normal"
                fontStyle="italic"
                variant="ghost"
                _hover={{
                  opacity: 0.6,
                  transform: "translateX(5px)",
                  transition: "all 0.2s",
                }}
              >
                {locale == "en" ? "View All Keywords	" : "キーワード一覧を見る"}
              </Button>
            </ChakraLink>
          </Link>
        </Box>
      )}
    </>
  );
};

export default CustomTagCloud;
