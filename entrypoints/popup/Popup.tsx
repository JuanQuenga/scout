import {
  AlertCircle,
  Box,
  Check,
  Database,
  FileText,
  Settings as SettingsIcon,
  TabletSmartphone,
  Trash2,
  Zap,
} from "lucide-react";
import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { Badge } from "../../src/components/ui/badge";
import { Button } from "../../src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../src/components/ui/card";
import { Progress } from "../../src/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../src/components/ui/tabs";
import { Settings } from "./Settings";
/* global chrome */
declare const chrome: any;

interface ModelInfo {
  preset: string;
  performance: "fast" | "balanced" | "accurate";
  size: string;
  dimension: number;
  description: string;
}

interface StorageStats {
  indexedPages: number;
  totalDocuments: number;
  totalTabs: number;
  indexSize: number;
  isInitialized: boolean;
}

// Semantic engine feature removed (never shipped)

const availableModels: ModelInfo[] = [
  {
    preset: "multilingual-e5-small",
    performance: "fast",
    size: "118MB",
    dimension: 384,
    description: "Lightweight model for quick processing",
  },
  {
    preset: "multilingual-e5-base",
    performance: "balanced",
    size: "278MB",
    dimension: 768,
    description: "Balanced speed and accuracy for everyday workflows",
  },
];

const DEFAULT_STORAGE_STATS: StorageStats = {
  indexedPages: 0,
  totalDocuments: 0,
  totalTabs: 0,
  indexSize: 0,
  isInitialized: false,
};

// semantic engine removed

class ErrorBoundary extends Component<any, { hasError: boolean; error?: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error("Popup crashed:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-sm text-red-600">
          <div className="font-semibold mb-2">
            Something went wrong in the popup.
          </div>
          <pre className="whitespace-pre-wrap text-xs text-red-700/80">
            {String(this.state.error?.message || this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Popup() {
  const [currentModel, setCurrentModel] = useState<string>(
    "multilingual-e5-small"
  );
  const [storageStats, setStorageStats] = useState<StorageStats>(
    DEFAULT_STORAGE_STATS
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [extVersion, setExtVersion] = useState<string | null>(null);
  const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadInitialState();
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  const loadInitialState = async () => {
    try {
      // set extension version from manifest if available
      try {
        const manifest =
          chrome.runtime && chrome.runtime.getManifest
            ? chrome.runtime.getManifest()
            : null;
        if (manifest && manifest.version)
          setExtVersion(String(manifest.version));
      } catch (_) {}
      const stored = await chrome.storage.local.get([
        "selectedModel",
        // Semantic engine keys removed
        "grokStorageStats",
      ]);

      if (stored.selectedModel && typeof stored.selectedModel === "string") {
        setCurrentModel(stored.selectedModel);
      }

      if (stored.grokStorageStats) {
        setStorageStats({
          ...DEFAULT_STORAGE_STATS,
          ...stored.grokStorageStats,
        });
      } else {
        setStorageStats(DEFAULT_STORAGE_STATS);
      }

      await refreshStorageStats();
    } catch (error) {
      console.error("Popup: failed to load initial state", error);
    }
  };

  const refreshStorageStats = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "get_storage_stats",
      });
      if (response?.success && response.stats) {
        setStorageStats(response.stats as StorageStats);
      }
    } catch (error) {
      console.error("Popup: failed to refresh storage stats", error);
    }
  };

  const switchModel = async (modelPreset: string) => {
    setCurrentModel(modelPreset);
  };

  const clearAllData = async () => {
    if (isClearingData) return;
    setIsClearingData(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: "clear_all_data",
      });
      if (response?.success) {
        setShowClearConfirm(false);
        await refreshStorageStats();
      } else if (response?.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error("Popup: failed to clear data", error);
    } finally {
      setIsClearingData(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 MB";
    const mb = Math.max(1, Math.round(bytes / (1024 * 1024)));
    return `${mb} MB`;
  };

  // Semantic engine removed — no status color or label

  const performanceBadgeVariant = (performance: ModelInfo["performance"]) => {
    switch (performance) {
      case "fast":
        return "bg-green-100 text-green-800";
      case "balanced":
        return "bg-blue-100 text-blue-800";
      case "accurate":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <ErrorBoundary>
      <div className="w-96 h-[600px] bg-background text-foreground">
        <header className="bg-stone-950">
          <div className="flex items-center justify-center p-3">
            <div className="flex items-center gap-2">
              <img
                src="/assets/images/paymore.svg"
                alt="Paymore"
                className="h-6"
              />
              {extVersion && (
                <span className="text-xs text-muted-foreground">
                  v{extVersion}
                </span>
              )}
            </div>
          </div>
        </header>

        <Tabs defaultValue="toolbar" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4 gap-2">
            <TabsTrigger value="toolbar" className="text-center">
              Toolbar
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-center">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="toolbar"
            className="pb-6 space-y-6 overflow-y-auto max-h-[500px]"
          >
            <Settings toolbarOnly={true} />
          </TabsContent>

          <TabsContent
            value="settings"
            className="pb-6 space-y-6 overflow-y-auto max-h-[500px]"
          >
            <Settings />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}

interface StatTileProps {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}

function StatTile({ label, value, icon: Icon, accent }: StatTileProps) {
  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={`rounded p-1 ${accent}`}>
          <Icon className="h-3 w-3" />
        </span>
      </div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}
