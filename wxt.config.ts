import { defineConfig, type WxtViteConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  // Use the official Tailwind v4 Vite plugin for class scanning + HMR.
  vite: () => ({ plugins: [tailwindcss()] } as WxtViteConfig),
  outDir: ".output", // Base output directory
  outDirTemplate: "mochi", // Custom output directory name (removes browser/manifest folder nesting)
  contentScripts: [
    {
      matches: ["<all_urls>"],
      entries: ["controller-activity"],
    },
  ],
  manifest: {
    name: "Mochi",
    version: "1.0.0",
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
      16: "assets/icons/icon16.svg",
      32: "assets/icons/icon32.svg",
      48: "assets/icons/icon48.svg",
      128: "assets/icons/icon128.svg",
    },
    action: {
      default_icon: "assets/images/mochi-brand.svg",
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
    ],
    content_scripts: [
      {
        matches: ["<all_urls>"],
        run_at: "document_idle",
        js: ["controller-activity.js"],
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
