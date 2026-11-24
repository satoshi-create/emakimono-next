const HUBS_COMMENT_RE = /<!--\s*hubs:\s*([\s\S]*?)\s*-->/gi;

/**
 * @param {string | undefined | null} description
 * @returns {string[]}
 */
export function extractHubSlugsFromBoardDescription(description) {
  if (typeof description !== "string" || !description) {
    return [];
  }

  const seen = new Set();
  const result = [];

  let match;
  HUBS_COMMENT_RE.lastIndex = 0;
  while ((match = HUBS_COMMENT_RE.exec(description)) !== null) {
    const segment = match[1];
    if (!segment) continue;
    for (const part of segment.split(",")) {
      const slug = part.trim();
      if (slug && !seen.has(slug)) {
        seen.add(slug);
        result.push(slug);
      }
    }
  }

  return result;
}

/**
 * @param {Array<{ id?: string, title?: string, description?: string, itemCount?: number }>} boards
 * @param {string} targetSlug
 * @returns {typeof boards}
 */
export function filterBoardsForHubSlug(boards, targetSlug) {
  if (!Array.isArray(boards) || typeof targetSlug !== "string") {
    return [];
  }
  const normalized = targetSlug.trim();
  if (!normalized) {
    return [];
  }

  return boards.filter((board) => {
    const slugs = extractHubSlugsFromBoardDescription(board?.description);
    return slugs.includes(normalized);
  });
}