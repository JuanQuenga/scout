// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
/* global chrome */

import { defineContentScript } from "wxt/utils/define-content-script";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  Search,
  Barcode,
  PackageSearch,
  TrendingUp,
  Gamepad2,
} from "lucide-react";

/**
 * Radial Context Menu Content Script
 * Shows a circular quick-action wheel at the cursor on right-click.
 * - Left click selects action
 * - ESC/scroll/outside click closes
 * - Alt+right-click passes through native context menu
 */
export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  allFrames: false,
  main() {
    if (window.top !== window) return;

    const log = (...args) => {
      try {
        console.log("[Scout Radial]", ...args);
      } catch (_) {}
    };

    // Feature flag from settings (default enabled)
    let enabled = true;
    try {
      chrome.storage.sync.get(["cmdkSettings"], (result) => {
        enabled = result?.cmdkSettings?.radialMenu?.enabled ?? true;
      });
    } catch (_) {}

    // Guard: don't duplicate
    if ((document as any)._scoutRadialMenuInstalled) return;
    (document as any)._scoutRadialMenuInstalled = true;

    // Actions available in the wheel
    type RadialAction = {
      id: string;
      label: string;
      hotkey?: string;
      icon?: string; // optional emoji or URL data
      handler: (ctx: { x: number; y: number; selection: string }) => void;
    };

    const openUrl = (url: string) => {
      try {
        chrome.runtime.sendMessage({ action: "openUrl", url });
      } catch (_) {}
    };

    const openToolNear = (tool: string, x: number, y: number) => {
      try {
        chrome.runtime.sendMessage({
          action: "openToolWindowAt",
          tool,
          anchor: { x, y },
        });
      } catch (_) {}
    };

    const buildEbaySoldUrl = (q: string) => {
      try {
        const u = new URL(
          "https://www.ebay.com/sch/i.html?_nkw=x&_sacat=0&_from=R40&_dmd=2&rt=nc&LH_Sold=1&LH_Complete=1"
        );
        u.searchParams.set("_nkw", q);
        return u.href;
      } catch (_) {
        return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(
          q
        )}&LH_Sold=1&LH_Complete=1`;
      }
    };

    const actions: RadialAction[] = [
      {
        id: "ebay-sold",
        label: "eBay Sold",
        hotkey: "E",
        handler: ({ selection }) => {
          if (!selection) return;
          openUrl(buildEbaySoldUrl(selection));
        },
      },
      {
        id: "upc-google",
        label: "Google UPC",
        hotkey: "G",
        handler: ({ selection }) => {
          if (!selection) return;
          openUrl(
            `https://www.google.com/search?q=${encodeURIComponent(
              "UPC for " + selection
            )}`
          );
        },
      },
      {
        id: "upcitemdb",
        label: "UPCItemDB",
        hotkey: "U",
        handler: ({ selection }) => {
          if (!selection) return;
          openUrl(
            `https://www.upcitemdb.com/upc/${encodeURIComponent(selection)}`
          );
        },
      },
      {
        id: "pricecharting",
        label: "PriceCharting",
        hotkey: "P",
        handler: ({ selection }) => {
          if (!selection) return;
          openUrl(
            `https://www.pricecharting.com/search-products?type=prices&q=${encodeURIComponent(
              selection
            )}&go=Go`
          );
        },
      },
      {
        id: "controller",
        label: "Controller Test",
        hotkey: "C",
        handler: ({ x, y }) => {
          openToolNear("controller-testing", x, y);
        },
      },
    ];

    // Shadow DOM host to isolate styles and stop site CSS/JS interference
    let host: HTMLDivElement | null = null;
    let shadow: ShadowRoot | null = null;
    let reactRoot: Root | null = null;
    let reactMountEl: HTMLDivElement | null = null;

    const stylesCss = () => {
      // Sizes tuned for a tight circular layout
      const MENU_DIAMETER = 280; // px
      const ITEM_DIAMETER = 56; // px
      const CENTER_DIAMETER = 104; // px
      return `
        :host{all:initial}
        .scout-radial-root{position:fixed;inset:0;z-index:2147483646;}
        .scout-radial-overlay{position:fixed;inset:0;background:transparent;pointer-events:auto}
        .scout-radial-menu{position:absolute;transform:translate(-50%,-50%);width:${MENU_DIAMETER}px;height:${MENU_DIAMETER}px;border-radius:9999px;background:radial-gradient(circle at 50% 45%, rgba(17,24,39,0.96), rgba(17,24,39,0.9));box-shadow:0 14px 40px rgba(0,0,0,.42);backdrop-filter:saturate(120%) blur(8px);display:grid;place-items:center}
        .scout-radial-center{width:${CENTER_DIAMETER}px;height:${CENTER_DIAMETER}px;border-radius:9999px;background:rgba(31,41,55,0.95);display:flex;align-items:center;justify-content:center;color:#e5e7eb;font-weight:650;font-family:ui-sans-serif, system-ui, -apple-system;letter-spacing:.2px;border:1px solid rgba(255,255,255,0.08);text-align:center;padding:8px}
        .scout-radial-ring{position:absolute;inset:0}
        .scout-radial-item{position:absolute;top:50%;left:50%;width:${ITEM_DIAMETER}px;height:${ITEM_DIAMETER}px;margin:${
        -ITEM_DIAMETER / 2
      }px;border-radius:9999px;background:rgba(55,65,81,0.95);color:#e5e7eb;display:flex;align-items:center;justify-content:center;text-align:center;font:600 11px/1.1 ui-sans-serif, system-ui, -apple-system;padding:0 8px;border:1px solid rgba(255,255,255,0.08);box-shadow:0 4px 16px rgba(0,0,0,.25);transition:transform .12s ease, background .12s ease, color .12s ease}
        .scout-radial-item:hover,.scout-radial-item.active{background:#10b981;color:#062019;transform:translate(var(--tx), var(--ty)) scale(1.06)}
        .scout-radial-item .label{display:block;margin-top:6px;font-weight:600;font-size:10px;opacity:.9}
        .scout-radial-item .hint{position:absolute;bottom:-18px;color:#9ca3af;font:500 10px/1 ui-sans-serif, system-ui, -apple-system;letter-spacing:.2px}
        .scout-radial-icon{display:flex;align-items:center;justify-content:center}
      `;
    };

    const ensureHost = () => {
      if (host && shadow) return;
      host = document.createElement("div");
      // Prevent site CSS from grabbing it
      host.style.all = "initial";
      host.className = "scout-radial-host";
      // Highest z-index container, fixed to viewport
      host.style.position = "fixed";
      host.style.inset = "0";
      host.style.zIndex = "2147483646";
      shadow = host.attachShadow({ mode: "open" });
      // Root container within shadow
      const root = document.createElement("div");
      root.className = "scout-radial-root";
      const style = document.createElement("style");
      style.textContent = stylesCss();
      shadow.appendChild(style);
      shadow.appendChild(root);
      document.documentElement.appendChild(host);
    };

    let overlay: HTMLDivElement | null = null; // inside shadow
    let menu: HTMLDivElement | null = null; // inside shadow
    let isOpen = false;
    let openAt = { x: 0, y: 0 };
    let lastSelection = "";

    const getSelectionText = () => {
      try {
        return (window.getSelection()?.toString() || "").trim();
      } catch (_) {
        return "";
      }
    };

    const layoutItems = () => {
      if (!menu) return;
      const count = actions.length;
      // Match ring radius to menu circle and item size.
      const menuDiameter = 280;
      const itemDiameter = 56;
      const ringRadius = menuDiameter / 2 - itemDiameter / 2 - 10; // inner margin
      actions.forEach((action, idx) => {
        const theta = (idx / count) * Math.PI * 2 - Math.PI / 2; // start at top
        const x = Math.cos(theta) * ringRadius;
        const y = Math.sin(theta) * ringRadius;
        const el = menu.querySelector(
          `[data-id="${action.id}"]`
        ) as HTMLDivElement;
        if (el) {
          el.style.setProperty("--tx", `calc(-50% + ${x}px)`);
          el.style.setProperty("--ty", `calc(-50% + ${y}px)`);
          el.style.transform = `translate(var(--tx), var(--ty))`;
        }
      });
    };

    const closeMenu = () => {
      if (!isOpen) return;
      isOpen = false;
      // Unmount React tree
      try {
        if (reactRoot) {
          reactRoot.unmount();
        }
      } catch (_) {}
      reactRoot = null;
      if (reactMountEl && reactMountEl.parentNode)
        reactMountEl.parentNode.removeChild(reactMountEl);
      reactMountEl = null;
      // Clean up shadow contents but keep host for reuse
      if (overlay && overlay.parentNode)
        overlay.parentNode.removeChild(overlay);
      overlay = null;
      menu = null;
      document.removeEventListener("scroll", onPageScroll, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("contextmenu", onContextMenuIntercept, true);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }
      // hotkeys
      const key = (e.key || "").toUpperCase();
      const match = actions.find((a) => a.hotkey === key);
      if (match) {
        e.preventDefault();
        try {
          match.handler({ x: openAt.x, y: openAt.y, selection: lastSelection });
        } catch (_) {}
        closeMenu();
      }
    };

    const onOverlayPointer = (e: Event) => {
      // Capture and stop site listeners while menu is open
      e.stopPropagation();
      e.stopImmediatePropagation?.();
    };
    const onOverlayClick = (e: MouseEvent) => {
      if (!isOpen || !menu) return;
      const target = e.composedPath()[0] as HTMLElement;
      const item = (target as HTMLElement).closest?.(
        ".scout-radial-item"
      ) as HTMLElement | null;
      if (!item) {
        closeMenu();
        return;
      }
      const id = item.getAttribute("data-id");
      const action = actions.find((a) => a.id === id);
      if (action) {
        e.preventDefault();
        try {
          action.handler({
            x: openAt.x,
            y: openAt.y,
            selection: lastSelection,
          });
        } catch (_) {}
      }
      closeMenu();
    };

    const onPageScroll = () => closeMenu();

    const onContextMenuIntercept = (e: MouseEvent) => {
      // Allow native context menu when Alt is held or inside inputs/contentEditable
      const target = e.target as HTMLElement | null;
      const inEditable =
        !!target &&
        target.closest("input, textarea, select, [contenteditable=true]") !==
          null;
      if (e.altKey || inEditable || !enabled) return;

      e.preventDefault();
      // Prevent site handlers regardless of capture order
      e.stopPropagation();
      e.stopImmediatePropagation?.();

      lastSelection = getSelectionText();
      openAt = { x: e.clientX, y: e.clientY };

      openMenuAt(openAt.x, openAt.y);
    };

    const openMenuAt = (x: number, y: number) => {
      if (isOpen) closeMenu();
      ensureHost();

      isOpen = true;
      // Create overlay and menu inside shadow DOM
      const root = shadow!.querySelector(
        ".scout-radial-root"
      ) as HTMLDivElement;
      overlay = document.createElement("div");
      overlay.className = "scout-radial-overlay";
      // Prepare a mount node that doubles as the menu container
      menu = document.createElement("div");
      menu.className = "scout-radial-menu";
      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
      overlay.appendChild(menu);
      root.appendChild(overlay);

      // React render of the radial UI
      reactMountEl = menu;
      reactRoot = createRoot(reactMountEl);

      const IconById: Record<string, React.ComponentType<{ size?: number }>> = {
        "ebay-sold": Search,
        "upc-google": Barcode,
        upcitemdb: PackageSearch,
        pricecharting: TrendingUp,
        controller: Gamepad2,
      };

      const count = actions.length;
      const menuDiameter = 280;
      const itemDiameter = 56;
      const ringRadius = menuDiameter / 2 - itemDiameter / 2 - 10;

      reactRoot.render(
        React.createElement(
          React.Fragment,
          null,
          React.createElement(
            "div",
            { className: "scout-radial-center" },
            lastSelection
              ? lastSelection.length > 16
                ? lastSelection.slice(0, 16) + "…"
                : lastSelection
              : "Quick Actions"
          ),
          React.createElement(
            "div",
            { className: "scout-radial-ring" },
            actions.map((a, idx) => {
              const theta = (idx / count) * Math.PI * 2 - Math.PI / 2;
              const xOff = Math.cos(theta) * ringRadius;
              const yOff = Math.sin(theta) * ringRadius;
              const Icon = IconById[a.id] || Search;
              return React.createElement(
                "div",
                {
                  key: a.id,
                  className: "scout-radial-item",
                  "data-id": a.id,
                  style: {
                    transform: `translate(calc(-50% + ${xOff}px), calc(-50% + ${yOff}px))`,
                  },
                },
                React.createElement(
                  "div",
                  { className: "scout-radial-icon" },
                  React.createElement(Icon, { size: 20 })
                ),
                a.hotkey
                  ? React.createElement("div", { className: "hint" }, a.hotkey)
                  : null
              );
            })
          )
        )
      );

      // event listeners
      setTimeout(() => {
        document.addEventListener("scroll", onPageScroll, true);
        document.addEventListener("keydown", onKeyDown, true);
        // Capture interactions within the shadow root overlay
        overlay!.addEventListener("click", onOverlayClick, true);
        overlay!.addEventListener("mousedown", onOverlayPointer, true);
        overlay!.addEventListener("mouseup", onOverlayPointer, true);
        overlay!.addEventListener("pointerdown", onOverlayPointer, true);
        overlay!.addEventListener("pointerup", onOverlayPointer, true);
        overlay!.addEventListener("contextmenu", onOverlayPointer, true);
      }, 0);
    };

    // Listen for settings updates to toggle feature
    try {
      chrome.runtime.onMessage.addListener((message) => {
        if (message?.action === "radial-menu-settings-changed") {
          enabled = !!message.enabled;
          if (!enabled) closeMenu();
        }
      });
    } catch (_) {}

    // Intercept context menu globally
    document.addEventListener("contextmenu", onContextMenuIntercept, true);

    log("Radial context menu content script initialized");
  },
});
