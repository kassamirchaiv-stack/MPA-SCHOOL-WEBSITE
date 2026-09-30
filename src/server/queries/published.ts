/**
 * Visibility rule shared by every public query: status PUBLISHED and a
 * publication date that is empty or already reached (scheduled publishing).
 * Call only inside a "use cache" scope that sets a finite cacheLife so
 * scheduled items appear without an admin action.
 */
export function publishedWhere() {
  return {
    status: "PUBLISHED" as const,
    OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
  };
}
