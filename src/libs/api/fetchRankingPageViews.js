import { BetaAnalyticsDataClient } from "@google-analytics/data";

/**
 * Fetch page-view counts from GA4, aggregated by emaki slug (locale-agnostic).
 * @returns {Promise<{ pathName: string, pageView: number }[]>}
 */
export async function fetchRankingPageViews() {
  const propertyId = process.env.GOOGLE_APPLICATION_PROPERTY_ID;
  const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;

  if (!credentialsBase64 || !propertyId) {
    return [];
  }

  const credentials = JSON.parse(
    Buffer.from(credentialsBase64, "base64").toString("ascii")
  );
  const analyticsDataClient = new BetaAnalyticsDataClient({ credentials });

  const [response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "2024-01-01", endDate: "today" }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
  });

  const pvMap = {};
  (response.rows || []).forEach((row) => {
    const pagePath = row.dimensionValues[0].value;
    const pathName = pagePath.replace(/^\/(ja\/)?/, "");
    if (!pathName) return;
    const pv = Number(row.metricValues[0].value) || 0;
    pvMap[pathName] = (pvMap[pathName] || 0) + pv;
  });

  return Object.entries(pvMap)
    .map(([pathName, pageView]) => ({ pathName, pageView }))
    .sort((a, b) => b.pageView - a.pageView);
}
