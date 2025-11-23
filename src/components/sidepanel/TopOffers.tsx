"use client";

import { useState } from "react";
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
  const [isInfoOpen, setIsInfoOpen] = useState(false);

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
    <SidepanelLayout
      title="Top Offer Calculator"
      className="h-screen bg-background"
    >
      <div className="max-w-7xl mx-auto w-full p-2 flex flex-col flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div className=" space-y-4">
            {/* Input Section */}
            <div>

              <div className="max-w-md">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Projection Amount
                  </label>
                  <input
                    type="text"
                    value={projectionAmount}
                    onChange={(e) => handleProjectionChange(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                    placeholder="Enter estimated projection"
                  />
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-foreground">
                  Offer Results
                </h4>
                <button
                  aria-label="How offers are calculated"
                  onClick={() => setIsInfoOpen(true)}
                  className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-9-3a1 1 0 112 0 1 1 0 01-2 0zM9 9a1 1 0 012 0v4a1 1 0 11-2 0V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    ${formatCurrency(results.topOffer)}
                  </div>
                  <div className="text-sm text-muted-foreground">Top Offer</div>
                </div>

                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    ${formatCurrency(results.topOfferPremium)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Top Offer (Premium)
                  </div>
                </div>

                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    ${formatCurrency(results.topOfferCheckout)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Top Offer (Checkout)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      {isInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card rounded-lg shadow-xl max-w-lg w-full mx-4 p-4 border border-border">
            <div className="flex items-start justify-between mb-3">
              <h5 className="text-lg font-semibold text-foreground">
                How Top Offers Work
              </h5>
              <button
                aria-label="Close info"
                onClick={() => setIsInfoOpen(false)}
                className="text-muted-foreground hover:text-foreground text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <h6 className="font-semibold text-foreground mb-1">Top Offer</h6>
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
                  Higher offer for premium items with better rates for larger
                  projections, rounded down to the nearest $5.
                </p>
              </div>

              <div>
                <h6 className="font-semibold text-foreground mb-1">
                  Top Offer (Checkout)
                </h6>
                <p>
                  Always <strong>75%</strong> of projection, rounded down to the
                  nearest $5. Highest offer amount.
                </p>
              </div>
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={() => setIsInfoOpen(false)}
                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </SidepanelLayout>
  );
}

export default function TopOffersPage() {
  return <TopOfferCalculator />;
}
