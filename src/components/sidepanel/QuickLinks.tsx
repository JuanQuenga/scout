import React, { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  ExternalLink,
  RefreshCw,
  Search,
  Copy,
  X,
  LinkIcon,
} from "lucide-react";
import {
  fetchCSVLinks,
  filterCSVLinks,
  CSVLink,
  clearCSVCache,
} from "@/src/utils/csv-links";
import SidepanelLayout from "./SidepanelLayout";
import { cn } from "@/src/lib/utils";

export default function QuickLinks() {
  const [links, setLinks] = useState<CSVLink[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<CSVLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load CSV links on component mount
  useEffect(() => {
    loadLinks();
  }, []);

  // Filter links when search query changes
  useEffect(() => {
    const filtered = filterCSVLinks(links, searchQuery);
    setFilteredLinks(filtered);
  }, [links, searchQuery]);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const { links: csvLinks } = await fetchCSVLinks();
      setLinks(csvLinks);
    } catch (error) {
      console.error("Failed to load CSV links:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await clearCSVCache();
      const { links: csvLinks } = await fetchCSVLinks();
      setLinks(csvLinks);
    } catch (error) {
      console.error("Failed to refresh CSV links:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLinkClick = (link: CSVLink, e: React.MouseEvent) => {
    // Don't open if clicking copy button
    if ((e.target as HTMLElement).closest("[data-action]")) return;

    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url: link.url, active: true });
    } else {
      window.open(link.url, "_blank");
    }
  };

  const handleCopyUrl = (url: string, linkId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group FILTERED links by category for displaying
  const linksByCategory = filteredLinks.reduce((acc, link) => {
    const category = link.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(link);
    return acc;
  }, {} as Record<string, CSVLink[]>);

  // Filtered categories (for displaying)
  const sortedCategories = Object.keys(linksByCategory).sort((a, b) =>
    a.localeCompare(b)
  );

  // Sort links within each category alphabetically by title
  sortedCategories.forEach((category) => {
    linksByCategory[category].sort((a, b) => a.title.localeCompare(b.title));
  });

  const filteredCategories = sortedCategories.filter(
    (cat) => linksByCategory[cat].length > 0
  );

  return (
    <SidepanelLayout
      title="Quick Links"
      actions={
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {filteredLinks.length} links
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 w-8"
            title="Refresh links"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      }
      contentClassName="flex flex-col bg-muted/10"
    >
      <div className="sticky top-0 z-10 bg-background border-b border-border/50 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 bg-muted/40 border-muted-foreground/20 h-9 text-sm focus-visible:ring-offset-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-2 space-y-4 overflow-y-auto">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <RefreshCw className="h-8 w-8 animate-spin mb-2" />
            <p className="text-sm">Loading links...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredLinks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="bg-muted/50 p-3 rounded-full mb-3">
              <LinkIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">No links found</p>
            <p className="text-xs text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search query"
                : "No quick links available yet"}
            </p>
            {!searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="h-8"
              >
                Refresh
              </Button>
            )}
          </div>
        )}

        {/* Links by Category */}
        {!loading &&
          filteredCategories.map((category) => (
            <div key={category} className="space-y-2">
              <div className="px-2 flex items-center gap-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {category}
                </h3>
                <div className="h-px flex-1 bg-border/50" />
              </div>

              <div className="grid gap-1">
                {linksByCategory[category].map((link) => (
                  <div
                    key={link.id}
                    onClick={(e) => handleLinkClick(link, e)}
                    className="group relative flex items-center gap-3 p-2 rounded-md hover:bg-background hover:shadow-sm border border-transparent hover:border-border/50 cursor-pointer transition-all duration-200"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted/50 group-hover:bg-primary/10 transition-colors">
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {link.title}
                        </p>
                      </div>
                      {link.description ? (
                        <p className="text-xs text-muted-foreground truncate">
                          {link.description}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground/50 truncate">
                          {(() => {
                            try {
                              return new URL(link.url).hostname.replace(
                                "www.",
                                ""
                              );
                            } catch {
                              return link.url;
                            }
                          })()}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      data-action="copy"
                      onClick={(e) => handleCopyUrl(link.url, link.id, e)}
                      className={cn(
                        "h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100",
                        copiedId === link.id &&
                          "opacity-100 text-green-500 hover:text-green-600"
                      )}
                      title="Copy URL"
                    >
                      {copiedId === link.id ? (
                        <span className="font-bold text-xs">✓</span>
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </SidepanelLayout>
  );
}
