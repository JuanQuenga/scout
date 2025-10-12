// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
/* global chrome */

import { defineContentScript } from "wxt/utils/define-content-script";

/**
 * UPC Code Highlighter Content Script
 *
 * This content script detects 12-digit UPC codes on web pages,
 * highlights them with a special style, and makes them clickable
 * to copy the UPC code to the clipboard.
 */
export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  allFrames: true,
  main() {
    const log = (...args) => {
      try {
        console.log("[Scout UPC Highlighter]", ...args);
      } catch (_) {}
    };

    // UPC detection regex - matches 12-digit numbers
    const UPC_REGEX = /\b(\d{12})\b/g;

    // CSS for highlighting UPC codes
    const HIGHLIGHT_CSS = `
      .scout-upc-highlight {
        background-color: rgba(59, 130, 246, 0.15);
        border-bottom: 2px dotted #3b82f6;
        cursor: pointer;
        padding: 1px 2px;
        border-radius: 2px;
        transition: all 0.2s ease;
        position: relative;
      }
      
      .scout-upc-highlight:hover {
        background-color: rgba(59, 130, 246, 0.25);
        border-bottom-style: solid;
      }
      
      .scout-upc-copied {
        background-color: rgba(16, 185, 129, 0.2) !important;
        border-bottom-color: #10b981 !important;
      }
      
      .scout-upc-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background-color: #1f2937;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 10000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
        margin-bottom: 4px;
      }
      
      .scout-upc-tooltip.show {
        opacity: 1;
      }
      
      .scout-upc-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-width: 4px;
        border-style: solid;
        border-color: #1f2937 transparent transparent transparent;
      }
    `;

    // Inject CSS styles
    const styleElement = document.createElement("style");
    styleElement.textContent = HIGHLIGHT_CSS;
    styleElement.id = "scout-upc-highlighter-styles";
    (document.head || document.documentElement).appendChild(styleElement);

    // Function to show tooltip
    const showTooltip = (element, text) => {
      // Remove existing tooltips
      document.querySelectorAll(".scout-upc-tooltip").forEach((tooltip) => {
        tooltip.remove();
      });

      const tooltip = document.createElement("div");
      tooltip.className = "scout-upc-tooltip";
      tooltip.textContent = text;
      element.appendChild(tooltip);

      // Show tooltip
      setTimeout(() => {
        tooltip.classList.add("show");
      }, 10);

      // Hide tooltip after 2 seconds
      setTimeout(() => {
        tooltip.classList.remove("show");
        setTimeout(() => {
          if (tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
          }
        }, 200);
      }, 2000);
    };

    // Function to copy UPC to clipboard
    const copyUPCToClipboard = async (upcCode, element) => {
      try {
        await navigator.clipboard.writeText(upcCode);
        element.classList.add("scout-upc-copied");
        showTooltip(element, "UPC copied!");

        // Remove the copied class after 2 seconds
        setTimeout(() => {
          element.classList.remove("scout-upc-copied");
        }, 2000);

        log("UPC code copied to clipboard:", upcCode);
      } catch (err) {
        log("Failed to copy UPC code:", err);
        showTooltip(element, "Failed to copy");
      }
    };

    // Function to highlight UPC codes in a text node
    const highlightUPCsInTextNode = (textNode) => {
      const text = textNode.textContent;
      if (!text || !UPC_REGEX.test(text)) return;

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match;

      // Reset regex lastIndex for global regex
      UPC_REGEX.lastIndex = 0;

      while ((match = UPC_REGEX.exec(text)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
          fragment.appendChild(
            document.createTextNode(text.substring(lastIndex, match.index))
          );
        }

        // Create highlighted element for the UPC
        const upcElement = document.createElement("span");
        const upcCode = match[0]; // Store UPC code in closure
        upcElement.className = "scout-upc-highlight";
        upcElement.textContent = upcCode;
        upcElement.setAttribute("data-upc", upcCode);
        upcElement.title = `Click to copy UPC: ${upcCode}`;

        // Add click event listener
        upcElement.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          // Get UPC from data attribute to avoid closure issues
          const upc = e.currentTarget.getAttribute("data-upc");
          copyUPCToClipboard(upc, upcElement);
        });

        // Add hover tooltip
        upcElement.addEventListener("mouseenter", () => {
          if (!upcElement.classList.contains("scout-upc-copied")) {
            showTooltip(upcElement, "Click to copy UPC");
          }
        });

        fragment.appendChild(upcElement);
        lastIndex = match.index + match[0].length;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        fragment.appendChild(
          document.createTextNode(text.substring(lastIndex))
        );
      }

      // Replace the text node with the fragment
      if (fragment.childNodes.length > 0) {
        textNode.parentNode.replaceChild(fragment, textNode);
      }
    };

    // Function to process all text nodes in an element
    const processElement = (element) => {
      // Skip script, style, and already processed elements
      if (
        element.nodeType === Node.ELEMENT_NODE &&
        (element.tagName === "SCRIPT" ||
          element.tagName === "STYLE" ||
          element.tagName === "NOSCRIPT" ||
          element.classList.contains("scout-upc-highlight"))
      ) {
        return;
      }

      // Process text nodes
      if (element.nodeType === Node.TEXT_NODE) {
        highlightUPCsInTextNode(element);
        return;
      }

      // Process child nodes
      if (element.childNodes) {
        // Convert NodeList to array to avoid live collection issues
        const children = Array.from(element.childNodes);
        children.forEach(processElement);
      }
    };

    // Function to scan and highlight UPC codes on the page
    const scanAndHighlightUPCs = () => {
      // Start processing from the body element
      if (document.body) {
        processElement(document.body);
      }
    };

    // Function to observe DOM changes for dynamic content
    const setupMutationObserver = () => {
      const observer = new MutationObserver((mutations) => {
        const shouldRescan = mutations.some((mutation) => {
          // Check if nodes were added
          if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
            return true;
          }

          // Check if character data changed
          if (mutation.type === "characterData") {
            return true;
          }

          return false;
        });

        if (shouldRescan) {
          // Debounce rescanning
          setTimeout(scanAndHighlightUPCs, 100);
        }
      });

      // Start observing the document body
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      }

      return observer;
    };

    // Check if extension is enabled for current site
    const checkEnabledStatus = (callback) => {
      const domain = window.location.hostname;

      // Default to enabled if can't check status
      if (!domain || domain === "") {
        callback(true);
        return;
      }

      try {
        chrome.runtime.sendMessage(
          {
            action: "checkSiteStatus",
            domain: domain,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              log("Error checking site status:", chrome.runtime.lastError);
              callback(true); // Default to enabled
              return;
            }

            if (response && response.success) {
              callback(!response.disabled);
            } else {
              callback(true); // Default to enabled
            }
          }
        );
      } catch (e) {
        log("Failed to check site status:", e);
        callback(true); // Default to enabled
      }
    };

    // Initialize the UPC highlighter
    const initializeUPCHighlighter = () => {
      checkEnabledStatus((enabled) => {
        if (!enabled) {
          log("UPC highlighting is disabled for this site");
          return;
        }

        log("Initializing UPC highlighter");

        // Initial scan
        setTimeout(scanAndHighlightUPCs, 500);

        // Set up mutation observer for dynamic content
        const observer = setupMutationObserver();

        // Listen for settings changes
        try {
          chrome.runtime.onMessage.addListener(
            (message, sender, sendResponse) => {
              if (message.action === "pm-settings-changed") {
                // Re-check enabled status when settings change
                checkEnabledStatus((newEnabled) => {
                  if (!newEnabled) {
                    // Remove highlighting if disabled
                    document
                      .querySelectorAll(".scout-upc-highlight")
                      .forEach((element) => {
                        const parent = element.parentNode;
                        if (parent) {
                          parent.replaceChild(
                            document.createTextNode(element.textContent),
                            element
                          );
                        }
                      });

                    // Remove styles
                    const styleElement = document.getElementById(
                      "scout-upc-highlighter-styles"
                    );
                    if (styleElement) {
                      styleElement.remove();
                    }

                    // Disconnect observer
                    if (observer) {
                      observer.disconnect();
                    }
                  } else {
                    // Re-initialize if re-enabled
                    location.reload();
                  }
                });
              }

              return true;
            }
          );
        } catch (e) {
          log("Failed to set up message listener:", e);
        }
      });
    };

    // Initialize when DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initializeUPCHighlighter);
    } else {
      initializeUPCHighlighter();
    }
  },
});
