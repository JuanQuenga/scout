import { defineConfig, type WxtViteConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  // Use the official Tailwind v4 Vite plugin for class scanning + HMR.
  vite: () => ({ plugins: [tailwindcss()] } as WxtViteConfig),
  outDir: ".output", // Base output directory
  outDirTemplate: "scout", // Custom output directory name (removes browser/manifest folder nesting)
  manifest: {
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["controller-activity.js"],
        run_at: "document_idle",
      },
      {
        matches: ["<all_urls>"],
        js: ["context-menu.js"],
        run_at: "document_idle",
      },
      {
        matches: ["<all_urls>"],
        js: ["upc-highlighter.js"],
        run_at: "document_idle",
        all_frames: true,
      },
      {
        matches: [
          "https://admin.shopify.com/*",
          "https://*.myshopify.com/admin/*",
        ],
        js: ["shopify-guardrails.js"],
        run_at: "document_idle",
      },
      {
        matches: ["https://www.ebay.com/sch/*"],
        js: ["ebay-sold-summary.js"],
        run_at: "document_idle",
      },
    ],
    name: "Scout",
    version: "1.0.1",
    description:
      "A versatile Chrome extension with command palette, controller testing, and multi-provider search capabilities.",
    permissions: [
      "storage",
      "tabs",
      "activeTab",
      "scripting",
      "sidePanel",
      "system.display",
      // Needed for adding right-click context menu actions
      "contextMenus",
      // Needed for CMDK bookmarks and history
      "bookmarks",
      "history",
    ],
    host_permissions: ["<all_urls>"],
    icons: {
      16: "assets/icons/dog-16.png",
      32: "assets/icons/dog-32.png",
      48: "assets/icons/dog-48.png",
      128: "assets/icons/dog-128.png",
    },
    action: {
      default_icon: {
        16: "assets/icons/dog-16.png",
        32: "assets/icons/dog-32.png",
        48: "assets/icons/dog-48.png",
        128: "assets/icons/dog-128.png",
      },
      default_popup: "popup.html",
    },
    side_panel: {
      default_path: "sidepanel.html",
    },
    options_page: "options.html",
    web_accessible_resources: [
      {
        resources: ["install.html"],
        matches: ["<all_urls>"],
      },
      {
        resources: ["assets/images/*"],
        matches: ["<all_urls>"],
      },
      {
        resources: ["assets/icons/*"],
        matches: ["<all_urls>"],
      },
    ],
    commands: {
      _execute_action: {
        suggested_key: {
          default: "Ctrl+Shift+K",
          mac: "Command+Shift+K",
        },
        description: "Open Command Menu Popup",
      },
      "open-options": {
        suggested_key: {
          default: "Ctrl+Shift+O",
          mac: "Command+Shift+O",
        },
        description: "Open extension options",
      },
      "open-controller-testing": {
        suggested_key: {
          default: "Ctrl+J",
          mac: "Command+J",
        },
        description: "Open Controller Testing Sidepanel",
      },
    },
  },
} as any);
