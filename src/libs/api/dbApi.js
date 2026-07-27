import { isDbConfigured } from "@/db";

/**
 * @param {import('next').NextApiResponse} res
 * @returns {boolean}
 */
export function ensureDbConfigured(res) {
  if (!isDbConfigured()) {
    res.status(503).json({ message: "Database is not configured" });
    return false;
  }
  return true;
}

/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 * @param {string} method
 * @returns {boolean}
 */
export function ensureMethod(req, res, method) {
  if (req.method !== method) {
    res.setHeader("Allow", [method]);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    return false;
  }
  return true;
}
