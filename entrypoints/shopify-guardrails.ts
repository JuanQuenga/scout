// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
/* global chrome */

import { defineContentScript } from "wxt/utils/define-content-script";
import { EBAY_CONDITION_MAP, isConditionMatch } from "../src/utils/condition-mapping";

/**
 * Shopify Guardrails Content Script
 *
 * This content script monitors Shopify product admin pages to ensure:
 * 1. eBay condition ID matches the regular Shopify condition
 * 2. Required Google Shopping metafields are filled in
 *
 * Visual Feedback:
 * - RED page border + notification: Condition mismatch detected
 * - ORANGE page border + notification: Empty Google fields detected
 */
export default defineContentScript({
  matches: ["https://admin.shopify.com/*", "https://*.myshopify.com/admin/*"],
  runAt: "document_idle",
  allFrames: false,
  main() {
    const log = (...args) => {
      try {
        console.log("[Scout Shopify Guardrails]", ...args);
      } catch (_) {}
    };

    // CSS for page borders and notifications
    const STYLES = `
      /* Page border outline */
      .scout-page-outline {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        border: 5px solid transparent;
        z-index: 999999;
      }

      .scout-page-outline.scout-outline-danger {
        border-color: #ef4444;
        animation: scout-outline-pulse-red 2s ease-in-out infinite;
      }

      .scout-page-outline.scout-outline-warning {
        border-color: #f59e0b;
        animation: scout-outline-pulse-orange 2s ease-in-out infinite;
      }

      @keyframes scout-outline-pulse-red {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      @keyframes scout-outline-pulse-orange {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      /* Notification container */
      .scout-notification-container {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 10000;
        max-width: 450px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .scout-notification {
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin-bottom: 12px;
        animation: scout-slide-in 0.3s ease-out;
      }

      @keyframes scout-slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .scout-notification-danger {
        background-color: #fef2f2;
        border: 2px solid #ef4444;
      }

      .scout-notification-warning {
        background-color: #fffbeb;
        border: 2px solid #f59e0b;
      }

      .scout-notification-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        font-weight: 600;
        font-size: 15px;
      }

      .scout-notification-danger .scout-notification-header {
        color: #991b1b;
      }

      .scout-notification-warning .scout-notification-header {
        color: #92400e;
      }

      .scout-notification-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      .scout-notification-danger .scout-notification-icon {
        fill: #ef4444;
      }

      .scout-notification-warning .scout-notification-icon {
        fill: #f59e0b;
      }

      .scout-notification-body {
        font-size: 14px;
        line-height: 1.6;
      }

      .scout-notification-danger .scout-notification-body {
        color: #7f1d1d;
      }

      .scout-notification-warning .scout-notification-body {
        color: #92400e;
      }

      .scout-notification-body.scout-clickable {
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .scout-notification-body.scout-clickable:hover {
        background-color: rgba(0, 0, 0, 0.03);
        border-radius: 4px;
        padding: 4px;
        margin: -4px;
      }

      .scout-notification-close {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        margin-left: auto;
        opacity: 0.7;
        transition: opacity 0.2s;
        font-size: 20px;
        line-height: 1;
      }

      .scout-notification-close:hover {
        opacity: 1;
      }

      .scout-mapping-list {
        margin: 12px 0;
        padding: 8px 12px;
        background-color: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
        max-height: 200px;
        overflow-y: auto;
        font-size: 12px;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      }

      .scout-mapping-list ul {
        margin: 0;
        padding-left: 20px;
        list-style: none;
      }

      .scout-mapping-list li {
        padding: 2px 0;
      }

      .scout-mapping-list strong {
        color: #1f2937;
        min-width: 50px;
        display: inline-block;
      }

      .scout-highlight-flash {
        animation: scout-highlight-flash 0.6s ease-out;
      }

      @keyframes scout-highlight-flash {
        0% { background-color: rgba(245, 158, 11, 0); }
        50% { background-color: rgba(245, 158, 11, 0.3); }
        100% { background-color: rgba(245, 158, 11, 0); }
      }
    `;

    // Inject styles
    const styleElement = document.createElement("style");
    styleElement.textContent = STYLES;
    styleElement.id = "scout-shopify-guardrails-styles";
    (document.head || document.documentElement).appendChild(styleElement);

    // State
    let conditionField = null;
    let ebayConditionField = null;
    let googleFields = [];
    let notificationContainer = null;
    const notifications = new Map();
    let googleFieldsWarningDismissed = false; // Track if user dismissed the warning
    let conditionMismatchDismissed = false; // Track if user dismissed the condition mismatch

    // Settings
    let guardrailSettings = {
      enableConditionCheck: true,
      enableGoogleFieldsCheck: true,
    };

    // Load settings from storage
    const loadSettings = () => {
      try {
        chrome.storage.sync.get(['cmdkSettings'], (result) => {
          if (result.cmdkSettings?.shopifyGuardrails) {
            guardrailSettings = {
              enableConditionCheck: result.cmdkSettings.shopifyGuardrails.enableConditionCheck ?? true,
              enableGoogleFieldsCheck: result.cmdkSettings.shopifyGuardrails.enableGoogleFieldsCheck ?? true,
            };
            log("Loaded guardrail settings:", guardrailSettings);

            // Recheck after settings load
            performAllChecks();
          }
        });
      } catch (e) {
        log("Failed to load settings:", e);
      }
    };

    // Create or update page outline
    const updatePageOutline = (variant) => {
      let outline = document.getElementById("scout-page-outline");

      // Remove outline if no issues
      if (!variant) {
        outline?.remove();
        return;
      }

      // Create outline if needed
      if (!outline && document.body) {
        outline = document.createElement("div");
        outline.id = "scout-page-outline";
        outline.classList.add("scout-page-outline");
        document.body.appendChild(outline);
      }

      if (outline) {
        outline.classList.remove("scout-outline-danger", "scout-outline-warning");
        if (variant === "danger") {
          outline.classList.add("scout-outline-danger");
          log("Applied RED page border (condition mismatch)");
        } else if (variant === "warning") {
          outline.classList.add("scout-outline-warning");
          log("Applied ORANGE page border (empty Google fields)");
        }
      }
    };

    // Find Shopify condition field
    const findConditionField = () => {
      // Look for the regular Condition metafield
      const conditionContainer = document.querySelector(
        '[id*="metafields.custom.condition-anchor"]'
      );

      if (conditionContainer) {
        log("Found condition container");

        // Find the inner ReadField div that contains the actual text
        // Look for the _ReadField_123bh class which is the innermost div with the text
        const readFields = conditionContainer.querySelectorAll('[class*="_ReadField_"]');

        for (const readField of readFields) {
          const className = readField.className || "";
          const isPlaceholder = className.includes("_ReadField--placeholder");
          const value = readField.textContent?.trim() || "";

          log("Checking ReadField:", { className, isPlaceholder, value });

          // Skip placeholder fields and fields without values
          if (!isPlaceholder && value) {
            conditionField = {
              element: readField,
              value: value,
            };
            log("✓ Found Condition field:", conditionField.value);
            return true;
          }
        }

        log("✗ No valid condition field found (all fields empty or placeholder)");
      } else {
        log("✗ Condition container not found");
      }

      return false;
    };

    // Find eBay condition field
    const findEbayConditionField = () => {
      // Look for the eBay Condition metafield
      const ebayConditionContainer = document.querySelector(
        '[id*="metafields.custom.ebay_condition-anchor"]'
      );

      if (ebayConditionContainer) {
        log("Found eBay condition container");

        // Find the inner ReadField div that contains the actual text
        const readFields = ebayConditionContainer.querySelectorAll('[class*="_ReadField_"]');

        for (const readField of readFields) {
          const className = readField.className || "";
          const isPlaceholder = className.includes("_ReadField--placeholder");
          const value = readField.textContent?.trim() || "";

          log("Checking ReadField:", { className, isPlaceholder, value });

          // Skip placeholder fields and fields without values
          if (!isPlaceholder && value) {
            const parsedId = parseInt(value, 10);

            ebayConditionField = {
              element: readField,
              value: value,
              id: parsedId,
            };

            log("✓ Found eBay Condition field:", ebayConditionField.value, "ID:", parsedId);

            if (isNaN(parsedId)) {
              log("⚠️ Warning: eBay condition ID is not a valid number:", value);
            }

            return true;
          }
        }

        log("✗ No valid eBay condition field found (all fields empty or placeholder)");
      } else {
        log("✗ eBay condition container not found");
      }

      return false;
    };

    // Find Google Shopping metafields
    const findGoogleFields = () => {
      googleFields = [];

      // Look for Google Shopping metafields with mm-google-shopping namespace
      const googleSelectors = [
        '[id*="metafields.mm-google-shopping"]',
        '[id*="metafields.custom.google"]',
      ];

      for (const selector of googleSelectors) {
        const containers = document.querySelectorAll(selector);

        for (const container of containers) {
          // Check if this is a Google: Brand, Google: MPN, or Google: UPC field
          const label = container.querySelector("label");
          const labelText = label?.textContent?.trim() || "";

          if (
            labelText.includes("Google:") ||
            container.id.includes("mm-google-shopping")
          ) {
            // Find the ReadField
            const readField = container.querySelector('[class*="_ReadField_"]');

            if (readField) {
              const value = readField.textContent?.trim() || "";
              const isEmpty =
                !value ||
                readField.classList.contains("_ReadField--placeholder");

              if (isEmpty) {
                googleFields.push({
                  element: readField,
                  label: labelText,
                  isEmpty: true,
                });
                log("Found EMPTY Google field:", labelText);
              } else {
                log("Found FILLED Google field:", labelText, "=", value);
              }
            }
          }
        }
      }

      const emptyCount = googleFields.filter((f) => f.isEmpty).length;
      log(`Found ${emptyCount} empty Google fields out of ${googleFields.length} total`);

      return emptyCount > 0;
    };

    // Check if conditions match
    const checkConditionsMatch = () => {
      log("=== Checking conditions ===");

      if (!conditionField || !ebayConditionField) {
        log("✗ Missing condition fields:", {
          hasConditionField: !!conditionField,
          hasEbayConditionField: !!ebayConditionField,
        });
        return null;
      }

      const shopifyCondition = conditionField.value;
      const ebayConditionId = ebayConditionField.id;

      log("Extracted values:", {
        shopifyCondition,
        ebayConditionId,
        shopifyConditionType: typeof shopifyCondition,
        ebayConditionIdType: typeof ebayConditionId,
      });

      if (!shopifyCondition || isNaN(ebayConditionId)) {
        log("✗ Invalid condition values:", {
          shopifyCondition: shopifyCondition || "(empty)",
          shopifyConditionValid: !!shopifyCondition,
          ebayConditionId,
          ebayConditionIdValid: !isNaN(ebayConditionId),
        });
        return null;
      }

      const matches = isConditionMatch(shopifyCondition, ebayConditionId);

      log(matches ? "✓" : "✗", "Condition check result:", {
        shopify: shopifyCondition,
        ebayId: ebayConditionId,
        ebayName: EBAY_CONDITION_MAP[ebayConditionId] || "(unknown)",
        matches,
      });

      return matches;
    };

    // Scroll to element with highlight
    const scrollToElement = (element) => {
      if (!element) return;

      const actualElement = element.element || element;

      try {
        actualElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });

        // Flash highlight
        actualElement.classList.add("scout-highlight-flash");
        setTimeout(() => {
          actualElement.classList.remove("scout-highlight-flash");
        }, 700);

        log("Scrolled to element");
      } catch (e) {
        log("Error scrolling:", e);
      }
    };

    // Create notification container
    const createNotificationContainer = () => {
      if (!notificationContainer) {
        notificationContainer = document.createElement("div");
        notificationContainer.className = "scout-notification-container";
        document.body.appendChild(notificationContainer);
      }
    };

    // Remove notification
    const removeNotification = (type) => {
      if (!notifications.has(type)) return;

      const notification = notifications.get(type);
      notification.remove();
      notifications.delete(type);

      if (notifications.size === 0 && notificationContainer) {
        notificationContainer.remove();
        notificationContainer = null;
      }
    };

    // Show notification
    const showNotification = (type, data) => {
      // Check if notification already exists with same data
      if (notifications.has(type)) {
        const existingNotification = notifications.get(type);

        // Store the current data hash to avoid recreating
        const dataHash = JSON.stringify(data);
        if (existingNotification.dataset.dataHash === dataHash) {
          // Same data, don't recreate
          return;
        }

        // Different data, remove old notification
        removeNotification(type);
      }

      createNotificationContainer();

      const notification = document.createElement("div");
      notification.className = "scout-notification";
      notification.dataset.dataHash = JSON.stringify(data);

      if (type === "condition-mismatch") {
        notification.classList.add("scout-notification-danger");

        const header = document.createElement("div");
        header.className = "scout-notification-header";

        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        icon.setAttribute("class", "scout-notification-icon");
        icon.setAttribute("viewBox", "0 0 20 20");
        icon.innerHTML =
          '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>';

        const title = document.createElement("span");
        title.textContent = "Condition Mismatch!";

        const closeButton = document.createElement("button");
        closeButton.className = "scout-notification-close";
        closeButton.innerHTML = "&times;";
        closeButton.addEventListener("click", () => removeNotification(type));

        header.appendChild(icon);
        header.appendChild(title);
        header.appendChild(closeButton);

        const body = document.createElement("div");
        body.className = "scout-notification-body";

        // Only show the conditions we use
        const allowedConditions = {
          1000: "New",
          1500: "New Other",
          2750: "Like New",
          3000: "Used",
          4000: "Very Good",
          5000: "Good",
          6000: "Acceptable",
          7000: "For Parts (not working)",
        };

        const conditionList = Object.entries(allowedConditions)
          .map(([id, name]) => {
            const videoGameNote = ["2750", "4000", "5000", "6000"].includes(id)
              ? ' <em style="color: #7c2d12;">(Video Games Only)</em>'
              : '';
            return `<li><strong>${id}:</strong> ${name}${videoGameNote}</li>`;
          })
          .join("");

        const contentDiv = document.createElement("div");
        contentDiv.className = "scout-clickable";
        contentDiv.innerHTML = `
          <p><strong>The eBay condition doesn't match the Shopify condition!</strong></p>
          <p>Shopify Condition: <strong>${data.shopifyCondition}</strong></p>
          <p>eBay Condition ID: <strong>${data.ebayConditionId}</strong> (${allowedConditions[data.ebayConditionId] || EBAY_CONDITION_MAP[data.ebayConditionId] || "Unknown"})</p>
          <div class="scout-mapping-list">
            <strong>eBay Condition ID Mappings:</strong>
            <ul>${conditionList}</ul>
          </div>
          <p style="font-style: italic; font-size: 12px; margin-top: 8px;">💡 Click to scroll to eBay condition field</p>
        `;

        contentDiv.addEventListener("click", () => {
          scrollToElement(ebayConditionField);
        });

        // Add dismiss button
        const dismissButton = document.createElement("button");
        dismissButton.textContent = "Dismiss";
        dismissButton.style.cssText = `
          margin-top: 12px;
          padding: 6px 12px;
          background-color: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          width: 100%;
          transition: background-color 0.2s;
        `;

        dismissButton.addEventListener("mouseenter", () => {
          dismissButton.style.backgroundColor = "#dc2626";
        });

        dismissButton.addEventListener("mouseleave", () => {
          dismissButton.style.backgroundColor = "#ef4444";
        });

        dismissButton.addEventListener("click", () => {
          conditionMismatchDismissed = true;
          removeNotification(type);
          updatePageOutline(null); // Remove the red border
          log("✓ Condition mismatch warning dismissed until page refresh");
        });

        body.appendChild(contentDiv);
        body.appendChild(dismissButton);

        notification.appendChild(header);
        notification.appendChild(body);
      } else if (type === "google-fields") {
        notification.classList.add("scout-notification-warning");

        const header = document.createElement("div");
        header.className = "scout-notification-header";

        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        icon.setAttribute("class", "scout-notification-icon");
        icon.setAttribute("viewBox", "0 0 20 20");
        icon.innerHTML =
          '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>';

        const title = document.createElement("span");
        title.textContent = "Empty Google Fields";

        const closeButton = document.createElement("button");
        closeButton.className = "scout-notification-close";
        closeButton.innerHTML = "&times;";
        closeButton.addEventListener("click", () => removeNotification(type));

        header.appendChild(icon);
        header.appendChild(title);
        header.appendChild(closeButton);

        const body = document.createElement("div");
        body.className = "scout-notification-body";

        const fieldList = data.fields
          .map((f) => `<li>${f.label}</li>`)
          .join("");

        const contentDiv = document.createElement("div");
        contentDiv.className = "scout-clickable";
        contentDiv.innerHTML = `
          <p><strong>Found ${data.count} empty Google Shopping field(s):</strong></p>
          <ul style="margin: 8px 0; padding-left: 20px;">${fieldList}</ul>
          <p>Please fill these fields to ensure complete Google Shopping data.</p>
          <p style="font-style: italic; font-size: 12px; margin-top: 8px;">💡 Click to scroll to first empty field</p>
        `;

        contentDiv.addEventListener("click", () => {
          if (data.fields.length > 0) {
            scrollToElement(data.fields[0]);
          }
        });

        // Add dismiss button
        const dismissButton = document.createElement("button");
        dismissButton.textContent = "Dismiss";
        dismissButton.style.cssText = `
          margin-top: 12px;
          padding: 6px 12px;
          background-color: #f59e0b;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          width: 100%;
          transition: background-color 0.2s;
        `;

        dismissButton.addEventListener("mouseenter", () => {
          dismissButton.style.backgroundColor = "#d97706";
        });

        dismissButton.addEventListener("mouseleave", () => {
          dismissButton.style.backgroundColor = "#f59e0b";
        });

        dismissButton.addEventListener("click", () => {
          googleFieldsWarningDismissed = true;
          removeNotification(type);
          updatePageOutline(null); // Remove the orange border
          log("✓ Google fields warning dismissed until page refresh");
        });

        body.appendChild(contentDiv);
        body.appendChild(dismissButton);

        notification.appendChild(header);
        notification.appendChild(body);
      }

      notificationContainer.appendChild(notification);
      notifications.set(type, notification);
      log("✓ Notification displayed:", type);
    };

    // Perform all checks
    const performAllChecks = () => {
      log("=== Performing all checks ===");

      // Always re-find fields to get fresh values
      // (mutation observer resets the cache when changes are detected)
      if (!conditionField) {
        findConditionField();
      }
      if (!ebayConditionField) {
        findEbayConditionField();
      }

      // Check conditions
      const conditionsMatch = guardrailSettings.enableConditionCheck ? checkConditionsMatch() : null;
      const hasEmptyGoogleFields = guardrailSettings.enableGoogleFieldsCheck ? findGoogleFields() : false;

      // Determine page border variant
      let borderVariant = null;

      if (guardrailSettings.enableConditionCheck && conditionsMatch === false && !conditionMismatchDismissed) {
        // Condition mismatch is the highest priority (RED) - only show if enabled and not dismissed
        borderVariant = "danger";
        showNotification("condition-mismatch", {
          shopifyCondition: conditionField.value,
          ebayConditionId: ebayConditionField.id,
        });
        removeNotification("google-fields");
      } else {
        removeNotification("condition-mismatch");

        if (guardrailSettings.enableGoogleFieldsCheck && hasEmptyGoogleFields && !googleFieldsWarningDismissed) {
          // Empty Google fields (ORANGE) - only show if enabled and not dismissed
          borderVariant = "warning";
          const emptyFields = googleFields.filter((f) => f.isEmpty);
          showNotification("google-fields", {
            count: emptyFields.length,
            fields: emptyFields,
          });
        } else {
          removeNotification("google-fields");
        }
      }

      updatePageOutline(borderVariant);
    };

    // Debounced check
    let checkTimer = null;
    const debouncedCheck = (delay = 100) => {
      if (checkTimer) clearTimeout(checkTimer);
      checkTimer = setTimeout(performAllChecks, delay);
    };

    // Set up mutation observer
    const setupMutationObserver = () => {
      const observer = new MutationObserver((mutations) => {
        let shouldRecheck = false;
        let foundConditionChange = false;
        let foundEbayConditionChange = false;
        let foundGoogleFieldChange = false;

        for (const mutation of mutations) {
          // Check if the mutation is within a metafield container
          let targetElement = mutation.target;

          // For text node changes, check the parent element
          if (targetElement.nodeType === Node.TEXT_NODE) {
            targetElement = targetElement.parentElement;
          }

          if (!targetElement || !targetElement.closest) continue;

          // Check for condition field changes
          const conditionContainer = targetElement.closest('[id*="metafields.custom.condition-anchor"]');
          if (conditionContainer && !conditionContainer.id.includes("ebay_condition")) {
            foundConditionChange = true;
            log("🔄 Detected Condition field change:", mutation.type);
            shouldRecheck = true;
          }

          // Check for eBay condition field changes
          const ebayConditionContainer = targetElement.closest('[id*="metafields.custom.ebay_condition-anchor"]');
          if (ebayConditionContainer) {
            foundEbayConditionChange = true;
            log("🔄 Detected eBay Condition field change:", mutation.type);
            shouldRecheck = true;
          }

          // Check for Google Shopping field changes
          const googleContainer = targetElement.closest('[id*="metafields.custom.google"]') ||
            targetElement.closest('[id*="metafields.mm-google-shopping"]');
          if (googleContainer) {
            foundGoogleFieldChange = true;
            log("🔄 Detected Google field change:", mutation.type);
            shouldRecheck = true;
          }

          // Also check for any ReadField changes
          if (targetElement.className && typeof targetElement.className === 'string' &&
              targetElement.className.includes("_ReadField")) {
            log("🔄 Detected ReadField change:", mutation.type, targetElement.className);
            shouldRecheck = true;
          }
        }

        if (shouldRecheck) {
          // Reset cached fields if they changed
          if (foundConditionChange) {
            log("Resetting condition field cache");
            conditionField = null;
            // Reset dismiss flag when condition changes
            conditionMismatchDismissed = false;
          }
          if (foundEbayConditionChange) {
            log("Resetting eBay condition field cache");
            ebayConditionField = null;
            // Reset dismiss flag when eBay condition changes
            conditionMismatchDismissed = false;
          }
          if (foundGoogleFieldChange) {
            // Reset dismiss flag when Google fields change
            googleFieldsWarningDismissed = false;
          }

          // Use shorter debounce for more responsive updates
          debouncedCheck(150);
        }
      });

      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
          characterDataOldValue: true,
          attributes: true,
          attributeFilter: ["class"],
        });

        log("✓ Mutation observer set up");
      }

      return observer;
    };

    // Initialize
    const initialize = () => {
      log("Initializing Shopify Guardrails");

      // Initial check
      setTimeout(() => {
        findConditionField();
        findEbayConditionField();
        findGoogleFields();
        performAllChecks();
      }, 1000);

      // Set up mutation observer
      setupMutationObserver();

      // Re-check on visibility change
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          log("Tab became visible, rechecking...");
          debouncedCheck(500);
        }
      });

      // Periodic check every 10 seconds
      setInterval(() => {
        if (!document.hidden) {
          performAllChecks();
        }
      }, 10000);

      // Listen for message events
      try {
        chrome.runtime.onMessage.addListener((message) => {
          if (
            message.action === "pm-settings-changed" ||
            message.action === "recheck-conditions"
          ) {
            performAllChecks();
          } else if (message.action === "guardrails-settings-changed") {
            log("Received settings update:", message.settings);
            guardrailSettings = {
              enableConditionCheck: message.settings.enableConditionCheck ?? true,
              enableGoogleFieldsCheck: message.settings.enableGoogleFieldsCheck ?? true,
            };
            // Clear all notifications and borders when settings change
            removeNotification("condition-mismatch");
            removeNotification("google-fields");
            updatePageOutline(null);
            // Recheck with new settings
            performAllChecks();
          }
          return true;
        });
      } catch (e) {
        log("Failed to set up message listener:", e);
      }

      // Load settings from storage
      loadSettings();

      // Retry finding fields for the first 30 seconds
      let retryCount = 0;
      const maxRetries = 15;
      const retryInterval = setInterval(() => {
        if (conditionField && ebayConditionField) {
          clearInterval(retryInterval);
          return;
        }

        retryCount++;
        if (retryCount >= maxRetries) {
          clearInterval(retryInterval);
          log("Stopped retrying after 30 seconds");
          return;
        }

        log(`Retry ${retryCount}: Looking for fields...`);
        if (!conditionField) findConditionField();
        if (!ebayConditionField) findEbayConditionField();

        if (conditionField && ebayConditionField) {
          log("Found all fields on retry!");
          performAllChecks();
          clearInterval(retryInterval);
        }
      }, 2000);
    };

    // Start when DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initialize);
    } else {
      initialize();
    }
  },
});
