import { fetchRankingPageViews } from "@/libs/api/fetchRankingPageViews";

export default async function handler(req, res) {
  if (!process.env.GOOGLE_CREDENTIALS_BASE64 || !process.env.GOOGLE_APPLICATION_PROPERTY_ID) {
    return res.status(500).json({
      statusCode: 500,
      message: "GA4 environment variables are not configured",
    });
  }

  try {
    const pageViews = await fetchRankingPageViews();
    const rankingData = pageViews.map(({ pathName, pageView }) => ({
      pagePath: `/${pathName}`,
      uniquePageviews: String(pageView),
    }));
    res.status(200).json(rankingData);
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
}
