import React from "react";
import { createRoot } from "react-dom/client";
import Toolbar from "../src/components/toolbar/Toolbar";
import { defineContentScript } from "wxt/utils/define-content-script";

function mountToolbar() {
  try {
    if (document.getElementById("scout-toolbar-root")) return;

    const container = document.createElement("div");
    container.id = "scout-toolbar-root";
    (document.body || document.documentElement).appendChild(container);

    const root = createRoot(container);
    root.render(<Toolbar />);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[Scout Toolbar] Failed to mount toolbar:", e);
  }
}

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  allFrames: true,
  main() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", mountToolbar, {
        once: true,
      });
    } else {
      mountToolbar();
    }
  },
});


