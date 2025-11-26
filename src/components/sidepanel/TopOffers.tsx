"use client";

import { useState } from "react";
import { Input } from "../ui/input";
import { Check, Calculator } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import SidepanelLayout from "./SidepanelLayout";

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
      </div>
    </SidepanelLayout>
  );
}

export default function TopOffersPage({ onClose }: { onClose?: () => void }) {
  return <TopOfferCalculator />;
}
