import { createRoot } from "react-dom/client";
import Popup from "./Popup";
import "./popup.css";

/**
 * @fileoverview PayMore Chrome Extension Popup Script
 * @description React-based popup component with shadcn UI components
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
