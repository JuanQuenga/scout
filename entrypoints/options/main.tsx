import { createRoot } from "react-dom/client";
import SettingsPopup from "../../src/components/popups/SettingsPopup";
import "../popup/popup.css";

/**
 * @fileoverview PayMore Chrome Extension Options/Settings Page
 * @description Extension Settings configuration page
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
