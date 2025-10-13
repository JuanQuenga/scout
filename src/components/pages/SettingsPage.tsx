/* global chrome */
import { useState, useEffect } from "react";
import { Check, Menu, X, Layers, Search as SearchIcon, Bookmark } from "lucide-react";
import { getBookmarkFolders, BookmarkFolder } from "@/src/utils/bookmarks";

interface CMDKSettings {
  enabledSources: {
    tabs: boolean;
    bookmarks: boolean;
    history: boolean;
    quickLinks: boolean;
    tools: boolean;
    searchProviders: boolean;
    ebayCategories: boolean;
  };
  sourceOrder: string[];
  enabledSearchProviders: {
    [providerId: string]: boolean;
  };
  customSearchProviders: Array<{
    id: string;
    name: string;
    triggers: string[];
    searchUrl: string;
    color: string;
  }>;
  shopifyGuardrails?: {
    enableConditionCheck: boolean;
    enableGoogleFieldsCheck: boolean;
  };
  controllerTesting?: {
    lightThreshold: number;
    mediumThreshold: number;
  };
  bookmarkFolderIds?: string[];
}

const DEFAULT_SETTINGS: CMDKSettings = {
  enabledSources: {
    tabs: true,
    bookmarks: true,
    history: true,
    quickLinks: true,
    tools: true,
    searchProviders: true,
    ebayCategories: true,
  },
  sourceOrder: [
    "tabs",
    "quickLinks",
    "ebayCategories",
    "bookmarks",
    "tools",
    "searchProviders",
    "history",
  ],
  enabledSearchProviders: {
    google: true,
    scout: true,
    amazon: true,
    bestbuy: true,
    ebay: true,
    pricecharting: true,
    upcitemdb: true,
    youtube: true,
    github: true,
    twitter: true,
    homedepot: true,
    lowes: true,
    menards: true,
    microcenter: true,
  },
  customSearchProviders: [],
  shopifyGuardrails: {
    enableConditionCheck: true,
    enableGoogleFieldsCheck: true,
  },
  controllerTesting: {
    lightThreshold: 0.1,
    mediumThreshold: 0.25,
  },
  bookmarkFolderIds: [],
};

const ALL_SOURCE_KEYS = [...DEFAULT_SETTINGS.sourceOrder];

