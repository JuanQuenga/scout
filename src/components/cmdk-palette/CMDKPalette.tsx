/* global chrome */
declare const chrome: any;

import React, { useEffect, useState, useRef } from "react";
import { Command } from "cmdk";
import { TabManager, TabInfo } from "@/src/utils/tab-manager";
import { fetchCSVLinks, filterCSVLinks, CSVLink } from "@/src/utils/csv-links";
import {
  getAllBookmarks,
  getBookmarksFromFolder,
  getBookmarksFromMultipleFolders,
  filterBookmarks,
  Bookmark,
} from "@/src/utils/bookmarks";
import {
  getRecentHistory,
  filterHistory,
  HistoryItem,
} from "@/src/utils/history";
import {
  searchProviders,
  findProviderByTrigger,
  SearchProvider,
} from "./SearchProviders";
import { TabItem } from "./TabItem";
import { CSVLinkItem } from "./CSVLinkItem";
import { BookmarkItem } from "./BookmarkItem";
import { HistoryItemComponent } from "./HistoryItem";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  X,
  Search as SearchIcon,
  Gamepad2,
  Layers,
  Settings,
} from "lucide-react";
import "./styles.css";

const DEFAULT_ENABLED_SOURCES = {
  tabs: true,
  bookmarks: true,
  history: true,
  quickLinks: true,
  tools: true,
  searchProviders: true,
  ebayCategories: true,
} as const;

const DEFAULT_SOURCE_ORDER = [
  "tabs",
  "quickLinks",
  "ebayCategories",
  "bookmarks",
  "tools",
  "searchProviders",
  "history",
] as const;

interface CMDKPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  noOverlay?: boolean; // When true, renders without the overlay wrapper (for popup use)
}

