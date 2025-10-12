/* global chrome */
import { useState, useEffect } from "react";
import { Check, Menu, X } from "lucide-react";

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

  useEffect(() => {
    // Load settings from chrome storage
    chrome.storage.sync.get(["cmdkSettings"], (result) => {
      if (result.cmdkSettings) {
        setSettings(result.cmdkSettings);
      }
    });

    // Get extension version
    const manifest = chrome.runtime.getManifest();
    setVersion(manifest.version);
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <img
            src="/assets/icons/dog.png"
            alt="PayMore"
            className="w-12 h-12 rounded-lg shadow-sm"
          />
          <div>
            <h1 className="text-3xl font-bold">
              Scout Settings
              {version && (
                <span className="text-base text-muted-foreground ml-3 font-normal">
                  v{version}
                </span>
              )}
            </h1>
            <p className="text-base text-muted-foreground mt-1.5">
              Configure command menu sources and features
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Settings Card */}
          <div className="bg-card rounded-lg border border-border shadow-sm h-fit">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold mb-1">
                Command Menu Sources
              </h2>
              <p className="text-sm text-muted-foreground">
                Enable or disable different sources and reorder them
              </p>
            </div>

            <div className="divide-y divide-border">
              {sources.map((source, index) => (
                <div
                  key={source.key}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`p-5 flex items-start gap-4 hover:bg-muted/50 transition-colors cursor-move ${
                    draggedIndex === index ? "opacity-50" : ""
                  }`}
                >
                  <button
                    className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{source.label}</h3>
                      {settings.enabledSources[source.key] && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {source.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle(source.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enabledSources[source.key]
                        ? "bg-primary"
                        : "bg-muted-foreground/20"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
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

          {/* Search Providers Card */}
          <div className="bg-card rounded-lg border border-border shadow-sm h-fit">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold mb-1">Search Providers</h2>
              <p className="text-sm text-muted-foreground">
                Enable or disable specific search providers and add custom ones
              </p>
            </div>

            <div className="divide-y divide-border">
              {/* Default Search Providers */}
              <div className="p-6">
                <h3 className="font-medium mb-4">Default Providers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                      className="flex items-center justify-between py-2"
                    >
                      <span className="text-sm font-medium">
                        {provider.name}
                      </span>
                      <button
                        onClick={() => handleToggleSearchProvider(provider.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          settings.enabledSearchProviders[provider.id] ||
                          settings.enabledSearchProviders[provider.id] ===
                            undefined
                            ? "bg-primary"
                            : "bg-muted-foreground/20"
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            settings.enabledSearchProviders[provider.id] ||
                            settings.enabledSearchProviders[provider.id] ===
                              undefined
                              ? "translate-x-5"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Search Providers */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Custom Providers</h3>
                  <button
                    onClick={() => setShowAddProvider(!showAddProvider)}
                    className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                  >
                    Add Provider
                  </button>
                </div>

                {settings.customSearchProviders.length > 0 ? (
                  <div className="space-y-2">
                    {settings.customSearchProviders.map((provider, index) => (
                      <div
                        key={provider.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {provider.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Triggers: {provider.triggers.join(", ")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleToggleSearchProvider(provider.id)
                            }
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              settings.enabledSearchProviders[provider.id] ||
                              settings.enabledSearchProviders[provider.id] ===
                                undefined
                                ? "bg-primary"
                                : "bg-muted-foreground/20"
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                settings.enabledSearchProviders[provider.id] ||
                                settings.enabledSearchProviders[provider.id] ===
                                  undefined
                                  ? "translate-x-5"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomProvider(index)}
                            className="p-1 text-destructive hover:bg-destructive/10 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No custom providers added yet.
                  </p>
                )}

                {showAddProvider && (
                  <div className="mt-4 p-4 border border-border rounded-lg bg-card">
                    <h4 className="font-medium mb-3">
                      Add Custom Search Provider
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">
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
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                          placeholder="e.g., Wikipedia"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
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
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                          placeholder="e.g., wiki, w"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
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
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                          placeholder="e.g., https://en.wikipedia.org/wiki/Special:Search?search={query}"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Use {"{query}"} as a placeholder for the search term
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
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
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
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
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleAddCustomProvider}
                          disabled={
                            !newProvider.name ||
                            !newProvider.triggers.length ||
                            !newProvider.searchUrl
                          }
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80"
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
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6">
          {isSaved && (
            <div className="flex items-center gap-2 px-4 py-2 text-green-700 dark:text-green-400">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Saved!</span>
            </div>
          )}
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            Reset to Defaults
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 p-6 bg-muted/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Tip:</strong> Drag the{" "}
            <Menu className="w-3 h-3 inline" /> icon to reorder sources. The
            order you set here determines the order they appear in the command
            menu when it first opens.
          </p>
        </div>
      </div>
    </div>
  );
}
