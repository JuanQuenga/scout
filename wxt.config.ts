import { defineConfig, type WxtViteConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  // Use the official Tailwind v4 Vite plugin for class scanning + HMR.
  vite: () => ({ plugins: [tailwindcss()] } as WxtViteConfig),
  contentScripts: [
    {
      matches: ["<all_urls>"],
      entries: ["content", "toolbar-mount"],
    },
    {
      matches: ["*://pos.paymore.tech/inventory*"],
      entries: ["content-pos-inventory"],
    },
  ],
  manifest: {
    name: "Paymore",
    version: "1.0.5",
    description: "Chrome extension for Paymore Employees.",
    permissions: [
      "storage",
      "tabs",
      "activeTab",
      "scripting",
      "sidePanel",
      "system.display",
      // Needed for adding right-click context menu actions
      "contextMenus",
    ],
    host_permissions: ["<all_urls>"],
    icons: {
      16: "assets/icons/icon16.png",
      32: "assets/icons/icon32.png",
      48: "assets/icons/icon48.png",
      128: "assets/icons/icon128.png",
    },
    action: {
      default_icon: "assets/images/brand.png",
    },
    side_panel: {
      default_path: "sidepanel.html",
    },
    // Expose toolbar and assets to content scripts
    web_accessible_resources: [
      {
        resources: [
          "components/floating-appbar/toolbar.html",
          "assets/images/*",
        ],
        matches: ["<all_urls>"],
      },
    ],
  },
} as any);
