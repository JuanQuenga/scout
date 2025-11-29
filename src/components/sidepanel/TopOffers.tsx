"use client";

import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Check, Calculator, Save, RotateCcw, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Label } from "../ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import SidepanelLayout from "./SidepanelLayout";

interface SavedTopOffer {
  id: string;
  name: string;
  timestamp: number;
  projectionAmount: string;
}

// Helper function to implement FLOOR functionality
function floorToMultiple(value: number, multiple: number): number {
  return Math.floor(value / multiple) * multiple;
}

// Helper function to format numbers with commas
function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// Top Offer calculation logic
function calculateTopOffer(projection: number): number {
  if (projection < 50) {
    return floorToMultiple(projection * 0.2, 5);
  } else if (projection < 100) {
    return floorToMultiple(projection * 0.3, 5);
  } else if (projection < 250) {
    return floorToMultiple(projection * 0.4, 5);
  } else if (projection < 500) {
    return floorToMultiple(projection * 0.5, 5);
  } else if (projection < 750) {
    return floorToMultiple(projection * 0.55, 5);
  } else {
    return floorToMultiple(projection * 0.65, 5);
  }
}

// Premium Top Offer calculation logic
function calculateTopOfferPremium(projection: number): number {
  if (projection < 50) {
    return floorToMultiple(projection * 0.2, 5);
  } else if (projection < 100) {
    return floorToMultiple(projection * 0.3, 5);
  } else if (projection < 200) {
    return floorToMultiple(projection * 0.4, 5);
  } else if (projection < 250) {
    return floorToMultiple(projection * 0.5, 5);
  } else if (projection < 500) {
    return floorToMultiple(projection * 0.6, 5);
  } else if (projection < 750) {
    return floorToMultiple(projection * 0.65, 5);
  } else {
    return floorToMultiple(projection * 0.75, 5);
  }
}