export function CMDKPalette({
  isOpen,
  onClose,
  noOverlay = false,
}: CMDKPaletteProps) {
  const [search, setSearch] = useState("");
  const [tabs, setTabs] = useState<TabInfo[]>([]);
  const [previousTabId, setPreviousTabId] = useState<number | null>(null);
  const [csvLinks, setCSVLinks] = useState<CSVLink[]>([]);
  const [csvLinksLoading, setCSVLinksLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeProvider, setActiveProvider] = useState<SearchProvider | null>(
    null
  );
  const [providerQuery, setProviderQuery] = useState("");
  const [ebaySuggestions, setEbaySuggestions] = useState<any[]>([]);
  const [ebayLoading, setEbayLoading] = useState(false);
  const [copiedEbayId, setCopiedEbayId] = useState<string | null>(null);
  const [userNavigated, setUserNavigated] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>("");
  const listRef = useRef<HTMLDivElement>(null);
  const [enabledSources, setEnabledSources] = useState({
    ...DEFAULT_ENABLED_SOURCES,
  });
  const [sourceOrder, setSourceOrder] = useState<string[]>([
    ...DEFAULT_SOURCE_ORDER,
  ]);
  const trimmedSearch = search.trim();
  const previousTab =
    previousTabId !== null
      ? tabs.find((tab) => tab.id === previousTabId) ?? null
      : null;
  const previousTabLabel = previousTab?.title?.trim() || previousTab?.url || "";
  const showPreviousTabHint =
    !activeProvider && !trimmedSearch && Boolean(previousTabLabel);

  useEffect(() => {
    // Load settings from chrome storage
    chrome.storage.sync.get(["cmdkSettings"], (result: any) => {
      if (result.cmdkSettings) {
        if (result.cmdkSettings.enabledSources) {
          setEnabledSources((prev) => ({
            ...DEFAULT_ENABLED_SOURCES,
            ...prev,
            ...result.cmdkSettings.enabledSources,
          }));
        }
        if (Array.isArray(result.cmdkSettings.sourceOrder)) {
          setSourceOrder(() => {
            const storedOrder = result.cmdkSettings.sourceOrder.filter(
              (key: string) =>
                (DEFAULT_SOURCE_ORDER as readonly string[]).includes(key)
            );
            const mergedOrder = [...storedOrder];
            for (const key of DEFAULT_SOURCE_ORDER) {
              if (!mergedOrder.includes(key)) {
                mergedOrder.push(key);
              }
            }
            return mergedOrder;
          });
        }
      }
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (enabledSources.tabs) loadTabs();
      if (enabledSources.quickLinks) loadCSVLinks();
      if (enabledSources.bookmarks) loadBookmarks();
      if (enabledSources.history) loadHistory();
      setSearch("");
      setActiveProvider(null);
      setProviderQuery("");
      setUserNavigated(false);
      setSelectedValue("");
    }
  }, [isOpen, enabledSources]);

  const loadTabs = async () => {
    const [allTabs, prevTabId] = await Promise.all([
      TabManager.getAllTabs(),
      TabManager.getPreviousTab(),
    ]);
    const sorted = TabManager.sortTabs(allTabs);
    setTabs(sorted);
    setPreviousTabId(prevTabId);
  };

  const loadCSVLinks = async () => {
    const { links, isInitialLoad } = await fetchCSVLinks();
    // Only show loading skeleton on initial load (when no cache exists)
    if (isInitialLoad) {
      setCSVLinksLoading(true);
    }
    setCSVLinks(links);
    setCSVLinksLoading(false);
  };

  const loadBookmarks = async () => {
    // Get the selected folder IDs from settings
    chrome.storage.sync.get(["cmdkSettings"], async (result: any) => {
      const folderIds = result.cmdkSettings?.bookmarkFolderIds || [];
      const allBookmarks = await getBookmarksFromMultipleFolders(folderIds);
      setBookmarks(allBookmarks);
    });
  };

  const loadHistory = async () => {
    const recentHistory = await getRecentHistory(30);
    setHistory(recentHistory);
  };

  const handleValueChange = (value: string) => {
    setSearch(value);

    // Reset scroll position to top when search changes
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }

    // Check if user is typing a provider trigger
    if (!activeProvider) {
      const provider = findProviderByTrigger(value);
      if (provider && value.toLowerCase().trim() === provider.trigger[0]) {
        // Don't auto-activate, wait for Tab key
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Track arrow key navigation
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      setUserNavigated(true);
    }

    // Backspace to deactivate provider when query is empty
    if (e.key === "Backspace" && activeProvider && providerQuery === "") {
      e.preventDefault();
      setActiveProvider(null);
      setProviderQuery("");
      setSearch("");
    }

    // Tab key to activate provider
    if (e.key === "Tab" && !activeProvider) {
      const provider = findProviderByTrigger(search);
      if (provider) {
        e.preventDefault();
        // If the user typed the trigger followed by a query, preserve the remainder
        const lower = search.toLowerCase().trim();
        const matchedTrigger =
          provider.trigger.find((t) => lower.startsWith(t)) || "";
        const remainder = matchedTrigger
          ? search.slice(matchedTrigger.length).trim()
          : "";
        setActiveProvider(provider);
        setProviderQuery(remainder);
        setSearch("");
      }
    }

    // Escape to close or deactivate provider
    if (e.key === "Escape") {
      if (activeProvider) {
        setActiveProvider(null);
        setProviderQuery("");
        setSearch("");
      } else {
        onClose();
      }
    }
  };

  const handleSelect = async (value: string) => {
    if (value.startsWith("tab-")) {
      const tabId = parseInt(value.replace("tab-", ""));
      await TabManager.switchToTab(tabId);
      onClose();
    } else if (value.startsWith("provider-switch-")) {
      // Handle switching between providers when one is already active
      const providerId = value.replace("provider-switch-", "");
      const provider = searchProviders.find((p) => p.id === providerId);
      if (provider) {
        // When switching providers, preserve the current query if one exists
        const currentQuery = activeProvider ? providerQuery : "";
        setActiveProvider(provider);
        setProviderQuery(currentQuery);
        setSearch("");
      }
    } else if (value.startsWith("provider-")) {
      const providerId = value.replace("provider-", "");
      const provider = searchProviders.find((p) => p.id === providerId);
      if (provider) {
        // When switching providers, preserve the current query if one exists
        const currentQuery = activeProvider ? providerQuery : "";
        setActiveProvider(provider);
        setProviderQuery(currentQuery);
        setSearch("");
      }
    } else if (value.startsWith("csv-link-")) {
      const linkId = value;
      const link = csvLinks.find((l) => l.id === linkId);
      if (link) {
        await TabManager.openNewTab(link.url);
        onClose();
      }
    } else if (value.startsWith("bookmark-")) {
      const bookmarkId = value.replace("bookmark-", "");
      const bookmark = bookmarks.find((b) => b.id === bookmarkId);
      if (bookmark) {
        await TabManager.openNewTab(bookmark.url);
        onClose();
      }
    } else if (value.startsWith("history-")) {
      const historyId = value.replace("history-", "");
      const historyItem = history.find((h) => h.id === historyId);
      if (historyItem) {
        await TabManager.openNewTab(historyItem.url);
        onClose();
      }
    } else if (value.startsWith("tool-")) {
      const toolId = value.replace("tool-", "");
      if (toolId === "controller-testing") {
        // Send message to open controller testing in sidebar and await ack before closing
        try {
          const response = await new Promise<any>((resolve) => {
            try {
              chrome.runtime.sendMessage(
                { action: "openInSidebar", tool: "controller-testing" },
                (resp: any) => resolve(resp)
              );
            } catch (err) {
              resolve({ success: false, error: String(err) });
            }
          });
          if (!response?.success && chrome.runtime.lastError) {
            console.error("Error opening sidebar:", chrome.runtime.lastError);
          }
        } finally {
          onClose();
        }
      }
    } else if (value.startsWith("ebay-cat-")) {
      // Copy category path to clipboard but keep the palette open and show feedback
      const catId = value.replace("ebay-cat-", "");
      const suggestion = ebaySuggestions.find((s) => s.categoryId === catId);
      if (suggestion) {
        await copyEbayCategory(suggestion.categoryPath, suggestion.categoryId);
      }
    }
  };

  const handleSearchSubmit = async () => {
    if (activeProvider && providerQuery.trim()) {
      console.log("[CMDK] Opening search in new tab:", {
        provider: activeProvider.name,
        query: providerQuery,
      });
      const url = activeProvider!.searchUrl.replace(
        "{query}",
        encodeURIComponent(providerQuery)
      );
      console.log("[CMDK] Search URL:", url);
      await TabManager.openNewTab(url);
      onClose();
    } else if (!trimmedSearch && !activeProvider) {
      // Empty input + Enter = go back to previous tab
      console.log("[CMDK] Returning to previous tab");
      const previousTabId = await TabManager.getPreviousTab();
      if (previousTabId) {
        await TabManager.switchToTab(previousTabId);
      }
      onClose();
    }
  };

  // Copy helper for ebay categories
  const copyEbayCategory = async (categoryPath: string, categoryId: string) => {
    try {
      await navigator.clipboard.writeText(categoryPath);
      setCopiedEbayId(categoryId);
      setTimeout(() => setCopiedEbayId(null), 1500);
    } catch (err) {
      console.error("Failed to copy eBay category:", err);
    }
  };

  // Fetch eBay suggestions when search changes (not tied to provider)
  useEffect(() => {
    if (!enabledSources.ebayCategories) {
      setEbaySuggestions([]);
      return;
    }

    let cancelled = false;
    const fetchSuggestions = async () => {
      const q = search.trim();
      if (q.length < 2) {
        setEbaySuggestions([]);
        return;
      }
      setEbayLoading(true);
      try {
        const res = await fetch(
          `https://paymore-extension.vercel.app/api/ebay-categories?q=${encodeURIComponent(
            q
          )}`
        );
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          setEbaySuggestions((data.suggestions || []).slice(0, 1));
        }
      } catch (err) {
        console.error("Failed to fetch eBay suggestions:", err);
        if (!cancelled) {
          setEbaySuggestions([]);
        }
      } finally {
        if (!cancelled) setEbayLoading(false);
      }
    };

    const t = setTimeout(fetchSuggestions, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, enabledSources.ebayCategories]);

  const filteredTabs =
    activeProvider || !enabledSources.tabs
      ? []
      : TabManager.filterTabs(tabs, search).filter(
          (tab) => !showPreviousTabHint || tab.id !== previousTabId
        );
  const filteredCSVLinks =
    activeProvider || !enabledSources.quickLinks
      ? []
      : filterCSVLinks(csvLinks, search);
  const filteredBookmarks =
    activeProvider || !enabledSources.bookmarks
      ? []
      : filterBookmarks(bookmarks, search);
  const filteredHistory =
    activeProvider || !enabledSources.history
      ? []
      : filterHistory(history, search);

  // Filter tools by search (always include controller testing)
  const filteredTools =
    activeProvider || !enabledSources.tools
      ? []
      : [
          {
            id: "controller-testing",
            label: "Controller Testing",
            description: "Test hardware controllers",
          },
        ];

  const getUrlFromInput = (input: string): string | null => {
    const value = input.trim();
    if (!value) return null;

    try {
      const hasScheme = /^[a-z][\w+.-]*:/i.test(value);
      if (hasScheme) {
        return new URL(value).href;
      }

      const looksLikeLocalhost = /^localhost(?:[:][0-9]+)?(?:\/.*)?$/i.test(
        value
      );
      const looksLikeDomain = /^[\w.-]+\.[a-z]{2,}(?::[0-9]+)?(?:\/.*)?$/i.test(
        value
      );

      if (looksLikeLocalhost || looksLikeDomain) {
        return new URL(`https://${value}`).href;
      }
    } catch (_) {}

    return null;
  };

  const openUrlAndClose = async (url: string) => {
    try {
      await TabManager.openNewTab(url);
    } finally {
      onClose();
    }
  };

  const openGoogleSearch = async (query: string) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    await openUrlAndClose(url);
  };

  const openSettings = async () => {
    // Open settings page in a new tab
    const optionsUrl = chrome.runtime.getURL('options.html');
    await TabManager.openNewTab(optionsUrl);
    onClose();
  };

  // Group CSV links by category
  const csvLinksByCategory = filteredCSVLinks.reduce((acc, link) => {
    const category = link.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(link);
    return acc;
  }, {} as Record<string, CSVLink[]>);

  // Sort categories alphabetically
  const sortedCategories = Object.keys(csvLinksByCategory).sort((a, b) =>
    a.localeCompare(b)
  );

  // Sort links within each category alphabetically by title
  sortedCategories.forEach((category) => {
    csvLinksByCategory[category].sort((a, b) => a.title.localeCompare(b.title));
  });

  // Check if there are any visible items
  const hasVisibleItems =
    filteredTabs.length > 0 ||
    filteredCSVLinks.length > 0 ||
    filteredTools.length > 0 ||
    filteredBookmarks.length > 0 ||
    filteredHistory.length > 0;

  if (!isOpen) return null;

  // Set initial selected value when previous tab is shown
  useEffect(() => {
    if (isOpen && showPreviousTabHint && previousTab && !selectedValue) {
      setSelectedValue(`tab-${previousTab.id}`);
    }
  }, [isOpen, showPreviousTabHint, previousTab, selectedValue]);

  const content = (
    <Command
      shouldFilter={false}
      filter={() => 1}
      onKeyDown={handleKeyDown}
      className="cmdk-root"
      value={selectedValue}
      onValueChange={setSelectedValue}
    >
      <div className="cmdk-input-wrapper">
        {activeProvider && (
          <div className={`cmdk-provider-badge ${activeProvider.color}`}>
            <activeProvider.icon className="w-3 h-3 text-white" />
            <span className="text-xs font-medium text-white">
              {activeProvider.name}
            </span>
            <button
              onClick={() => {
                setActiveProvider(null);
                setProviderQuery("");
              }}
              className="ml-1 hover:bg-white/20 rounded p-0.5"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        )}
        <div className="cmdk-input-shell">
          <Command.Input
            value={activeProvider ? providerQuery : search}
            onValueChange={
              activeProvider ? setProviderQuery : handleValueChange
            }
            placeholder={
              activeProvider
                ? `Search ${activeProvider.name}...`
                : showPreviousTabHint
                ? "Search or press Enter to switch tabs..."
                : "Search tabs or type a command..."
            }
            className="cmdk-input"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // Only handle Enter for search providers or empty searches WITHOUT user navigation
                if (activeProvider && providerQuery.trim()) {
                  e.preventDefault();
                  handleSearchSubmit();
                } else if (
                  !trimmedSearch &&
                  !activeProvider &&
                  !userNavigated
                ) {
                  // Empty input with no arrow key navigation - go to previous tab
                  e.preventDefault();
                  handleSearchSubmit();
                } else if (!activeProvider && trimmedSearch) {
                  const urlCandidate = getUrlFromInput(trimmedSearch);
                  if (urlCandidate) {
                    e.preventDefault();
                    void openUrlAndClose(urlCandidate);
                    return;
                  }

                  if (!hasVisibleItems) {
                    e.preventDefault();
                    void openGoogleSearch(trimmedSearch);
                  }
                }
                // Otherwise, let CMDK's default Enter behavior select the highlighted item
              }
            }}
          />
        </div>
        {!trimmedSearch && !activeProvider && (
          <button
            onClick={openSettings}
            className="cmdk-settings-button"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      <Command.List className="cmdk-list" ref={listRef}>
        <Command.Empty className="cmdk-empty">
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <SearchIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              No results found
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {trimmedSearch ? (
                <>
                  Press <kbd className="cmdk-kbd">Enter</kbd> to search Google
                  or open the typed URL.
                </>
              ) : (
                "Try a different search term"
              )}
            </p>
          </div>
        </Command.Empty>

        {activeProvider && (
          <>
            {/* Show all search providers when one is active - for switching */}
            <Command.Group heading="Search Providers" className="cmdk-group">
              {searchProviders
                .filter((p: SearchProvider) => !p.hideInSwitcher)
                .map((provider: SearchProvider) => (
                  <Command.Item
                    key={provider.id}
                    value={`provider-switch-${provider.id}`}
                    onSelect={handleSelect}
                    keywords={[provider.name, ...provider.trigger]}
                    className="cmdk-item"
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className={`p-2 rounded ${provider.color}`}>
                        <provider.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {provider.name}
                          {provider.id === activeProvider?.id && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                              Active
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {provider.id === activeProvider?.id ? (
                            <>
                              Press <kbd className="cmdk-kbd">Enter</kbd> to
                              search
                            </>
                          ) : (
                            "Click to switch"
                          )}
                        </p>
                      </div>
                    </div>
                  </Command.Item>
                ))}
            </Command.Group>
          </>
        )}

        {!activeProvider && (
          <>
            {/* Previous Tab - shown as first option when no search */}
            {showPreviousTabHint && previousTab && (
              <Command.Group heading="Previous Tab" className="cmdk-group">
                <Command.Item
                  key={`tab-${previousTab.id}`}
                  value={`tab-${previousTab.id}`}
                  onSelect={handleSelect}
                  className="cmdk-item"
                >
                  <TabItem tab={previousTab} kbdHintAction="Switch to tab" />
                </Command.Item>
              </Command.Group>
            )}

            {/* Render sources - use sourceOrder for initial state, relevance order when searching */}
            {(trimmedSearch
              ? [
                  "tabs",
                  "quickLinks",
                  "ebayCategories",
                  "tools",
                  "bookmarks",
                  "searchProviders",
                  "history",
                ]
              : sourceOrder
            ).map((sourceKey) => {
              switch (sourceKey) {
                case "tabs":
                  return (
                    <React.Fragment key="tabs">
                      {/* Tabs */}
                      {filteredTabs.length > 0 && (
                        <Command.Group heading="Tabs" className="cmdk-group">
                          {filteredTabs.map((tab) => (
                            <Command.Item
                              key={tab.id}
                              value={`tab-${tab.id}`}
                              onSelect={handleSelect}
                              className="cmdk-item"
                            >
                              <TabItem
                                tab={tab}
                                kbdHintAction="Switch to tab"
                              />
                            </Command.Item>
                          ))}
                        </Command.Group>
                      )}
                    </React.Fragment>
                  );

                case "quickLinks":
                  return (
                    <React.Fragment key="quickLinks">
                      {/* Scout Links Loading Skeleton */}
                      {csvLinksLoading && (
                        <Command.Group
                          heading="Scout Links"
                          className="cmdk-group"
                        >
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="cmdk-item px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Skeleton className="w-4 h-4" />
                                <div className="flex-1 space-y-2">
                                  <Skeleton className="h-4 w-[200px]" />
                                  <Skeleton className="h-3 w-[150px]" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </Command.Group>
                      )}

                      {/* Scout Links - sorted alphabetically by category */}
                      {!csvLinksLoading &&
                        sortedCategories.map((category) => (
                          <Command.Group
                            key={category}
                            heading={category}
                            className="cmdk-group"
                          >
                            {csvLinksByCategory[category].map((link) => (
                              <Command.Item
                                key={link.id}
                                value={link.id}
                                onSelect={handleSelect}
                                className="cmdk-item"
                              >
                                <CSVLinkItem
                                  link={link}
                                  kbdHintAction="Open in new tab"
                                />
                              </Command.Item>
                            ))}
                          </Command.Group>
                        ))}
                    </React.Fragment>
                  );

                case "ebayCategories":
                  return (
                    <React.Fragment key="ebayCategories">
                      {/* eBay Category Loading */}
                      {ebayLoading && (
                        <Command.Group
                          heading="eBay Category"
                          className="cmdk-group"
                        >
                          <div className="cmdk-item px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Skeleton className="w-8 h-8 rounded" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-[180px]" />
                                <Skeleton className="h-3 w-[240px]" />
                              </div>
                            </div>
                          </div>
                        </Command.Group>
                      )}

                      {/* eBay Category */}
                      {!ebayLoading && ebaySuggestions.length > 0 && (
                        <Command.Group
                          heading="eBay Category"
                          className="cmdk-group"
                        >
                          {ebaySuggestions.map((s) => (
                            <Command.Item
                              key={s.categoryId}
                              value={`ebay-cat-${s.categoryId}`}
                              onSelect={handleSelect}
                              keywords={[s.categoryName, s.categoryPath]}
                              className="cmdk-item"
                            >
                              <div
                                className={`flex items-center gap-3 px-4 py-3 w-full`}
                              >
                                <div className="p-2 rounded bg-purple-600">
                                  <Layers className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {s.categoryName}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {s.categoryPath}
                                  </p>
                                </div>
                                <div className="cmdk-item-kbd-hint">
                                  {copiedEbayId === s.categoryId ? (
                                    <kbd className="cmdk-kbd">Copied</kbd>
                                  ) : (
                                    <kbd className="cmdk-kbd">↵</kbd>
                                  )}
                                </div>
                              </div>
                            </Command.Item>
                          ))}
                        </Command.Group>
                      )}
                    </React.Fragment>
                  );

                case "tools":
                  return (
                    <React.Fragment key="tools">
                      {/* Tools */}
                      {filteredTools.length > 0 && (
                        <Command.Group heading="Tools" className="cmdk-group">
                          {filteredTools.map((tool) => (
                            <Command.Item
                              key={tool.id}
                              value={`tool-${tool.id}`}
                              onSelect={handleSelect}
                              className="cmdk-item"
                            >
                              <div className="flex items-center gap-3 px-4 py-3 w-full">
                                <div className="p-2 rounded bg-blue-500">
                                  <Gamepad2 className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {tool.label}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {tool.description}
                                  </p>
                                </div>
                                <div className="cmdk-item-kbd-hint">
                                  <kbd className="cmdk-kbd">↵</kbd>
                                </div>
                              </div>
                            </Command.Item>
                          ))}
                        </Command.Group>
                      )}
                    </React.Fragment>
                  );

                case "bookmarks":
                  return (
                    <React.Fragment key="bookmarks">
                      {/* Bookmarks */}
                      {filteredBookmarks.length > 0 && (
                        <Command.Group
                          heading="Bookmarks"
                          className="cmdk-group"
                        >
                          {filteredBookmarks.map((bookmark) => (
                            <Command.Item
                              key={bookmark.id}
                              value={`bookmark-${bookmark.id}`}
                              onSelect={handleSelect}
                              className="cmdk-item"
                            >
                              <BookmarkItem
                                bookmark={bookmark}
                                kbdHintAction="Open in new tab"
                              />
                            </Command.Item>
                          ))}
                        </Command.Group>
                      )}
                    </React.Fragment>
                  );

                case "searchProviders":
                  return (
                    <React.Fragment key="searchProviders">
                      {/* Search providers */}
                      {enabledSources.searchProviders && (
                        <Command.Group heading="Search" className="cmdk-group">
                          {searchProviders
                            .filter(
                              (provider: SearchProvider) =>
                                !trimmedSearch ||
                                provider.trigger.some((t) =>
                                  t.startsWith(search.toLowerCase())
                                )
                            )
                            .map((provider: SearchProvider) => (
                              <Command.Item
                                key={provider.id}
                                value={`provider-${provider.id}`}
                                onSelect={handleSelect}
                                className="cmdk-item"
                              >
                                <div className="flex items-center gap-3 px-4 py-3">
                                  <div
                                    className={`p-2 rounded ${provider.color}`}
                                  >
                                    <provider.icon className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      Search {provider.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Press <kbd className="cmdk-kbd">Tab</kbd>{" "}
                                      to activate
                                    </p>
                                  </div>
                                </div>
                              </Command.Item>
                            ))}
                        </Command.Group>
                      )}
                    </React.Fragment>
                  );

                case "history":
                  return (
                    <React.Fragment key="history">
                      {/* Recent History */}
                      {filteredHistory.length > 0 && (
                        <Command.Group
                          heading="Recent History"
                          className="cmdk-group"
                        >
                          {filteredHistory.map((item) => (
                            <Command.Item
                              key={item.id}
                              value={`history-${item.id}`}
                              onSelect={handleSelect}
                              className="cmdk-item"
                            >
                              <HistoryItemComponent
                                item={item}
                                kbdHintAction="Open in new tab"
                              />
                            </Command.Item>
                          ))}
                        </Command.Group>
                      )}
                    </React.Fragment>
                  );

                default:
                  return null;
              }
            })}
          </>
        )}
      </Command.List>
    </Command>
  );

  if (noOverlay) {
    return (
      <div
        className="cmdk-container cmdk-fullscreen"
        style={{
          height: "100vh",
          maxHeight: "100vh",
          width: "100vw",
          maxWidth: "100vw",
          borderRadius: 0,
          boxShadow: "none",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999999,
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div className="cmdk-overlay" onClick={onClose}>
      <div className="cmdk-container" onClick={(e) => e.stopPropagation()}>
        {content}
      </div>
    </div>
  );
}
