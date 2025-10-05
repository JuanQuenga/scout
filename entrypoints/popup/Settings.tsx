import { createRoot } from "react-dom/client";
import SettingsPopup from "../../src/components/popups/SettingsPopup";

/**
 * @fileoverview PayMore CMDK Settings Popup
 * @description Settings interface for configuring CMDK sources
 * @version 1.0.0
 * @author PayMore Team
 * @license MIT
 */

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("root");
  if (container) {
    const root = createRoot(container);
    root.render(<SettingsPopup />);
  }
});