// Top Offer Calculator Component
function TopOfferCalculator() {
  const [projectionAmount, setProjectionAmount] = useState("");
  const [results, setResults] = useState({
    topOffer: 0,
    topOfferPremium: 0,
    topOfferCheckout: 0,
  });
  const [copied, setCopied] = useState<string | null>(null);
  
  // Saved functionality state
  const [savedOffers, setSavedOffers] = useState<SavedTopOffer[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  // Load saved offers from storage on mount
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["scout_top_offers"], (result) => {
        if (result.scout_top_offers) {
          setSavedOffers(result.scout_top_offers);
        }
      });
    }
  }, []);

  const saveOffer = () => {
    if (!saveName.trim()) return;

    const newOffer: SavedTopOffer = {
      id: Date.now().toString(),
      name: saveName.trim(),
      timestamp: Date.now(),
      projectionAmount,
    };

    const updatedOffers = [...savedOffers, newOffer];
    setSavedOffers(updatedOffers);

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ scout_top_offers: updatedOffers });
    }

    setSaveName("");
    setSaveDialogOpen(false);
  };

  const loadOffer = (offer: SavedTopOffer) => {
    handleProjectionChange(offer.projectionAmount);
  };

  const deleteOffer = (id: string) => {
    const updatedOffers = savedOffers.filter((o) => o.id !== id);
    setSavedOffers(updatedOffers);

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ scout_top_offers: updatedOffers });
    }
  };

  const clearCurrent = () => {
    setProjectionAmount("");
    setResults({
      topOffer: 0,
      topOfferPremium: 0,
      topOfferCheckout: 0,
    });
  };

  const handleCopy = (amount: number, id: string) => {
    navigator.clipboard.writeText(amount.toString());
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleProjectionChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.-]/g, "");
    setProjectionAmount(numericValue);

    // Auto-calculate when input changes
    const projection = parseFloat(numericValue) || 0;
    const topOffer = calculateTopOffer(projection);
    const topOfferPremium = calculateTopOfferPremium(projection);
    const topOfferCheckout = floorToMultiple(projection * 0.75, 5);

    setResults({
      topOffer,
      topOfferPremium,
      topOfferCheckout,
    });
  };

  return (
    <SidepanelLayout>
      <div className="p-4 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
              <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-medium text-sm">Calculator</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSaveDialogOpen(true)}
              className="h-10 w-10 p-0 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              title="Save Offer"
            >
              <Save className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCurrent}
              className="h-10 w-10 p-0 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              title="Clear Form"
            >
              <RotateCcw className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <Input
              type="text"
              value={projectionAmount}
              onChange={(e) => handleProjectionChange(e.target.value)}
              className="text-lg h-12 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900"
              placeholder="Enter estimated projection"
            />
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="info" className="border-none">
                <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:no-underline justify-start gap-2">
                  <span>How offers are calculated</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 text-sm text-muted-foreground pt-2">
                    <div>
                      <h6 className="font-semibold text-foreground mb-1">
                        Top Offer
                      </h6>
                      <p className="mb-1.5">
                        Standard offer calculated as a percentage of projection,
                        rounded down to the nearest $5.
                      </p>
                      <ul className="list-disc list-inside ml-2 space-y-0.5 text-xs">
                        <li>
                          Under $50: <strong>20%</strong>
                        </li>
                        <li>
                          $50–$99.99: <strong>30%</strong>
                        </li>
                        <li>
                          $100–$249.99: <strong>40%</strong>
                        </li>
                        <li>
                          $250–$499.99: <strong>50%</strong>
                        </li>
                        <li>
                          $500–$749.99: <strong>55%</strong>
                        </li>
                        <li>
                          $750+: <strong>65%</strong>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-semibold text-foreground mb-1">
                        Top Offer (Premium)
                      </h6>
                      <p>
                        Higher offer for premium items with better rates for
                        larger projections, rounded down to the nearest $5.
                      </p>
                    </div>

                    <div>
                      <h6 className="font-semibold text-foreground mb-1">
                        Top Offer (Checkout)
                      </h6>
                      <p>
                        Always <strong>75%</strong> of projection, rounded down
                        to the nearest $5. Highest offer amount.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="grid grid-cols-1 gap-3">
              <div
                onClick={() => handleCopy(results.topOffer, "standard")}
                className="text-center p-4 bg-secondary/50 rounded-lg border border-border/50 cursor-pointer hover:bg-secondary transition-colors select-none"
              >
                <div className="text-3xl font-bold text-primary">
                  ${formatCurrency(results.topOffer)}
                </div>
                <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
                  {copied === "standard" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-green-500 font-medium">
                        Copied!
                      </span>
                    </>
                  ) : (
                    "Top Offer"
                  )}
                </div>
              </div>

              <div
                onClick={() => handleCopy(results.topOfferPremium, "premium")}
                className="text-center p-4 bg-secondary/50 rounded-lg border border-border/50 cursor-pointer hover:bg-secondary transition-colors select-none"
              >
                <div className="text-3xl font-bold text-primary">
                  ${formatCurrency(results.topOfferPremium)}
                </div>
                <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
                  {copied === "premium" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-green-500 font-medium">
                        Copied!
                      </span>
                    </>
                  ) : (
                    "Top Offer (Premium)"
                  )}
                </div>
              </div>

              <div
                onClick={() => handleCopy(results.topOfferCheckout, "checkout")}
                className="text-center p-4 bg-secondary/50 rounded-lg border border-border/50 cursor-pointer hover:bg-secondary transition-colors select-none"
              >
                <div className="text-3xl font-bold text-primary">
                  ${formatCurrency(results.topOfferCheckout)}
                </div>
                <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
                  {copied === "checkout" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-green-500 font-medium">
                        Copied!
                      </span>
                    </>
                  ) : (
                    "Top Offer (Checkout)"
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Offers List */}
        {savedOffers.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Saved Offers
            </h3>
            <div className="space-y-2">
              {savedOffers.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer group"
                  onClick={() => loadOffer(o)}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="font-medium truncate text-sm">{o.name}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(o.timestamp).toLocaleDateString()} •{" "}
                      ${o.projectionAmount}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteOffer(o.id);
                    }}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Dialog */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent className="max-w-[90%] rounded-lg bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle>Save Offer</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Enter a name for this offer"
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveOffer();
                }}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button onClick={saveOffer} disabled={!saveName.trim()}>
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => setSaveDialogOpen(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidepanelLayout>
  );
}

export default function TopOffersPage({ onClose }: { onClose?: () => void }) {
  return <TopOfferCalculator />;
}
