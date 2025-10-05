import { useState, useEffect } from "react";
import { Check } from "lucide-react";

interface CMDKSettings {
  enabledSources: {
    tabs: boolean;
    bookmarks: boolean;
    history: boolean;
    quickLinks: boolean;
    tools: boolean;
    searchProviders: boolean;
  };
}

const DEFAULT_SETTINGS: CMDKSettings = {
  enabledSources: {
    tabs: true,
    bookmarks: true,
    history: true,
    quickLinks: true,
    tools: true,
    searchProviders: true,
  },
};

export default function SettingsPopup() {
  const [settings, setSettings] = useState<CMDKSettings>(DEFAULT_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);
  const [version, setVersion] = useState<string>("");

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

  const sources = [
    {
      key: "tabs" as const,
      label: "Tabs",
      description: "Search and switch between open browser tabs",
    },
    {
      key: "bookmarks" as const,
      label: "Bookmarks",
      description: "Access your saved bookmarks",
    },
    {
      key: "history" as const,
      label: "Recent History",
      description: "View recently visited pages",
    },
    {
      key: "quickLinks" as const,
      label: "Quick Links",
      description: "CSV-based custom links organized by category",
    },
    {
      key: "tools" as const,
      label: "Tools",
      description: "PayMore extension tools and features",
    },
    {
      key: "searchProviders" as const,
      label: "Search Providers",
      description: "Google, YouTube, Amazon, and other search engines",
    },
  ];

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex flex-col h-full">
        {/* Header - Compact */}
        <div className="flex items-center gap-2 p-4 border-b border-border shrink-0">
          <img
            src="/assets/images/brand.png"
            alt="PayMore"
            className="w-8 h-8 rounded-lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Settings</h1>
              {version && (
                <span className="text-xs text-muted-foreground">v{version}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Configure command menu sources and features
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Settings Card */}
          <div className="bg-card rounded-lg border border-border">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold mb-1">Command Sources</h2>
              <p className="text-sm text-muted-foreground">
                Enable or disable different sources in the command palette
              </p>
            </div>

            <div className="divide-y divide-border">
              {sources.map((source) => (
                <div
                  key={source.key}
                  className="p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors"
                >
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
            <button
              onClick={() => window.close()}
              className="ml-auto px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>

          {/* Info */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Tip:</strong> Disabled sources will not appear in the
              command palette search results. This can help declutter your
              search experience and improve performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
