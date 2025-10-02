import React from "react";
import { createRoot } from "react-dom/client";
import Toolbar from "../src/components/toolbar/Toolbar";
import { defineContentScript } from "wxt/utils/define-content-script";

function mountToolbar() {
  try {
    if (document.getElementById("paymore-toolbar-root")) return;
    const container = document.createElement("div");
    container.id = "paymore-toolbar-root";
    (document.body || document.documentElement).appendChild(container);
    const root = createRoot(container);
    root.render(<Toolbar />);
  } catch (e) {
    console.error("Failed to mount Paymore toolbar:", e);
  }
}

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  allFrames: true,
  main() {
    // Mount on DOMContentLoaded or immediately if already ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", mountToolbar, {
        once: true,
      });
    } else {
      mountToolbar();
    }
  },
});
