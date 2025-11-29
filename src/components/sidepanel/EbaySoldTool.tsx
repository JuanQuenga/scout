import React, { useState, useEffect, useRef } from "react";
import SidepanelLayout from "./SidepanelLayout";
import { MousePointerClick, RefreshCcw, X, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";

interface EbayListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  date: string;
  image: string;
  url: string;
}

export default function EbaySoldTool() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    sold: true,
    complete: true,
    bin: false,
    auction: false,
    conditionUsed: false,
    conditionNew: false,
  });
  
  const [isSelecting, setIsSelecting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedListing, setSavedListing] = useState<EbayListing | null>(null);
  const isFirstRender = useRef(true);

  // Load saved listing on mount
  useEffect(() => {
    const saved = localStorage.getItem("scout_saved_ebay_listing");
    if (saved) {
      try {
        setSavedListing(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved listing", e);
      }
    }

    const handleMessage = (message: any) => {
      if (message.type === "EBAY_LISTING_SELECTED" && message.data) {
        setSavedListing(message.data);
        localStorage.setItem("scout_saved_ebay_listing", JSON.stringify(message.data));
        setIsSelecting(false);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  // Auto-update tab when filters change
  useEffect(() => {
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
    
    if (filters.conditionUsed && !filters.conditionNew) params.append("LH_ItemCondition", "3000");
    if (filters.conditionNew && !filters.conditionUsed) params.append("LH_ItemCondition", "1000");

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

  const enableSelectionMode = async () => {
    setIsSelecting(true);
    setError(null);
    try {
      const tabId = await findEbayTabId();
      await chrome.scripting.executeScript({
        target: { tabId },
        func: injectSelectionScript,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to enable selection mode");
      setIsSelecting(false);
    }
  };

  // This function is injected into the page
  const injectSelectionScript = () => {
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
          element.querySelector(".s-item__ended-date") ||
          element.querySelector(".s-card__caption .positive");

        if (!soldDateElement) return null;
        const text = soldDateElement.textContent?.trim();
        if (!text) return null;
        return text.replace("Sold", "").trim();
      } catch {
        return null;
      }
    };

    const styleId = "scout-ebay-select-style";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            .scout-selectable-listing {
                cursor: copy !important;
            }
            .scout-selectable-listing:hover {
                outline: 3px solid #22c55e !important;
                box-shadow: 0 0 15px rgba(34, 197, 94, 0.3) !important;
                z-index: 1000 !important;
                position: relative !important;
                background-color: rgba(34, 197, 94, 0.05) !important;
            }
            .scout-selectable-listing:hover::after {
                content: "Click to Save";
                position: absolute;
                top: 0;
                right: 0;
                background: #22c55e;
                color: white;
                padding: 4px 8px;
                font-size: 12px;
                font-weight: bold;
                z-index: 1001;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);
    }

    const getListings = () => {
         const mainResultsContainer = 
            document.querySelector("ul.srp-results") || 
            document.querySelector(".srp-river-results") || 
            document.querySelector("#srp-river-results") ||
            document.querySelector(".srp-results");
            
         if (!mainResultsContainer) return [];
         
         return [
             ...Array.from(mainResultsContainer.querySelectorAll("li.s-item")),
             ...Array.from(mainResultsContainer.querySelectorAll("div.s-item")),
             ...Array.from(mainResultsContainer.querySelectorAll("li.s-card")),
             ...Array.from(mainResultsContainer.querySelectorAll("div.s-card"))
         ];
    };

    const listings = getListings();
    if (!listings.length) {
        alert("No listings found to select.");
        return;
    }

    const cleanup = () => {
        listings.forEach((li) => {
            li.classList.remove("scout-selectable-listing");
            li.removeEventListener("click", handleClick as any, true);
        });
        const style = document.getElementById(styleId);
        if (style) style.remove();
    };

    const handleClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const item = e.currentTarget as HTMLElement;
        
        const titleEl = item.querySelector(".s-item__title") || item.querySelector(".s-card__title");
        const priceEl = item.querySelector(".s-item__price") || item.querySelector(".s-card__price");
        const linkEl = (item.querySelector(".s-item__link") || item.querySelector(".s-card__link")) as HTMLAnchorElement;
        const imgEl = (item.querySelector(".s-item__image-img") || item.querySelector(".s-card__image")) as HTMLImageElement;

        if (titleEl && priceEl) {
             const priceText = priceEl.textContent?.trim() || "";
             const price = parsePrice(priceText);
             const currency = detectCurrencyPrefix(priceText);

             if (price !== null) {
                const data = {
                    id: item.getAttribute("data-listingid") || Math.random().toString(),
                    title: titleEl.textContent?.trim() || "Unknown",
                    price,
                    currency,
                    date: parseSoldDate(item) || "",
                    url: linkEl?.href || "",
                    image: imgEl?.src || "",
                };
                
                chrome.runtime.sendMessage({ type: "EBAY_LISTING_SELECTED", data });
             }
        }

        cleanup();
    };

    listings.forEach((li) => {
        li.classList.add("scout-selectable-listing");
        li.addEventListener("click", handleClick as any, true);
    });
  };

  const clearSavedListing = () => {
      setSavedListing(null);
      localStorage.removeItem("scout_saved_ebay_listing");
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
           <Badge 
             variant={filters.conditionUsed ? "default" : "outline"} 
             className="cursor-pointer select-none"
             onClick={() => toggleFilter("conditionUsed")}
           >
             Used (3000)
           </Badge>
           <Badge 
             variant={filters.conditionNew ? "default" : "outline"} 
             className="cursor-pointer select-none"
             onClick={() => toggleFilter("conditionNew")}
           >
             New (1000)
           </Badge>
        </div>

        <Button 
          variant={isSelecting ? "destructive" : "secondary"}
          className="w-full" 
          onClick={enableSelectionMode}
          disabled={isSelecting && !error}
        >
          {isSelecting ? (
            <>
                Selecting... Click a listing on eBay
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            </>
          ) : (
            <>
                Select Listing To Save
                <MousePointerClick className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        {error && <div className="text-xs text-destructive">{error}</div>}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {savedListing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Saved Listing</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSavedListing}
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
                <div className="h-24 w-24 flex-shrink-0 rounded bg-muted overflow-hidden relative">
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
                  {savedListing.date && (
                      <div className="text-xs text-muted-foreground mt-1">
                          Sold: {savedListing.date}
                      </div>
                  )}
                </div>
              </Card>
            </a>

            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              <p>This listing is saved to your browser storage. You can close the sidepanel and come back to it later.</p>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8 text-sm space-y-2">
            <div className="flex justify-center mb-2">
                <MousePointerClick className="h-10 w-10 opacity-20" />
            </div>
            <p>No listing saved.</p>
            <p>Click <strong>Select Listing To Save</strong> and click on any result on the eBay page.</p>
          </div>
        )}
      </div>
    </SidepanelLayout>
  );
}
