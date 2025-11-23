// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
/* global window, document */

import { defineContentScript } from "wxt/utils/define-content-script";

/**
 * Adds an inline summary to eBay search result pages showing
 * the current search context (Sold vs Active, Condition).
 *
 * This script runs on eBay search pages (https://www.ebay.com/sch/*).
 */
export default defineContentScript({
  matches: ["https://www.ebay.com/sch/*"],
  runAt: "document_idle",
  allFrames: false,
  main() {
    // Early safety check: ensure we're on an eBay search page
    if (!window.location.hostname.includes("ebay.com") ||
        !window.location.pathname.startsWith("/sch/")) {
      console.log("⚡ [Volt eBay Summary] Not on eBay search page, exiting");
      return;
    }

    console.log("⚡ [Volt eBay Summary] SCRIPT LOADED");

    const SUMMARY_ID = "volt-ebay-summary";
    const STYLE_ID = "volt-ebay-summary-style";
    let updateQueued = false;
    let isDismissed = false;

    const log = (...args: any[]) => {
      try {
        console.log("[Volt eBay Summary]", ...args);
      } catch {}
    };

    const ensureStyles = () => {
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        #${SUMMARY_ID} {
          width: 100%;
          padding: 16px 20px;
          border-radius: 10px;
          margin: 12px 0 0 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
          color: #0f172a;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
          position: relative;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        /* Green theme for Sold Listings */
        #${SUMMARY_ID}.volt-state-sold {
          border: 1px solid #16a34a; /* Green-600 */
          background: #f0fdf4; /* Green-50 */
        }
        
        /* Orange theme for Active/Completed Listings (Warning) */
        #${SUMMARY_ID}.volt-state-active {
          border: 1px solid #f97316; /* Orange-500 */
          background: #fff7ed; /* Orange-50 */
        }

        #${SUMMARY_ID} h2 {
          font-size: 18px;
          margin: 0;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        #${SUMMARY_ID} h2 img {
          width: 24px;
          height: 24px;
        }
        #${SUMMARY_ID} .volt-ebay-summary__content {
          font-size: 16px;
          color: #334155;
          line-height: 1.5;
        }
        #${SUMMARY_ID} .volt-ebay-summary__content strong {
          color: #0f172a;
          font-weight: 700;
        }
        #${SUMMARY_ID} .volt-ebay-summary__action {
          display: inline-block;
          margin-top: 8px;
          font-weight: 600;
          text-decoration: underline;
          cursor: pointer;
          color: #c2410c; /* Orange-700 */
          font-size: 15px;
        }
        #${SUMMARY_ID} .volt-ebay-summary__action:hover {
          color: #9a3412; /* Orange-800 */
        }

        #${SUMMARY_ID} .volt-ebay-summary__links {
          margin-left: 4px;
          color: #475569;
        }
        #${SUMMARY_ID} .volt-ebay-summary__links a {
          color: #15803d; /* Green-700 */
          text-decoration: underline;
          font-weight: 600;
          cursor: pointer;
        }
        #${SUMMARY_ID} .volt-ebay-summary__links a:hover {
          color: #166534; /* Green-800 */
        }

        #${SUMMARY_ID} .volt-ebay-summary__dismiss {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          border-radius: 6px;
          width: 24px;
          height: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          line-height: 1;
          color: #64748b;
          transition: all 0.2s ease;
          z-index: 10;
        }
        #${SUMMARY_ID} .volt-ebay-summary__dismiss:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }
        
        #${SUMMARY_ID} .volt-ebay-summary__settings {
          position: absolute;
          top: 12px;
          right: 44px;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          border-radius: 6px;
          width: 24px;
          height: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          line-height: 1;
          color: #64748b;
          transition: all 0.2s ease;
          z-index: 10;
        }
        #${SUMMARY_ID} .volt-ebay-summary__settings:hover {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
        }
      `;
      document.head.appendChild(style);
    };

    const getListingState = () => {
      try {
        const url = new URL(window.location.href);
        if (!/\.ebay\./i.test(url.hostname)) return "unknown";
        if (!url.pathname.startsWith("/sch/")) return "unknown";
        
        const soldParam = url.searchParams.get("LH_Sold");
        const completeParam = url.searchParams.get("LH_Complete");
        
        const isSold = soldParam === "1" || soldParam === "true";
        const isComplete = completeParam === "1" || completeParam === "true";

        if (isSold) return "sold";
        if (isComplete) return "completed";
        return "active";
      } catch {
        return "active";
      }
    };

    const getConditionsText = (conditionParam: string | null) => {
      if (!conditionParam) return "All Conditions";
      
      // Decode URL encoded chars just in case (though new URL() usually handles params)
      const decoded = decodeURIComponent(conditionParam);
      const codes = decoded.split('|');
      
      const labels = new Set<string>();
      
      codes.forEach(code => {
        // Standard eBay Condition IDs and legacy URL params
        if (["1000", "3", "10"].includes(code)) labels.add("New");
        else if (["1500", "1750"].includes(code)) labels.add("Open Box");
        else if (code >= "2000" && code <= "2500") labels.add("Refurbished");
        else if (["3000", "4", "5000", "6000"].includes(code)) labels.add("Used");
        else if (["7000"].includes(code)) labels.add("For Parts");
        else labels.add("Other");
      });

      if (labels.size === 0) return "All Conditions";
      
      const labelArray = Array.from(labels);
      if (labelArray.length <= 2) {
        return labelArray.join(" & ");
      }
      return labelArray.join(", ");
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
        return container;
      }

      // Try to find the srp-controls__row-2 element
      const srpControlsRow2 = document.querySelector(".srp-controls__row-2");
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

    const renderSummary = async () => {
      updateQueued = false;
      
      // Check if the feature is enabled in settings
      try {
        const result = await chrome.storage.sync.get(["cmdkSettings"]);
        const isEnabled = result.cmdkSettings?.ebaySummary?.enabled ?? true;

        if (!isEnabled) {
          log("✗ eBay Summary feature is disabled in settings");
          removeSummary();
          return;
        }
      } catch (err) {
        log("⚠️ Failed to check settings, assuming enabled", err);
      }

      // Check if user has dismissed this summary
      if (isDismissed) {
        removeSummary();
        return;
      }

      ensureStyles();
      const container = ensureSummaryContainer();
      if (!container) {
        return;
      }

      const state = getListingState();
      const isSold = state === "sold";
      const url = new URL(window.location.href);
      const conditionParam = url.searchParams.get("LH_ItemCondition");
      
      // Determine state class - Green only for strictly Sold
      container.className = isSold ? "volt-state-sold" : "volt-state-active";
      
      let listingType = "Active Listings";
      if (state === "sold") listingType = "Sold Listings";
      else if (state === "completed") listingType = "Completed Listings (Sold & Unsold)";
      
      const conditionText = getConditionsText(conditionParam);
      
      // Get the Volt icon URL
      const iconUrl = chrome.runtime.getURL("assets/icons/logo-32.png");

      let contentHtml = `
        You are currently viewing <strong>${listingType}</strong> for <strong>${conditionText}</strong> items.
      `;

      if (isSold) {
        if (conditionText === "All Conditions") {
          contentHtml += `
            <span class="volt-ebay-summary__links">
              — View <a href="#" data-action="filter-used">Used</a> or <a href="#" data-action="filter-new">New</a> only
            </span>
          `;
        } else if (conditionParam === "3000") {
          contentHtml += `
            <span class="volt-ebay-summary__links">
              — View <a href="#" data-action="filter-new">New</a> or <a href="#" data-action="filter-all">All Conditions</a>
            </span>
          `;
        } else if (conditionParam === "1000") {
          contentHtml += `
            <span class="volt-ebay-summary__links">
              — View <a href="#" data-action="filter-used">Used</a> or <a href="#" data-action="filter-all">All Conditions</a>
            </span>
          `;
        }
      }

      if (!isSold) {
        contentHtml += `
          <div class="volt-ebay-summary__action" role="button" tabindex="0" data-action="switch-to-sold">
            Switch to Sold Listings to view pricing data →
          </div>
        `;
      }

      container.innerHTML = `
        <button type="button" class="volt-ebay-summary__settings" title="Settings" data-action="settings">⚙</button>
        <button type="button" class="volt-ebay-summary__dismiss" title="Dismiss" data-action="dismiss">×</button>
        <h2><img src="${iconUrl}" alt="Volt" /> Volt</h2>
        <div class="volt-ebay-summary__content">
          ${contentHtml}
        </div>
      `;

      // Add click handlers
      const settingsBtn = container.querySelector('[data-action="settings"]');
      const dismissBtn = container.querySelector('[data-action="dismiss"]');
      const switchToSoldBtn = container.querySelector('[data-action="switch-to-sold"]');
      const filterUsedBtn = container.querySelector('[data-action="filter-used"]');
      const filterNewBtn = container.querySelector('[data-action="filter-new"]');
      const filterAllBtn = container.querySelector('[data-action="filter-all"]');

      const handleFilterClick = (conditionId: string | null) => (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        const currentUrl = new URL(window.location.href);
        if (conditionId) {
          currentUrl.searchParams.set("LH_ItemCondition", conditionId);
        } else {
          currentUrl.searchParams.delete("LH_ItemCondition");
        }
        window.location.href = currentUrl.toString();
      };

      if (filterUsedBtn) filterUsedBtn.addEventListener("click", handleFilterClick("3000"));
      if (filterNewBtn) filterNewBtn.addEventListener("click", handleFilterClick("1000"));
      if (filterAllBtn) filterAllBtn.addEventListener("click", handleFilterClick(null));

      if (settingsBtn) {
        settingsBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          // Open settings page and navigate to eBay section
          chrome.runtime.sendMessage({
            action: "open-settings",
            section: "ebay",
          });
        });
      }

      if (dismissBtn) {
        dismissBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          isDismissed = true;
          removeSummary();
        });
      }

      if (switchToSoldBtn) {
        switchToSoldBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set("LH_Sold", "1");
          currentUrl.searchParams.set("LH_Complete", "1");
          window.location.href = currentUrl.toString();
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
      log("=== Volt eBay Summary Starting ===");
      
      if (!document.body) {
        setTimeout(start, 100);
        return;
      }

      // Listen for settings changes from the settings page
      chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "ebay-summary-settings-changed") {
          scheduleUpdate();
        }
      });

      // Hook into history changes for SPA-like navigation
      ["pushState", "replaceState"].forEach((method) => {
        try {
          const original = (history as any)[method];
          if (typeof original !== "function") return;
          (history as any)[method] = function (...args: any[]) {
            const result = original.apply(this, args);
            isDismissed = false;
            scheduleUpdate();
            return result;
          };
        } catch (err) {}
      });

      window.addEventListener("popstate", () => {
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
