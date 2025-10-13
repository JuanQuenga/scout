// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
/* global window, document */

import { defineContentScript } from "wxt/utils/define-content-script";

/**
 * Adds an inline summary to eBay sold listing search result pages showing
 * average, median, high, and low sale prices for the visible results.
 */
export default defineContentScript({
  matches: ["https://www.ebay.com/sch/*"],
  runAt: "document_idle",
  allFrames: false,
  main() {
    console.log("🐕 [Scout eBay Sold Summary] SCRIPT LOADED - Version 2");

    const SUMMARY_ID = "scout-ebay-sold-summary";
    const STYLE_ID = "scout-ebay-sold-summary-style";
    let updateQueued = false;
    let isDismissed = false;

    const log = (...args: any[]) => {
      try {
        console.log("[Scout eBay Sold Summary]", ...args);
      } catch {}
    };

    const ensureStyles = () => {
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        #${SUMMARY_ID} {
          width: 100%;
          border: 1px solid #1d4ed8;
          background: rgba(37, 99, 235, 0.08);
          padding: 14px 18px;
          border-radius: 10px;
          margin: 12px 0 0 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
          color: #0f172a;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
          position: relative;
        }
        #${SUMMARY_ID} h2 {
          font-size: 17px;
          margin: 0 0 10px;
          font-weight: 600;
          color: #1e293b;
        }
        #${SUMMARY_ID} .scout-ebay-summary__metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        #${SUMMARY_ID} .scout-ebay-summary__metric {
          min-width: 120px;
          background: rgba(255, 255, 255, 0.6);
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid rgba(148, 163, 184, 0.4);
        }
        #${SUMMARY_ID} .scout-ebay-summary__metric strong {
          display: block;
          font-size: 16px;
          margin-bottom: 4px;
        }
        #${SUMMARY_ID} .scout-ebay-summary__metric-button {
          min-width: 120px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.95));
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid rgba(59, 130, 246, 0.6);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          color: white;
          font-weight: 600;
          font-size: 13px;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #${SUMMARY_ID} .scout-ebay-summary__metric-button:hover {
          background: linear-gradient(135deg, rgba(37, 99, 235, 1), rgba(29, 78, 216, 1));
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
          border-color: rgba(29, 78, 216, 0.8);
        }
        #${SUMMARY_ID} .scout-ebay-summary__metric-button:active {
          transform: translateY(0);
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
        }
        #${SUMMARY_ID} .scout-ebay-summary__dismiss {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(148, 163, 184, 0.2);
          border: 1px solid rgba(148, 163, 184, 0.4);
          border-radius: 6px;
          width: 28px;
          height: 28px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          line-height: 1;
          color: #475569;
          transition: all 0.2s ease;
          z-index: 10;
          pointer-events: auto;
        }
        #${SUMMARY_ID} .scout-ebay-summary__dismiss:hover {
          background: rgba(239, 68, 68, 0.9);
          border-color: rgba(220, 38, 38, 0.8);
          color: white;
        }
        #${SUMMARY_ID} .scout-ebay-summary__meta {
          margin-top: 12px;
          font-size: 12px;
          color: #475569;
        }
      `;
      document.head.appendChild(style);
    };

    const isSoldResultsPage = () => {
      try {
        const url = new URL(window.location.href);
        if (!/\.ebay\./i.test(url.hostname)) return false;
        if (!url.pathname.startsWith("/sch/")) return false;
        const soldParam = url.searchParams.get("LH_Sold");
        return soldParam === "1" || soldParam === "true";
      } catch {
        return false;
      }
    };

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
      const prefix = text
        .replace(/[\d.,]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (prefix) return prefix;
      const symbolMatch = text.match(/[$\u00a3\u00a5\u20ac]/);
      if (symbolMatch) return symbolMatch[0];
      return "$";
    };

    const formatCurrency = (value: number, prefix: string) => {
      const formatted = value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `${prefix ? prefix + " " : ""}${formatted}`.trim();
    };

    const parseSoldDate = (element: Element) => {
      try {
        // Look for the "Sold" date text
        const soldDateElement = element.querySelector(".s-item__title--tagblock .POSITIVE") ||
                               element.querySelector(".s-item__ended-date");

        if (!soldDateElement) return null;

        const text = soldDateElement.textContent?.trim();
        if (!text) return null;

        // Extract date from text like "Sold  Jan 15, 2025" or "Sold Jan 15, 2025"
        const match = text.match(/Sold\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
        if (!match) return null;

        const dateStr = match[1];
        const date = new Date(dateStr);

        if (isNaN(date.getTime())) return null;

        return date;
      } catch {
        return null;
      }
    };

    const collectPrices = () => {
      // Find the main search results container
      const mainResultsContainer =
        document.querySelector("ul.srp-results.srp-grid") ||
        document.querySelector("#srp-river-results");

      if (!mainResultsContainer) {
        log("⚠️ Could not find main results container");
        return { prices: [], currencyPrefix: "$", mostRecentDate: null };
      }

      log("✓ Found main results container");

      // Get ALL direct child <li> elements
      const allListItems = Array.from(mainResultsContainer.children).filter(
        (child) => child.tagName === "LI"
      );

      log("Found", allListItems.length, "total <li> elements");

      // Collect only product listings BEFORE the "fewer words" divider
      const productListings = [];

      for (let i = 0; i < allListItems.length; i++) {
        const item = allListItems[i];

        // Check if this is a product listing (has data-listingid)
        if (item.hasAttribute("data-listingid")) {
          productListings.push(item);
          continue;
        }

        // This is NOT a product listing - check if it's the "fewer words" divider
        const classList = item.className || "";
        const textContent = item.textContent || "";

        if (
          classList.includes("srp-river-answer--REWRITE_START") ||
          textContent.includes("Results matching fewer words")
        ) {
          log("🛑 STOP: Found 'fewer words' divider at index", i);
          log("   - Collected", productListings.length, "products before divider");
          break; // STOP - everything after this is suggested
        }

        // Other divider/notice - skip and continue
        log("Skipping divider/notice at index", i);
      }

      log("✅ Final count:", productListings.length, "product listings");

      // Extract prices and dates
      const prices: number[] = [];
      const dates: Date[] = [];
      let currencyPrefix: string | null = null;

      for (const item of productListings) {
        const priceElement =
          item.querySelector(".s-card__price") ||
          item.querySelector(".s-item__price") ||
          item.querySelector("[data-test-id='ITEM-PRICE']");

        if (!priceElement) continue;

        const text = priceElement.textContent?.trim();
        if (!text) continue;

        const value = parsePrice(text);
        if (value === null) continue;

        if (!currencyPrefix) {
          currencyPrefix = detectCurrencyPrefix(text);
        }

        prices.push(value);

        // Try to get the sold date
        const soldDate = parseSoldDate(item);
        if (soldDate) {
          dates.push(soldDate);
        }
      }

      log("💰 Extracted", prices.length, "prices");
      log("📅 Extracted", dates.length, "dates");

      // Find the most recent date
      let mostRecentDate: Date | null = null;
      if (dates.length > 0) {
        mostRecentDate = dates.reduce((latest, current) =>
          current > latest ? current : latest
        );
      }

      return { prices, currencyPrefix: currencyPrefix || "$", mostRecentDate };
    };

    const removeSummary = () => {
      const existing = document.getElementById(SUMMARY_ID);
      if (existing) {
        existing.remove();
      }
    };

    const ensureSummaryContainer = () => {
      let container = document.getElementById(SUMMARY_ID);
      if (container) {
        log("✓ Summary container already exists");
        return container;
      }

      // Try to find the srp-controls__row-2 element
      const srpControlsRow2 = document.querySelector(".srp-controls__row-2");
      log(
        "Searching for .srp-controls__row-2:",
        srpControlsRow2 ? "FOUND" : "NOT FOUND"
      );

      if (srpControlsRow2) {
        container = document.createElement("section");
        container.id = SUMMARY_ID;
        // Insert the summary as the last child of srp-controls__row-2
        srpControlsRow2.appendChild(container);
        log("✓ Summary container inserted into .srp-controls__row-2");
        return container;
      }

      // Fallback to old behavior if the element is not found
      const river = document.getElementById("srp-river-results");
      log(
        "Fallback: Searching for #srp-river-results:",
        river ? "FOUND" : "NOT FOUND"
      );

      if (!river || !river.parentElement) {
        log("✗ Cannot insert summary - no suitable parent found");
        return null;
      }

      container = document.createElement("section");
      container.id = SUMMARY_ID;
      river.parentElement.insertBefore(container, river);
      log("✓ Summary container inserted before #srp-river-results (fallback)");
      return container;
    };

    const renderSummary = () => {
      updateQueued = false;
      log("=== renderSummary called ===");

      const isSold = isSoldResultsPage();
      log("Is sold results page?", isSold);

      if (!isSold) {
        removeSummary();
        return;
      }

      // Check if user has dismissed this summary
      if (isDismissed) {
        log("✗ Summary was dismissed by user, not showing");
        removeSummary();
        return;
      }

      const { prices, currencyPrefix, mostRecentDate } = collectPrices();
      log("Collected prices:", prices.length, "prices found");

      if (!prices.length) {
        log("✗ No prices found, removing summary");
        removeSummary();
        return;
      }

      ensureStyles();
      const container = ensureSummaryContainer();
      if (!container) {
        log("✗ Could not create/find container");
        return;
      }

      const sorted = [...prices].sort((a, b) => a - b);
      const count = prices.length;
      const total = prices.reduce((sum, value) => sum + value, 0);
      const average = total / count;
      const median =
        count % 2 === 1
          ? sorted[(count - 1) / 2]
          : (sorted[count / 2 - 1] + sorted[count / 2]) / 2;
      const min = sorted[0];
      const max = sorted[sorted.length - 1];

      // Format the most recent date
      let formattedDate = "N/A";
      if (mostRecentDate) {
        const options: Intl.DateTimeFormatOptions = {
          month: "short",
          day: "numeric",
          year: "numeric"
        };
        formattedDate = mostRecentDate.toLocaleDateString("en-US", options);
      }

      container.innerHTML = `
        <button type="button" class="scout-ebay-summary__dismiss" title="Dismiss" data-action="dismiss">×</button>
        <h2>Scout Price Summary</h2>
        <div class="scout-ebay-summary__metrics">
          <div class="scout-ebay-summary__metric">
            <strong>Average</strong>
            <span>${formatCurrency(average, currencyPrefix)}</span>
          </div>
          <div class="scout-ebay-summary__metric">
            <strong>Median</strong>
            <span>${formatCurrency(median, currencyPrefix)}</span>
          </div>
          <div class="scout-ebay-summary__metric">
            <strong>Highest</strong>
            <span>${formatCurrency(max, currencyPrefix)}</span>
          </div>
          <div class="scout-ebay-summary__metric">
            <strong>Lowest</strong>
            <span>${formatCurrency(min, currencyPrefix)}</span>
          </div>
          <div class="scout-ebay-summary__metric">
            <strong>Listings</strong>
            <span>${count}</span>
          </div>
          <div class="scout-ebay-summary__metric">
            <strong>Latest Sold</strong>
            <span>${formattedDate}</span>
          </div>
          <div class="scout-ebay-summary__metric-button" data-action="view-used">
            View Used
          </div>
          <div class="scout-ebay-summary__metric-button" data-action="view-new">
            View New
          </div>
        </div>
        <div class="scout-ebay-summary__meta">
          Based on ${count} sold listings detected on this page. Apply filters or refresh to recalculate.
        </div>
      `;

      // Add click handlers for buttons
      const dismissBtn = container.querySelector('[data-action="dismiss"]');
      const usedBtn = container.querySelector('[data-action="view-used"]');
      const newBtn = container.querySelector('[data-action="view-new"]');

      if (dismissBtn) {
        dismissBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          log("Dismiss button clicked");
          isDismissed = true;
          removeSummary();
        });
      }

      if (usedBtn) {
        usedBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const url = new URL(window.location.href);
          url.searchParams.set("LH_ItemCondition", "4");
          window.location.href = url.toString();
        });
      }

      if (newBtn) {
        newBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const url = new URL(window.location.href);
          url.searchParams.set("LH_ItemCondition", "3");
          window.location.href = url.toString();
        });
      }
    };

    const scheduleUpdate = () => {
      if (updateQueued) return;
      updateQueued = true;
      try {
        window.requestAnimationFrame(renderSummary);
      } catch {
        setTimeout(renderSummary, 150);
      }
    };

    const start = () => {
      log("=== Scout eBay Sold Summary Starting ===");
      log("Current URL:", window.location.href);

      if (!document.body) {
        log("Body not ready, retrying...");
        setTimeout(start, 100);
        return;
      }

      // Hook into history changes for SPA-like navigation
      ["pushState", "replaceState"].forEach((method) => {
        try {
          const original = (history as any)[method];
          if (typeof original !== "function") return;
          (history as any)[method] = function (...args: any[]) {
            const result = original.apply(this, args);
            // Reset dismiss flag when URL changes (new search)
            isDismissed = false;
            scheduleUpdate();
            return result;
          };
        } catch (err) {
          log(`Failed to wrap history.${method}`, err);
        }
      });

      window.addEventListener("popstate", () => {
        // Reset dismiss flag when navigating back/forward
        isDismissed = false;
        scheduleUpdate();
      });

      // Initial render - wait a bit for eBay's dynamic content to load
      setTimeout(() => {
        scheduleUpdate();
      }, 500);
    };

    start();
  },
});
