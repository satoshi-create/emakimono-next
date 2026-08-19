/** Stale /_next/data/{oldBuildId} — empty 404 so ISR /en/404 is not read. */
export default function handler(_req, res) {
  res.setHeader("Cache-Control", "no-store, must-revalidate");
  res.status(404).end();
}
