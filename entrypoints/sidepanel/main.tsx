import { createRoot } from "react-dom/client";
import ControllerTesting from "../../src/components/sidepanel/ControllerTesting";

/**
 * @fileoverview PayMore Chrome Extension Side Panel Script
 * @description Manages the side panel functionality and tool navigation
 * @version 1.0.0
 * @author PayMore Team
 * @license MIT
 */

// Initialize immediately without waiting for DOMContentLoaded
const initSidepanel = () => {
  const container = document.getElementById("controller-testing-container");
  if (container) {
    const root = createRoot(container);
    root.render(<ControllerTesting />);
  }

  const toolHeader = document.querySelector("#current-tool");
  if (toolHeader) {
    toolHeader.textContent = "Controller Testing";
  }

  const settingsBtn = document.querySelector("#btn-settings");
  settingsBtn?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // Send a message to background script indicating sidepanel is ready
  try {
    chrome.runtime.sendMessage({
      action: "sidepanelReady",
      tool: "controller-testing",
      timestamp: Date.now(),
    });
  } catch (e) {
    console.error("Error sending sidepanel ready message:", e);
  }
};

// Try to initialize immediately
initSidepanel();

// Also initialize on DOMContentLoaded as a fallback
document.addEventListener("DOMContentLoaded", initSidepanel);
