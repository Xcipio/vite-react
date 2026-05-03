const OWNED_COMMENTS_STORAGE_KEY = "owned-comments";

export function readOwnedCommentsMap() {
  const stored = window.localStorage.getItem(OWNED_COMMENTS_STORAGE_KEY);
  return stored ? (JSON.parse(stored) as Record<string, number[]>) : {};
}

export function saveOwnedCommentId(postSlug: string, commentId: number) {
  const nextMap = readOwnedCommentsMap();
  const existingIds = new Set(nextMap[postSlug] ?? []);
  existingIds.add(commentId);
  nextMap[postSlug] = Array.from(existingIds);
  window.localStorage.setItem(OWNED_COMMENTS_STORAGE_KEY, JSON.stringify(nextMap));
}

export function removeOwnedCommentId(postSlug: string, commentId: number) {
  const nextMap = readOwnedCommentsMap();
  nextMap[postSlug] = (nextMap[postSlug] ?? []).filter((id) => id !== commentId);
  window.localStorage.setItem(OWNED_COMMENTS_STORAGE_KEY, JSON.stringify(nextMap));
}
