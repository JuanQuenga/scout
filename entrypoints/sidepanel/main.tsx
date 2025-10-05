import { createRoot } from "react-dom/client";
import ControllerTesting from "../../src/components/sidepanel/ControllerTesting";

/**
 * @fileoverview PayMore Chrome Extension Side Panel Script
 * @description Manages the side panel functionality and tool navigation
 * @version 1.0.0
 * @author PayMore Team
 * @license MIT
 */

document.addEventListener("DOMContentLoaded", () => {
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
});