const mergeSettings = (stored?: Partial<CMDKSettings>): CMDKSettings => {
  if (!stored) {
    return DEFAULT_SETTINGS;
  }

  const mergedEnabledSources = {
    ...DEFAULT_SETTINGS.enabledSources,
    ...(stored.enabledSources || {}),
  };

  const sanitizedOrder = Array.isArray(stored.sourceOrder)
    ? stored.sourceOrder.filter((key) => ALL_SOURCE_KEYS.includes(key))
    : [];
  const mergedSourceOrder = [...sanitizedOrder];
  for (const key of ALL_SOURCE_KEYS) {
    if (!mergedSourceOrder.includes(key)) {
      mergedSourceOrder.push(key);
    }
  }

  const mergedEnabledProviders = {
    ...DEFAULT_SETTINGS.enabledSearchProviders,
    ...(stored.enabledSearchProviders || {}),
  };

  const mergedShopifyGuardrails = {
    ...(DEFAULT_SETTINGS.shopifyGuardrails || {}),
    ...(stored.shopifyGuardrails || {}),
  };

  const mergedControllerTesting = {
    ...(DEFAULT_SETTINGS.controllerTesting || {}),
    ...(stored.controllerTesting || {}),
  };

  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    enabledSources: mergedEnabledSources,
    sourceOrder: mergedSourceOrder,
    enabledSearchProviders: mergedEnabledProviders,
    customSearchProviders: stored.customSearchProviders
      ? [...stored.customSearchProviders]
      : [...DEFAULT_SETTINGS.customSearchProviders],
    shopifyGuardrails: mergedShopifyGuardrails,
    controllerTesting: mergedControllerTesting,
    bookmarkFolderIds: stored.bookmarkFolderIds
      ? [...stored.bookmarkFolderIds]
      : [...DEFAULT_SETTINGS.bookmarkFolderIds],
  };
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<CMDKSettings>(DEFAULT_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);
  const [version, setVersion] = useState<string>("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newProvider, setNewProvider] = useState({
    name: "",
    triggers: [] as string[],
    searchUrl: "",
    color: "bg-blue-500",
  });
  const [bookmarkFolders, setBookmarkFolders] = useState<BookmarkFolder[]>([]);

  useEffect(() => {
    // Load settings from chrome storage
    chrome.storage.sync.get(["cmdkSettings"], (result) => {
      if (result.cmdkSettings) {
        setSettings(mergeSettings(result.cmdkSettings));
      }
    });

    // Get extension version
    const manifest = chrome.runtime.getManifest();
    setVersion(manifest.version);

    // Load bookmark folders
    getBookmarkFolders().then(setBookmarkFolders);
  }, []);

  const handleToggle = (source: keyof CMDKSettings["enabledSources"]) => {
    const newSettings = {
      ...settings,
      enabledSources: {
        ...settings.enabledSources,
        [source]: !settings.enabledSources[source],
      },
    };
    setSettings(newSettings);

    // Auto-save
    chrome.storage.sync.set({ cmdkSettings: newSettings }, () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    });
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);

    // Auto-save reset
    chrome.storage.sync.set({ cmdkSettings: DEFAULT_SETTINGS }, () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...settings.sourceOrder];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);

    const newSettings = {
      ...settings,
      sourceOrder: newOrder,
    };
    setSettings(newSettings);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    // Auto-save
    chrome.storage.sync.set({ cmdkSettings: settings }, () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    });
  };

  const handleToggleSearchProvider = (providerId: string) => {
    const newSettings = {
      ...settings,
      enabledSearchProviders: {
        ...settings.enabledSearchProviders,
        [providerId]: !settings.enabledSearchProviders[providerId],
      },
    };
    setSettings(newSettings);

    // Auto-save
    chrome.storage.sync.set({ cmdkSettings: newSettings }, () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    });
  };

  const handleAddCustomProvider = () => {
    if (
      !newProvider.name ||
      !newProvider.triggers.length ||
      !newProvider.searchUrl
    ) {
      return;
    }

    const id = newProvider.name.toLowerCase().replace(/\s+/g, "-");
    const customProvider = {
      id,
      name: newProvider.name,
      triggers: newProvider.triggers,
      searchUrl: newProvider.searchUrl,
      color: newProvider.color,
    };

    const newSettings = {
      ...settings,
      customSearchProviders: [
        ...settings.customSearchProviders,
        customProvider,
      ],
      enabledSearchProviders: {
        ...settings.enabledSearchProviders,
        [id]: true,
      },
    };
    setSettings(newSettings);

    // Auto-save
    chrome.storage.sync.set({ cmdkSettings: newSettings }, () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    });

    // Reset form
    setNewProvider({
      name: "",
      triggers: [],
      searchUrl: "",
      color: "bg-blue-500",
    });
    setShowAddProvider(false);
  };

  const handleDeleteCustomProvider = (index: number) => {
    const providerToDelete = settings.customSearchProviders[index];
    const newCustomProviders = [...settings.customSearchProviders];
    newCustomProviders.splice(index, 1);

    const newEnabledProviders = { ...settings.enabledSearchProviders };
    delete newEnabledProviders[providerToDelete.id];

    const newSettings = {
      ...settings,
      customSearchProviders: newCustomProviders,
      enabledSearchProviders: newEnabledProviders,
    };
    setSettings(newSettings);

    // Auto-save
    chrome.storage.sync.set({ cmdkSettings: newSettings }, () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    });
  };

  const handleToggleGuardrail = (type: 'condition' | 'googleFields') => {
    const newGuardrails = {
      ...settings.shopifyGuardrails,
      enableConditionCheck: type === 'condition'
        ? !settings.shopifyGuardrails?.enableConditionCheck
        : settings.shopifyGuardrails?.enableConditionCheck ?? true,
      enableGoogleFieldsCheck: type === 'googleFields'
        ? !settings.shopifyGuardrails?.enableGoogleFieldsCheck
        : settings.shopifyGuardrails?.enableGoogleFieldsCheck ?? true,
    };

    const newSettings = {
      ...settings,
      shopifyGuardrails: newGuardrails,
    };
    setSettings(newSettings);

    // Auto-save
    chrome.storage.sync.set({ cmdkSettings: newSettings }, () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);

      // Notify content script of settings change
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              action: "guardrails-settings-changed",
              settings: newGuardrails,
            }).catch(() => {
              // Ignore errors for tabs that don't have the content script
            });
          }
        });
      });
    });
  };

  const handleControllerThresholdChange = (type: 'light' | 'medium', value: number) => {
    const newThresholds = {
      ...settings.controllerTesting,
      lightThreshold: type === 'light' ? value : settings.controllerTesting?.lightThreshold ?? 0.1,
      mediumThreshold: type === 'medium' ? value : settings.controllerTesting?.mediumThreshold ?? 0.25,
    };

    const newSettings = {
      ...settings,
      controllerTesting: newThresholds,
    };
    setSettings(newSettings);

    // Auto-save
    chrome.storage.sync.set({ cmdkSettings: newSettings }, () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    });
  };

  const handleBookmarkFolderToggle = (folderId: string) => {
    const currentFolders = settings.bookmarkFolderIds || [];
    const newFolders = currentFolders.includes(folderId)
      ? currentFolders.filter(id => id !== folderId)
      : [...currentFolders, folderId];

    const newSettings = {
      ...settings,
      bookmarkFolderIds: newFolders,
    };
    setSettings(newSettings);

    // Auto-save
    chrome.storage.sync.set({ cmdkSettings: newSettings }, () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    });
  };

  const handleSelectAllFolders = () => {
    const newSettings = {
      ...settings,
      bookmarkFolderIds: [],
    };
    setSettings(newSettings);

    // Auto-save
    chrome.storage.sync.set({ cmdkSettings: newSettings }, () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    });
  };

  const sourcesConfig = {
    tabs: {
      key: "tabs" as const,
      label: "Tabs",
      description: "Search and switch between open browser tabs",
    },
    bookmarks: {
      key: "bookmarks" as const,
      label: "Bookmarks",
      description: "Access your saved bookmarks",
    },
    history: {
      key: "history" as const,
      label: "Recent History",
      description: "View recently visited pages",
    },
    quickLinks: {
      key: "quickLinks" as const,
      label: "Scout Links",
      description: "CSV-based custom links organized by category",
    },
    tools: {
      key: "tools" as const,
      label: "Tools",
      description: "PayMore extension tools and features",
    },
    searchProviders: {
      key: "searchProviders" as const,
      label: "Search Providers",
      description: "Google, YouTube, Amazon, and other search engines",
    },
    ebayCategories: {
      key: "ebayCategories" as const,
      label: "eBay Categories",
      description: "Live eBay category suggestions as you type",
    },
  };

  const sources = settings.sourceOrder
    .map((key) => sourcesConfig[key as keyof typeof sourcesConfig])
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 text-foreground">
      {/* Header Bar */}
      <div className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-3">
            <img
              src="/assets/icons/dog.png"
              alt="Scout"
              className="w-8 h-8 rounded-lg shadow-sm"
            />
            <div>
              <h1 className="text-lg font-bold">Scout Settings</h1>
              {version && (
                <p className="text-xs text-muted-foreground">Version {version}</p>
              )}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {isSaved && (
              <div className="flex items-center gap-2 px-3 py-1.5 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Saved!</span>
              </div>
            )}
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm font-medium"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex max-w-[1800px] mx-auto">
        {/* Sidebar Navigation */}
        <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 border-r border-border/40 bg-background/50 backdrop-blur p-6">
          <nav className="space-y-1">
            <a
              href="#sources"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted/50 transition-colors text-foreground"
            >
              <Layers className="w-4 h-4" />
              Command Sources
            </a>
            <a
              href="#providers"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted/50 transition-colors text-foreground"
            >
              <SearchIcon className="w-4 h-4" />
              Search Providers
            </a>
            <a
              href="#guardrails"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted/50 transition-colors text-foreground"
            >
              <Check className="w-4 h-4" />
              Shopify Guardrails
            </a>
            <a
              href="#controller"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted/50 transition-colors text-foreground"
            >
              <Layers className="w-4 h-4" />
              Controller Testing
            </a>
            <a
              href="#bookmarks"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted/50 transition-colors text-foreground"
            >
              <Bookmark className="w-4 h-4" />
              Bookmarks
            </a>
          </nav>

          <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-border/40">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground block mb-2">Quick Tip</strong>
              Drag the <Menu className="w-3 h-3 inline" /> icon to reorder sources. Changes are saved automatically.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-8 space-y-12 max-w-5xl">
          {/* Command Sources Section */}
          <section id="sources" className="scroll-mt-20">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Command Menu Sources</h2>
              <p className="text-muted-foreground">
                Control which sources appear in your command menu and customize their order
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
              <div className="divide-y divide-border">
                {sources.map((source, index) => (
                  <div
                    key={source.key}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`p-6 flex items-start gap-4 hover:bg-muted/30 transition-all cursor-move group ${
                      draggedIndex === index ? "opacity-50 scale-[0.98]" : ""
                    }`}
                  >
                    <button
                      className="p-2 text-muted-foreground group-hover:text-foreground cursor-grab active:cursor-grabbing transition-colors"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-base">{source.label}</h3>
                        {settings.enabledSources[source.key] && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                            Enabled
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {source.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle(source.key)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        settings.enabledSources[source.key]
                          ? "bg-primary"
                          : "bg-muted-foreground/30"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                          settings.enabledSources[source.key]
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Search Providers Section */}
          <section id="providers" className="scroll-mt-20">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Search Providers</h2>
              <p className="text-muted-foreground">
                Configure built-in search engines and create custom search providers
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
              <div className="divide-y divide-border">
                {/* Default Search Providers */}
                <div className="p-8">
                  <h3 className="font-semibold text-lg mb-5">Default Providers</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[
                    { id: "google", name: "Google" },
                    { id: "scout", name: "Scout Search" },
                    { id: "amazon", name: "Amazon" },
                    { id: "bestbuy", name: "Best Buy" },
                    { id: "ebay", name: "eBay" },
                    { id: "pricecharting", name: "Price Charting" },
                    { id: "upcitemdb", name: "UPCItemDB" },
                    { id: "youtube", name: "YouTube" },
                    { id: "github", name: "GitHub" },
                    { id: "twitter", name: "Twitter/X" },
                    { id: "homedepot", name: "Home Depot" },
                    { id: "lowes", name: "Lowe's" },
                    { id: "menards", name: "Menards" },
                    { id: "microcenter", name: "Micro Center" },
                    ].map((provider) => (
                      <div
                        key={provider.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm font-medium">
                          {provider.name}
                        </span>
                        <button
                          onClick={() => handleToggleSearchProvider(provider.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.enabledSearchProviders[provider.id] ||
                            settings.enabledSearchProviders[provider.id] ===
                              undefined
                              ? "bg-primary"
                              : "bg-muted-foreground/30"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                              settings.enabledSearchProviders[provider.id] ||
                              settings.enabledSearchProviders[provider.id] ===
                                undefined
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Search Providers */}
                <div className="p-8">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-lg">Custom Providers</h3>
                    <button
                      onClick={() => setShowAddProvider(!showAddProvider)}
                      className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      Add Provider
                    </button>
                  </div>

                  {settings.customSearchProviders.length > 0 ? (
                    <div className="space-y-3">
                      {settings.customSearchProviders.map((provider, index) => (
                        <div
                          key={provider.id}
                          className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-sm mb-1">
                              {provider.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Triggers: {provider.triggers.join(", ")}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                handleToggleSearchProvider(provider.id)
                              }
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                settings.enabledSearchProviders[provider.id] ||
                                settings.enabledSearchProviders[provider.id] ===
                                  undefined
                                  ? "bg-primary"
                                  : "bg-muted-foreground/30"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                                  settings.enabledSearchProviders[provider.id] ||
                                  settings.enabledSearchProviders[provider.id] ===
                                    undefined
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomProvider(index)}
                              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 bg-muted/20 rounded-lg border border-dashed border-border">
                      <p className="text-sm text-muted-foreground">
                        No custom providers added yet. Click "Add Provider" to create one.
                      </p>
                    </div>
                  )}

                  {showAddProvider && (
                    <div className="mt-6 p-6 border border-border rounded-xl bg-muted/20">
                      <h4 className="font-semibold text-base mb-4">
                        Add Custom Search Provider
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Name
                          </label>
                          <input
                            type="text"
                            value={newProvider.name}
                            onChange={(e) =>
                              setNewProvider({
                                ...newProvider,
                                name: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            placeholder="e.g., Wikipedia"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Triggers (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={newProvider.triggers.join(", ")}
                            onChange={(e) =>
                              setNewProvider({
                                ...newProvider,
                                triggers: e.target.value
                                  .split(",")
                                  .map((t) => t.trim())
                                  .filter((t) => t),
                              })
                            }
                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            placeholder="e.g., wiki, w"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Search URL
                          </label>
                          <input
                            type="text"
                            value={newProvider.searchUrl}
                            onChange={(e) =>
                              setNewProvider({
                                ...newProvider,
                                searchUrl: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            placeholder="e.g., https://en.wikipedia.org/wiki/Special:Search?search={query}"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Use {"{query}"} as a placeholder for the search term
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Color
                          </label>
                          <select
                            value={newProvider.color}
                            onChange={(e) =>
                              setNewProvider({
                                ...newProvider,
                                color: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                          >
                            <option value="bg-blue-500">Blue</option>
                            <option value="bg-green-500">Green</option>
                            <option value="bg-red-500">Red</option>
                            <option value="bg-yellow-500">Yellow</option>
                            <option value="bg-purple-500">Purple</option>
                            <option value="bg-pink-500">Pink</option>
                            <option value="bg-indigo-500">Indigo</option>
                            <option value="bg-gray-500">Gray</option>
                          </select>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={handleAddCustomProvider}
                            disabled={
                              !newProvider.name ||
                              !newProvider.triggers.length ||
                              !newProvider.searchUrl
                            }
                            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-sm"
                          >
                            Add Provider
                          </button>
                          <button
                            onClick={() => {
                              setShowAddProvider(false);
                              setNewProvider({
                                name: "",
                                triggers: [],
                                searchUrl: "",
                                color: "bg-blue-500",
                              });
                            }}
                            className="px-5 py-2.5 bg-muted text-foreground rounded-lg hover:bg-muted/80 font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Shopify Guardrails Section */}
          <section id="guardrails" className="scroll-mt-20">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Shopify Guardrails</h2>
              <p className="text-muted-foreground">
                Automated validation checks for Shopify product pages to prevent common errors
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
                <div className="divide-y divide-border">
                  {/* Condition Mismatch Check */}
                  <div className="p-6 flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-base">Condition Mismatch Check</h3>
                        {settings.shopifyGuardrails?.enableConditionCheck && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Validates that eBay condition ID matches the Shopify condition. Shows red border and notification when mismatched.
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleGuardrail('condition')}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        settings.shopifyGuardrails?.enableConditionCheck ?? true
                          ? "bg-primary"
                          : "bg-muted-foreground/30"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                          settings.shopifyGuardrails?.enableConditionCheck ?? true
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Google Fields Check */}
                  <div className="p-6 flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-base">Empty Google Fields Check</h3>
                        {settings.shopifyGuardrails?.enableGoogleFieldsCheck && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Alerts when required Google Shopping metafields are empty. Shows orange border and notification with dismissible warning.
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleGuardrail('googleFields')}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        settings.shopifyGuardrails?.enableGoogleFieldsCheck ?? true
                          ? "bg-primary"
                          : "bg-muted-foreground/30"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                          settings.shopifyGuardrails?.enableGoogleFieldsCheck ?? true
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </section>

          {/* Controller Testing Section */}
          <section id="controller" className="scroll-mt-20">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Controller Testing</h2>
              <p className="text-muted-foreground">
                Adjust color change thresholds for controller input visualization
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
              <div className="p-8">
                <div className="space-y-6">
                  <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                    <p className="text-sm text-muted-foreground mb-4">
                      Set the thresholds at which controller inputs change color:
                      <span className="block mt-2 text-xs">
                        <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span> Green: Below light threshold
                        <span className="inline-block w-3 h-3 bg-orange-500 rounded-full ml-3 mr-1"></span> Orange: Between light and medium
                        <span className="inline-block w-3 h-3 bg-red-500 rounded-full ml-3 mr-1"></span> Red: Above medium threshold
                      </span>
                    </p>
                  </div>

                  {/* Light Threshold */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-base">Light Input Threshold</h3>
                        <p className="text-sm text-muted-foreground">
                          Green → Orange transition point
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-medium px-3 py-1 bg-muted rounded-lg">
                          {(settings.controllerTesting?.lightThreshold ?? 0.1).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0.05"
                        max="0.5"
                        step="0.05"
                        value={settings.controllerTesting?.lightThreshold ?? 0.1}
                        onChange={(e) => handleControllerThresholdChange('light', parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Medium Threshold */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-base">Medium Input Threshold</h3>
                        <p className="text-sm text-muted-foreground">
                          Orange → Red transition point
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-medium px-3 py-1 bg-muted rounded-lg">
                          {(settings.controllerTesting?.mediumThreshold ?? 0.25).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.05"
                        value={settings.controllerTesting?.mediumThreshold ?? 0.25}
                        onChange={(e) => handleControllerThresholdChange('medium', parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Bookmarks Section */}
          <section id="bookmarks" className="scroll-mt-20">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Bookmarks</h2>
              <p className="text-muted-foreground">
                Choose which bookmark folders to display in the command menu
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
              <div className="p-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium">
                      Bookmark Folders
                    </label>
                    <button
                      onClick={handleSelectAllFolders}
                      className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      {settings.bookmarkFolderIds?.length === 0 ? "Selected: All" : "Select All"}
                    </button>
                  </div>

                  {settings.bookmarkFolderIds?.length === 0 && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-400">
                        All bookmarks from all folders are currently shown
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {bookmarkFolders.map((folder) => {
                      const isSelected = settings.bookmarkFolderIds?.includes(folder.id) ?? false;
                      return (
                        <div
                          key={folder.id}
                          onClick={() => handleBookmarkFolderToggle(folder.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-primary/10 border-primary hover:bg-primary/15"
                              : "bg-muted/30 border-border hover:bg-muted/50"
                          }`}
                        >
                          <div
                            className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-colors ${
                              isSelected
                                ? "bg-primary border-primary"
                                : "bg-background border-muted-foreground/30"
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-primary-foreground" />
                            )}
                          </div>
                          <span className="text-sm font-medium flex-1">
                            {folder.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-muted-foreground mt-4">
                    Select specific folders to show only bookmarks from those folders, or click "Select All" to show bookmarks from all folders
                  </p>
                </div>
              </div>
            </div>
          </section>
          </main>
        </div>
      </div>
    );
  }
