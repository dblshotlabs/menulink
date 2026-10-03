export function normalizeOrderedRecords(records = []) {
  return [...records]
    .filter(Boolean)
    .sort((a, b) => {
      const left = Number.isFinite(Number(a.sortOrder))
        ? Number(a.sortOrder)
        : Number.MAX_SAFE_INTEGER;
      const right = Number.isFinite(Number(b.sortOrder))
        ? Number(b.sortOrder)
        : Number.MAX_SAFE_INTEGER;

      if (left !== right) {
        return left - right;
      }

      return String(a.id || "").localeCompare(String(b.id || ""));
    })
    .map((record, index) => ({
      ...record,
      sortOrder: index,
    }));
}
