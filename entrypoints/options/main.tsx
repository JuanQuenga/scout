import { createRoot } from "react-dom/client";
import Popup from "../popup/Popup";
import "../popup/popup.css";

/**
 * @fileoverview PayMore Chrome Extension Options/Settings Page
 * @description React-based options page with shadcn UI components
 * @version 2.0.0
 * @author PayMore Team
 * @license MIT
 */

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("root");
  if (container) {
    const root = createRoot(container);
    root.render(<Popup />);
  }
});
