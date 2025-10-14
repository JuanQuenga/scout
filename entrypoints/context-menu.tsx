// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
/* global chrome */

import { defineContentScript } from "wxt/utils/define-content-script";
import React, { useEffect, useMemo, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  Search,
  Barcode,
  PackageSearch,
  TrendingUp,
  Gamepad2,
} from "lucide-react";

/**
 * Standard Context Menu (shadcn-like) Content Script
 * - Light theme, rounded, shadowed menu
 * - Keyboard: Up/Down/Enter/Esc
 * - Alt+right-click => native menu
 * - Ignores inputs/contentEditable
 */
export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  allFrames: false,
  main() {
    if (window.top !== window) return;

    const log = (...args) => {
      try {
        console.log("[Scout CtxMenu]", ...args);
      } catch (_) {}
    };

    // Feature flag from settings
    let enabled = true;
    try {
      chrome.storage.sync.get(["cmdkSettings"], (result) => {
        const s = result?.cmdkSettings || {};
        enabled = s?.contextMenu?.enabled ?? s?.radialMenu?.enabled ?? true;
      });
    } catch (_) {}

    if ((document as any)._scoutCtxMenuInstalled) return;
    (document as any)._scoutCtxMenuInstalled = true;

    type MenuAction = {
      id: string;
      label: string;
      shortcut?: string;
      icon?: React.ComponentType<{ size?: number }>;
      onInvoke: (ctx: { x: number; y: number; selection: string }) => void;
    };

    const openUrl = (url: string) => {
      try {
        chrome.runtime.sendMessage({ action: "openUrl", url });
      } catch (_) {}
    };
    const openInSidebar = (tool: string) => {
      try {
        chrome.runtime.sendMessage({
          action: "openInSidebar",
          tool,
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

    const actions: MenuAction[] = [
      {
        id: "ebay-sold",
        label: "Search eBay Sold",
        shortcut: "E",
        icon: Search,
        onInvoke: ({ selection }) =>
          selection && openUrl(buildEbaySoldUrl(selection)),
      },
      {
        id: "upc-google",
        label: "Search Google UPC",
        shortcut: "G",
        icon: Barcode,
        onInvoke: ({ selection }) =>
          selection &&
          openUrl(
            `https://www.google.com/search?q=${encodeURIComponent(
              "UPC for " + selection
            )}`
          ),
      },
      {
        id: "upcitemdb",
        label: "Open UPCItemDB",
        shortcut: "U",
        icon: PackageSearch,
        onInvoke: ({ selection }) =>
          selection &&
          openUrl(
            `https://www.upcitemdb.com/upc/${encodeURIComponent(selection)}`
          ),
      },
      {
        id: "pricecharting",
        label: "Search PriceCharting",
        shortcut: "P",
        icon: TrendingUp,
        onInvoke: ({ selection }) =>
          selection &&
          openUrl(
            `https://www.pricecharting.com/search-products?type=prices&q=${encodeURIComponent(
              selection
            )}&go=Go`
          ),
      },
      {
        id: "controller",
        label: "Open Controller Test",
        shortcut: "C",
        icon: Gamepad2,
        onInvoke: () => openInSidebar("controller-testing"),
      },
    ];

    // Shadow DOM
    let host: HTMLDivElement | null = null;
    let shadow: ShadowRoot | null = null;
    let rootEl: HTMLDivElement | null = null;
    let reactRoot: Root | null = null;

    const styles = () => `
      :host{all:initial}
      .scout-cm-root{position:fixed;inset:0;z-index:2147483646}
      .overlay{position:fixed;inset:0;background:transparent}
      .menu{position:absolute;min-width:240px;max-width:320px;background:#fff;color:#111827;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 20px 45px rgba(0,0,0,.18);overflow:hidden;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif}
      .hdr{padding:8px 12px;border-bottom:1px solid #f3f4f6;font:600 12px/1 ui-sans-serif, system-ui, -apple-system;color:#6b7280;background:#fafafa}
      .group{padding:6px 6px}
      .item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;cursor:pointer;outline:none;font-size:14px;font-weight:400}
      .item:hover{background:#f3f4f6}
      .item[aria-selected="true"], .item:focus{background:#e5e7eb}
      .icon{width:18px;height:18px;color:#6b7280;display:flex;align-items:center;justify-content:center}
      .label{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;line-height:1.5}
      .shortcut{color:#6b7280;font:600 11px/1 ui-sans-serif, system-ui, -apple-system}
      .sep{height:1px;background:#f3f4f6;margin:4px 0}
    `;

    const ensureHost = () => {
      if (host && shadow && rootEl) return;
      host = document.createElement("div");
      host.style.all = "initial";
      host.style.position = "fixed";
      host.style.inset = "0";
      host.style.zIndex = "2147483646";
      shadow = host.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = styles();
      rootEl = document.createElement("div");
      rootEl.className = "scout-cm-root";
      shadow.appendChild(style);
      shadow.appendChild(rootEl);
      document.documentElement.appendChild(host);
    };

    let isOpen = false;
    let lastSelection = "";
    let anchor = { x: 0, y: 0 };

    const getSelectionText = () => {
      try {
        return (window.getSelection()?.toString() || "").trim();
      } catch {
        return "";
      }
    };

    const closeMenu = () => {
      if (!isOpen) return;
      isOpen = false;
      try {
        reactRoot?.unmount?.();
      } catch (_) {}
      reactRoot = null;
      if (rootEl) rootEl.textContent = "";
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("contextmenu", onContextMenuCapture, true);
    };

    const onScroll = () => closeMenu();
    const onContextMenuCapture = (e: MouseEvent) => {
      // Prevent page context menus while ours is open
      e.stopPropagation();
      e.stopImmediatePropagation?.();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
      }
    };

    const openMenuAt = (x: number, y: number) => {
      if (isOpen) closeMenu();
      ensureHost();
      isOpen = true;

      // Menu React component
      const Menu: React.FC = () => {
        const [index, setIndex] = useState(0);
        const items = useMemo(() => actions, []);

        // Positioning within viewport
        const [pos, setPos] = useState({ left: x, top: y });
        useEffect(() => {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const width = 280; // approx
          const height = 12 + 6 + items.length * 40; // rough calc
          let left = x,
            top = y;
          if (left + width > vw - 8) left = vw - width - 8;
          if (top + height > vh - 8) top = vh - height - 8;
          setPos({ left, top });
        }, []);

        useEffect(() => {
          const handle = (ev: KeyboardEvent) => {
            if (ev.key === "ArrowDown") {
              ev.preventDefault();
              setIndex((i) => (i + 1) % items.length);
            } else if (ev.key === "ArrowUp") {
              ev.preventDefault();
              setIndex((i) => (i - 1 + items.length) % items.length);
            } else if (ev.key === "Enter") {
              ev.preventDefault();
              try {
                items[index]?.onInvoke({ x, y, selection: lastSelection });
              } catch (_) {}
              closeMenu();
            }
          };
          document.addEventListener("keydown", handle, true);
          return () => document.removeEventListener("keydown", handle, true);
        }, [index, items]);

        const onOverlayClick = (e: React.MouseEvent) => {
          const path = (e.nativeEvent as any).composedPath?.() || [];
          const el = path[0] as HTMLElement;
          if (!(el.closest && el.closest(".menu"))) closeMenu();
        };

        const onItemClick = (i: number) => {
          try {
            items[i]?.onInvoke({ x, y, selection: lastSelection });
          } catch (_) {}
          closeMenu();
        };

        return (
          <div
            className="overlay"
            onClick={onOverlayClick}
            onContextMenu={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
            }}
          >
            <div
              className="menu"
              style={{ left: `${pos.left}px`, top: `${pos.top}px` }}
            >
              <div className="hdr">Scout Quick Actions</div>
              <div className="group">
                {items.map((item, i) => {
                  const Icon = item.icon || Search;
                  const selected = i === index;
                  return (
                    <div
                      key={item.id}
                      className="item"
                      role="menuitem"
                      tabIndex={0}
                      aria-selected={selected}
                      onMouseEnter={() => setIndex(i)}
                      onClick={() => onItemClick(i)}
                    >
                      <div className="icon">
                        <Icon size={18} />
                      </div>
                      <div className="label">{item.label}</div>
                      <div className="shortcut">{item.shortcut}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      };

      reactRoot = createRoot(rootEl!);
      reactRoot.render(React.createElement(Menu));

      // global listeners while open
      document.addEventListener("keydown", onKey, true);
      document.addEventListener("scroll", onScroll, true);
      document.addEventListener("contextmenu", onContextMenuCapture, true);
    };

    const onContextMenu = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      const inEditable =
        !!t &&
        t.closest("input, textarea, select, [contenteditable=true]") !== null;
      if (e.altKey || inEditable || !enabled) return; // pass through
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      lastSelection = getSelectionText();
      anchor = { x: e.clientX, y: e.clientY };
      openMenuAt(anchor.x, anchor.y);
    };

    // Settings toggle
    try {
      chrome.runtime.onMessage.addListener((message) => {
        if (message?.action === "context-menu-settings-changed") {
          enabled = !!message.enabled;
          if (!enabled) closeMenu();
        }
      });
    } catch (_) {}

    document.addEventListener("contextmenu", onContextMenu, true);
    log("Context menu (shadcn-like) initialized");
  },
});


