import { createRoot } from "react-dom/client";
import CMDKPopup from "./CMDKPopup";
import "../../src/components/cmdk-palette/styles.css";

/**
 * @fileoverview PayMore Chrome Extension Popup Script
 * @description CMDK Command Palette Popup
 * @version 2.0.0
 * @author PayMore Team
 * @license MIT
 */

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("root");
  if (container) {
    const root = createRoot(container);
    root.render(<CMDKPopup />);
  }
});
