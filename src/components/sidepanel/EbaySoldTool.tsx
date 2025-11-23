import React, { useState } from "react";
import SidepanelLayout from "./SidepanelLayout";
import { Download, RefreshCcw, Check, X, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Card } from "../ui/card";

interface EbayListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  date: string;
  image: string;
  url: string;
  condition?: string;
}

interface EbayStats {
  average: number;
  median: number;
  low: number;
  high: number;
  count: number;
}

export default function EbaySoldTool() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    sold: true,
    complete: true,
    bin: false,
    auction: false,
    used: false,
    new: false,
  });
  const [results, setResults] = useState<EbayListing[]>([]);
  const [stats, setStats] = useState<EbayStats | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedListing, setSavedListing] = useState<EbayListing | null>(null);
  const isFirstRender = React.useRef(true);

  // Auto-update tab when filters change
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    handleSearch();
  }, [filters]);

  const findEbayTabId = async () => {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id && activeTab.url?.includes("ebay.")) {
      return activeTab.id;
    }

    const ebayTabs = await chrome.tabs.query({});
    const fallbackTab = ebayTabs.find(
      (tab) => tab.id !== undefined && tab.url?.includes("ebay.")
    );
    if (fallbackTab?.id) {
      return fallbackTab.id;
    }

    throw new Error("Open an eBay tab to control it from the sidepanel.");
  };

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const buildEbayUrl = () => {
    const baseUrl = "https://www.ebay.com/sch/i.html";
    const params = new URLSearchParams();
    
    if (query) params.append("_nkw", query);
    params.append("_sacat", "0"); // All Categories
    params.append("_from", "R40");
    params.append("_dmd", "2"); // View All?
    params.append("rt", "nc");
    
    if (filters.sold) params.append("LH_Sold", "1");
    if (filters.complete) params.append("LH_Complete", "1");
    
    if (filters.bin) params.append("LH_BIN", "1");
    if (filters.auction) params.append("LH_Auction", "1");
    
    if (filters.used && !filters.new) params.append("LH_ItemCondition", "4");
    if (filters.new && !filters.used) params.append("LH_ItemCondition", "3");
    // If both, maybe don't specify condition or specify both if eBay supports comma (usually multiple params or bitmask)
    // Simple implementation: prioritizing single selection or ignoring if both/neither.

    return `${baseUrl}?${params.toString()}`;
  };

  const handleSearch = async () => {
    setError(null);
    setIsNavigating(true);
    try {
      const url = buildEbayUrl();
      const tabId = await findEbayTabId();
      await chrome.tabs.update(tabId, { url });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update eBay tab");
    } finally {
      setIsNavigating(false);
    }
  };

  const extractListings = async () => {
    setIsExtracting(true);
    setError(null);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        throw new Error("No active tab found");
      }

      // Check if url matches ebay
      if (!tab.url?.includes("ebay.com")) {
        throw new Error("Active tab is not eBay");
      }

      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractEbayListingsFromPage,
      });

      const data = injectionResults[0]?.result;
      if (data && data.listings) {
        setResults(data.listings);
        setStats(data.stats);
      } else {
        throw new Error("No listings found on page");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to extract listings");
    } finally {
      setIsExtracting(false);
    }
  };

  // This function is injected into the page
  const extractEbayListingsFromPage = () => {
    const parsePrice = (text: string) => {
      if (!text) return null;
      let cleaned = text
        .replace(/\(.*?\)/g, "")
        .replace(/Approximately\s+/i, "")
        .replace(/About\s+/i, "")
        .trim();

      const rangeSplit = cleaned.split(/\bto\b|-/i);
      if (rangeSplit.length > 1) {
        cleaned = rangeSplit[0];
      }

      const match = cleaned.match(/[\d,.]+/);
      if (!match) return null;
      const numeric = parseFloat(match[0].replace(/,/g, ""));
      if (!Number.isFinite(numeric)) return null;
      return numeric;
    };

    const detectCurrencyPrefix = (text: string) => {
      if (!text) return "$";
      const symbolMatch = text.match(/[$\u00a3\u00a5\u20ac]/);
      if (symbolMatch) return symbolMatch[0];
      return "$";
    };

    const parseSoldDate = (element: Element) => {
      try {
        const soldDateElement =
          element.querySelector(".su-styled-text.positive") ||
          element.querySelector(".s-item__title--tagblock .POSITIVE") ||
          element.querySelector(".s-item__ended-date");

        if (!soldDateElement) return null;
        const text = soldDateElement.textContent?.trim();
        if (!text) return null;
        
        // Simplify date extraction
        return text.replace("Sold", "").trim();
      } catch {
        return null;
      }
    };

    const mainResultsContainer =
      document.querySelector("ul.srp-results.srp-grid") ||
      document.querySelector("#srp-river-results");

    if (!mainResultsContainer) return { listings: [], stats: null };

    const allListItems = Array.from(mainResultsContainer.children).filter(
      (child) => child.tagName === "LI"
    );

    const listings = [];
    let currencyPrefix = "$";

    for (const item of allListItems) {
       if (!item.hasAttribute("data-listingid")) {
          // Check for "fewer words" divider to stop
          if (item.textContent?.includes("Results matching fewer words")) break;
          continue;
       }

       const titleEl = item.querySelector(".s-item__title");
       const priceEl = item.querySelector(".s-item__price");
       const linkEl = item.querySelector(".s-item__link") as HTMLAnchorElement;
       const imgEl = item.querySelector(".s-item__image-img") as HTMLImageElement;
       
       if (!titleEl || !priceEl) continue;

       const priceText = priceEl.textContent?.trim() || "";
       const price = parsePrice(priceText);
       if (price === null) continue;

       if (!currencyPrefix) currencyPrefix = detectCurrencyPrefix(priceText);

       listings.push({
         id: item.getAttribute("data-listingid") || Math.random().toString(),
         title: titleEl.textContent?.trim() || "Unknown",
         price,
         currency: currencyPrefix,
         date: parseSoldDate(item) || "",
         url: linkEl?.href || "",
         image: imgEl?.src || "",
       });
    }

    // Calculate stats
    if (listings.length === 0) return { listings: [], stats: null };

    const prices = listings.map(l => l.price).sort((a, b) => a - b);
    const total = prices.reduce((a, b) => a + b, 0);
    const count = prices.length;
    const average = total / count;
    const median = count % 2 === 0 
      ? (prices[count / 2 - 1] + prices[count / 2]) / 2 
      : prices[(count - 1) / 2];
    
    return {
      listings,
      stats: {
        average,
        median,
        low: prices[0],
        high: prices[prices.length - 1],
        count
      }
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <SidepanelLayout className="h-full flex flex-col">
      <div className="p-4 space-y-4 border-b">
        <div className="flex gap-2">
          <Input
            placeholder="Search keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
          <Button
            onClick={handleSearch}
            disabled={isNavigating}
            className="min-w-[140px]"
            title="Update the active eBay tab"
          >
            {isNavigating ? "Updating..." : "Update Tab"}
            {!isNavigating && <RefreshCcw className="ml-2 h-4 w-4" />}
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
           <Badge 
             variant={filters.sold ? "default" : "outline"} 
             className="cursor-pointer select-none"
             onClick={() => toggleFilter("sold")}
           >
             Sold
           </Badge>
           <Badge 
             variant={filters.complete ? "default" : "outline"} 
             className="cursor-pointer select-none"
             onClick={() => toggleFilter("complete")}
           >
             Completed
           </Badge>
           <Badge 
             variant={filters.bin ? "default" : "outline"} 
             className="cursor-pointer select-none"
             onClick={() => toggleFilter("bin")}
           >
             Buy It Now
           </Badge>
           <Badge 
             variant={filters.auction ? "default" : "outline"} 
             className="cursor-pointer select-none"
             onClick={() => toggleFilter("auction")}
           >
             Auction
           </Badge>
        </div>

        <Button 
          variant="secondary" 
          className="w-full" 
          onClick={extractListings}
          disabled={isExtracting}
        >
          {isExtracting ? "Extracting..." : "Extract from Current Page"}
          {!isExtracting && <Download className="ml-2 h-4 w-4" />}
        </Button>

        {error && <div className="text-xs text-destructive">{error}</div>}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Saved Listing View */}
        {savedListing ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Saved Listing</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSavedListing(null)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
            
            <a 
              href={savedListing.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block group"
            >
              <Card className="p-4 flex gap-4 hover:border-primary transition-colors border-2">
                <div className="h-24 w-24 flex-shrink-0 rounded bg-muted overflow-hidden">
                  {savedListing.image ? (
                    <img src={savedListing.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">No Img</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="font-medium text-base line-clamp-2 group-hover:text-primary transition-colors">
                    {savedListing.title}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold text-xl text-green-600 dark:text-green-500">
                      {savedListing.currency}{savedListing.price.toFixed(2)}
                    </span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            </a>

            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              <p>Click the card above to view the saved listing in a new tab.</p>
            </div>
          </div>
        ) : (
          <>
            {stats && (
              <div className="p-4 bg-muted/30 grid grid-cols-2 gap-2 text-sm border-b">
                <div>
                  <div className="text-muted-foreground">Average</div>
                  <div className="font-semibold">{formatCurrency(stats.average)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Median</div>
                  <div className="font-semibold">{formatCurrency(stats.median)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Range</div>
                  <div className="font-semibold">{formatCurrency(stats.low)} - {formatCurrency(stats.high)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Count</div>
                  <div className="font-semibold">{stats.count} items</div>
                </div>
              </div>
            )}

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {results.length > 0 ? "Select a match to save:" : ""}
                  </h4>
                </div>
                {results.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSavedListing(item)}
                    className="block cursor-pointer group"
                  >
                    <Card className="p-3 flex gap-3 hover:bg-muted/50 hover:border-primary/50 transition-all">
                      <div className="h-16 w-16 flex-shrink-0 rounded bg-muted overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">No Img</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </div>
                        <div className="mt-1 flex items-center justify-between text-sm">
                          <span className="font-bold text-green-600 dark:text-green-500">
                            {item.currency}{item.price.toFixed(2)}
                          </span>
                          <span className="text-muted-foreground text-xs flex items-center">
                            Select <Check className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100" />
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
                {results.length === 0 && !isExtracting && (
                  <div className="text-center text-muted-foreground py-8 text-sm">
                    No results extracted. Open an eBay sold listings page and click Extract.
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </div>
    </SidepanelLayout>
  );
}

