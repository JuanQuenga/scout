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
    const SUMMARY_ID = "scout-ebay-sold-summary";
    const STYLE_ID = "scout-ebay-sold-summary-style";
    let updateQueued = false;

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
          border: 1px solid #1d4ed8;
          background: rgba(37, 99, 235, 0.08);
          padding: 14px 18px;
          border-radius: 10px;
          margin: 16px 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
          color: #0f172a;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
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
      const prefix = text.replace(/[\d.,]/g, "").replace(/\s+/g, " ").trim();
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

    const collectPrices = () => {
      const items = Array.from(
        document.querySelectorAll("#srp-river-results li.s-item")
      );
      const prices: number[] = [];
      let currencyPrefix: string | null = null;

      for (const item of items) {
        const priceElement =
          item.querySelector(".s-item__price") ||
          item.querySelector("[data-test-id='ITEM-PRICE']") ||
          item.querySelector("span[itemprop='price']");
        if (!priceElement) continue;

        const text = priceElement.textContent?.trim();
        if (!text) continue;

        const value = parsePrice(text);
        if (value === null) continue;

        if (!currencyPrefix) {
          currencyPrefix = detectCurrencyPrefix(text);
        }

        prices.push(value);
      }

      return { prices, currencyPrefix: currencyPrefix || "$" };
    };

    const removeSummary = () => {
      const existing = document.getElementById(SUMMARY_ID);
      if (existing) {
        existing.remove();
      }
    };

    const ensureSummaryContainer = () => {
      let container = document.getElementById(SUMMARY_ID);
      if (container) return container;
      const river = document.getElementById("srp-river-results");
      if (!river || !river.parentElement) return null;

      container = document.createElement("section");
      container.id = SUMMARY_ID;
      river.parentElement.insertBefore(container, river);
      return container;
    };

    const renderSummary = () => {
      updateQueued = false;

      if (!isSoldResultsPage()) {
        removeSummary();
        return;
      }

      const { prices, currencyPrefix } = collectPrices();
      if (!prices.length) {
        removeSummary();
        return;
      }

      ensureStyles();
      const container = ensureSummaryContainer();
      if (!container) return;

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

      container.innerHTML = `
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
        </div>
        <div class="scout-ebay-summary__meta">
          Based on ${count} sold listings detected on this page. Apply filters or refresh to recalculate.
        </div>
      `;
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

    const observer = new MutationObserver(() => {
      if (!isSoldResultsPage()) {
        removeSummary();
        return;
      }
      scheduleUpdate();
    });

    const start = () => {
      if (!document.body) {
        setTimeout(start, 100);
        return;
      }

      try {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
      } catch (err) {
        log("Failed to observe mutations", err);
      }

      ["pushState", "replaceState"].forEach((method) => {
        try {
          const original = (history as any)[method];
          if (typeof original !== "function") return;
          (history as any)[method] = function (...args: any[]) {
            const result = original.apply(this, args);
            scheduleUpdate();
            return result;
          };
        } catch (err) {
          log(`Failed to wrap history.${method}`, err);
        }
      });

      window.addEventListener("popstate", scheduleUpdate);
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          scheduleUpdate();
        }
      });

      scheduleUpdate();
    };

    start();
  },
});
