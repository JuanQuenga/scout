/**
 * POS Inventory Content Script
 * Injects the POS Inventory Scanner when on pos.paymore.tech/inventory
 */

// @ts-nocheck
/* global chrome */
import { defineContentScript } from "wxt/utils/define-content-script";

export default defineContentScript({
  matches: ["*://pos.paymore.tech/inventory*"],
  runAt: "document_idle",
  allFrames: true,
  main() {
    "use strict";

    console.log("[POS Content Script] Script loaded and running");

    // Send ready notification to background script
    try {
      if (
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        chrome.runtime.sendMessage
      ) {
        chrome.runtime.sendMessage(
          { type: "CONTENT_SCRIPT_READY" },
          (response) => {
            if (chrome.runtime.lastError) {
              console.warn(
                "[POS Content Script] Extension context may be invalid:",
                chrome.runtime.lastError.message
              );
            } else {
              console.log("[POS Content Script] Extension health check passed");
            }
          }
        );
      }
    } catch (error) {
      console.warn(
        "[POS Content Script] Could not communicate with extension:",
        error.message
      );
    }

    // Check if we're on the POS inventory page
    function isPOSInventoryPage() {
      const isCorrectHost = window.location.hostname === "pos.paymore.tech";
      const isCorrectPath = window.location.pathname.includes("/inventory");

      console.log("[POS Content Script] Page check:", {
        hostname: window.location.hostname,
        pathname: window.location.pathname,
        isCorrectHost,
        isCorrectPath,
        fullUrl: window.location.href,
      });

      return isCorrectHost && isCorrectPath;
    }

    // Safely get extension URL with error handling
    function getExtensionURL(path) {
      try {
        // Check if chrome.runtime is available
        if (
          typeof chrome !== "undefined" &&
          chrome.runtime &&
          chrome.runtime.getURL
        ) {
          return chrome.runtime.getURL(path);
        } else {
          console.warn(
            "[POS Content Script] Chrome runtime not available, extension may have been reloaded"
          );
          return null;
        }
      } catch (error) {
        console.error(
          "[POS Content Script] Error getting extension URL:",
          error
        );
        return null;
      }
    }

    // Inject the POS Inventory Scanner
    function injectPOSScanner() {
      if (!isPOSInventoryPage()) {
        console.log(
          "[POS Content Script] Not on POS inventory page, skipping injection"
        );
        return;
      }

      console.log(
        "[POS Content Script] Detected POS inventory page, injecting scanner"
      );

      // Check if scanner is already loaded
      if (window.POSInventoryScanner) {
        console.log(
          "[POS Content Script] Scanner already loaded, skipping injection"
        );
        return;
      }

      try {
        // Get the extension URL safely
        const scriptUrl = getExtensionURL(
          "components/pos-inventory/pos-inventory.js"
        );
        if (!scriptUrl) {
          console.error(
            "[POS Content Script] Cannot get extension URL, skipping injection"
          );
          return;
        }

        // Create script element to load the scanner
        const script = document.createElement("script");
        script.src = scriptUrl;

        console.log("[POS Content Script] Script URL:", script.src);

        script.onload = function () {
          console.log(
            "[POS Content Script] POS Inventory Scanner loaded successfully"
          );

          // Verify the scanner is available
          if (window.POSInventoryScanner) {
            console.log(
              "[POS Content Script] Scanner instance available:",
              window.POSInventoryScanner
            );
          } else {
            console.error(
              "[POS Content Script] Scanner loaded but not available in window object"
            );
          }
        };

        script.onerror = function (error) {
          console.error(
            "[POS Content Script] Failed to load POS Inventory Scanner:",
            error
          );
          console.error(
            "[POS Content Script] Script URL attempted:",
            script.src
          );

          // Try to recover by retrying after a delay
          setTimeout(() => {
            if (!window.POSInventoryScanner) {
              console.log(
                "[POS Content Script] Retrying injection after error..."
              );
              injectPOSScanner();
            }
          }, 5000);
        };

        document.head.appendChild(script);
        console.log("[POS Content Script] Script element added to head");
      } catch (error) {
        console.error("[POS Content Script] Error during injection:", error);

        // Check if it's a context invalidation error
        if (
          error.message &&
          error.message.includes("Extension context invalidated")
        ) {
          console.warn(
            "[POS Content Script] Extension context invalidated, will retry when context is restored"
          );
          // Don't retry immediately for context invalidation
          return;
        }

        // For other errors, retry after a delay
        setTimeout(() => {
          if (!window.POSInventoryScanner) {
            console.log(
              "[POS Content Script] Retrying injection after error..."
            );
            injectPOSScanner();
          }
        }, 5000);
      }
    }

    // Function to check if table exists and trigger injection
    function checkAndInject() {
      console.log(
        "[POS Content Script] Checking page and attempting injection"
      );

      if (isPOSInventoryPage()) {
        // Check if table exists
        const table = document.querySelector("table.table.table-row-bordered");
        if (table) {
          console.log("[POS Content Script] Table found, injecting scanner");
          injectPOSScanner();
        } else {
          console.log("[POS Content Script] Table not found yet, will retry");
          // Retry after a short delay
          setTimeout(checkAndInject, 2000);
        }
      }
    }

    // Wait for page to be ready
    if (document.readyState === "loading") {
      console.log(
        "[POS Content Script] DOM loading, waiting for DOMContentLoaded"
      );
      document.addEventListener("DOMContentLoaded", function () {
        console.log("[POS Content Script] DOMContentLoaded fired");
        setTimeout(checkAndInject, 1000); // Small delay to ensure page is ready
      });
    } else {
      console.log(
        "[POS Content Script] DOM already ready, checking immediately"
      );
      setTimeout(checkAndInject, 1000);
    }

    // Also listen for navigation changes (for SPA behavior)
    let currentUrl = window.location.href;
    const observer = new MutationObserver(function () {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log("[POS Content Script] Navigation detected:", currentUrl);

        if (isPOSInventoryPage()) {
          console.log(
            "[POS Content Script] Navigation to POS inventory page, injecting scanner"
          );
          setTimeout(checkAndInject, 2000); // Longer delay for navigation
        }
      }
    });

    // Start observing after a delay to ensure page is stable
    setTimeout(() => {
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
        console.log("[POS Content Script] MutationObserver started");
      }
    }, 3000);

    // Additional check for dynamic content loading
    function watchForTable() {
      const table = document.querySelector("table.table.table-row-bordered");
      if (table && !window.POSInventoryScanner) {
        console.log(
          "[POS Content Script] Table found via watcher, injecting scanner"
        );
        injectPOSScanner();
      }
    }

    // Set up periodic checking for table
    setInterval(watchForTable, 3000);

    // Periodic extension health check
    setInterval(() => {
      try {
        if (
          typeof chrome !== "undefined" &&
          chrome.runtime &&
          chrome.runtime.sendMessage
        ) {
          chrome.runtime.sendMessage(
            { type: "EXTENSION_HEALTH_CHECK" },
            (response) => {
              if (chrome.runtime.lastError) {
                console.warn(
                  "[POS Content Script] Extension context invalidated, will retry injection:",
                  chrome.runtime.lastError.message
                );
                // Clear any existing scanner and retry injection
                if (window.POSInventoryScanner) {
                  delete window.POSInventoryScanner;
                  console.log(
                    "[POS Content Script] Cleared invalid scanner instance"
                  );
                }
                // Retry injection after a delay
                setTimeout(checkAndInject, 2000);
              }
            }
          );
        }
      } catch (error) {
        console.warn(
          "[POS Content Script] Extension health check failed:",
          error.message
        );
      }
    }, 10000); // Check every 10 seconds

    // Make functions available globally for debugging
    window.POSContentScriptDebug = {
      isPOSInventoryPage,
      injectPOSScanner,
      checkAndInject,
      watchForTable,
    };

    console.log("[POS Content Script] Initialization complete");
  },
});
