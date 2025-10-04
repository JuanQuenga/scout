export interface Bookmark {
  id: string;
  title: string;
  url: string;
  dateAdded?: number;
}

/**
 * Recursively traverse bookmark tree and collect all bookmarks
 */
function traverseBookmarks(
  nodes: chrome.bookmarks.BookmarkTreeNode[]
): Bookmark[] {
  const bookmarks: Bookmark[] = [];

  for (const node of nodes) {
    // If it's a bookmark (has url), add it
    if (node.url) {
      bookmarks.push({
        id: node.id,
        title: node.title || "Untitled",
        url: node.url,
        dateAdded: node.dateAdded,
      });
    }

    // Recursively process children (folders)
    if (node.children) {
      bookmarks.push(...traverseBookmarks(node.children));
    }
  }

  return bookmarks;
}

/**
 * Get all bookmarks from Chrome
 */
export async function getAllBookmarks(): Promise<Bookmark[]> {
  return new Promise((resolve) => {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      if (chrome.runtime.lastError) {
        console.error(
          "[Bookmarks] Error getting bookmarks:",
          chrome.runtime.lastError
        );
        resolve([]);
        return;
      }

      const bookmarks = traverseBookmarks(bookmarkTreeNodes);

      // Sort by date added (most recent first)
      bookmarks.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));

      console.log("[Bookmarks] Found bookmarks:", bookmarks.length);
      resolve(bookmarks);
    });
  });
}

/**
 * Filter bookmarks by search query
 */
export function filterBookmarks(
  bookmarks: Bookmark[],
  query: string
): Bookmark[] {
  if (!query.trim()) return bookmarks;

  const lowerQuery = query.toLowerCase();
  return bookmarks.filter((bookmark) => {
    const title = bookmark.title?.toLowerCase() || "";
    const url = bookmark.url?.toLowerCase() || "";

    return title.includes(lowerQuery) || url.includes(lowerQuery);
  });
}
