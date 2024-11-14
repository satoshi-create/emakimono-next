
import { BetaAnalyticsDataClient } from "@google-analytics/data";

const propertyId = process.env.GOOGLE_APPLICATION_PROPERTY_ID;

export default async function handler(req, res) {
  try {
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, "base64").toString(
      "ascii"
    )
  );
    const analyticsDataClient = new BetaAnalyticsDataClient({credentials});

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,

      dateRanges: [
        {
          startDate: "30daysAgo", //取得したい期間を設定
          endDate: "today",
        },
      ],
      dimensions: [
        {
          name: "pagePath",
        },
      ],
      metrics: [
        {
          name: "screenPageViews", // PV数を取得
        },
      ],
    });

    const rankingData = response.rows.map((row) => ({
      pagePath: row.dimensionValues[0].value,
      uniquePageviews: row.metricValues[0].value,
    }));

    res.status(200).json(rankingData);
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
}
