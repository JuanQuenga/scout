import { useState, useEffect } from "react";
import {
  Command,
  MousePointer,
  Gamepad2,
  Settings,
  Keyboard,
  Search,
  ArrowRight,
  ExternalLink,
  Copy,
  CheckCircle,
  Github,
} from "lucide-react";

// Component to render text with keyboard shortcuts
const renderTextWithKbd = (text: string) => {
  const parts = text.split(
    /(CMD\+Shift\+K|CTRL\+Shift\+K|CMD\+K|CTRL\+K|Tab|Enter|CMD|CTRL|Shift|K|eb|arrow keys)/
  );

  return parts.map((part, index) => {
    if (
      [
        "CMD+Shift+K",
        "CTRL+Shift+K",
        "CMD+K",
        "CTRL+K",
        "CMD",
        "CTRL",
        "Shift",
        "K",
        "Tab",
        "Enter",
        "ebay",
        "upc",
        "price charting",
        "arrow keys",
      ].includes(part)
    ) {
      return <kbd key={index}>{part}</kbd>;
    }
    return part;
  });
};

export default function FeaturesPage() {
  const [version, setVersion] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Get extension version
    const manifest = chrome.runtime.getManifest();
    setVersion(manifest.version);
  }, []);

  const handleCopyLink = () => {
    const installUrl =
      "https://chrome.google.com/webstore/detail/scout/your-extension-id";
    navigator.clipboard.writeText(installUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mainFeatures = [
    {
      id: 1,
      title: "Context Menu Actions",
      description:
        "Highlight text and instantly search for Sold Listings on eBay, MPN codes (Google), UPC codes (UPCItemDB & Google), or PriceCharting pricing data.",
      image: "/assets/images/context-menu.png",
      icon: MousePointer,
      howToUse: [
        "Highlight/select the text for a product anywhere on the page.",
        "Right click the selection to open the context menu.",
        "Choose the search you need: Sold eBay Listings, UPC Item DB, Google UPC/MPN, or PriceCharting.",
      ],
    },
    {
      id: 2,
      title: "Command Menu Popup",
      description:
        "Command menu popup to easily navigating through tabs, use tools, open quick links, and more.",
      image: "/assets/images/command-popup.png",
      icon: Command,
      howToUse: [
        "Pin the PayMore extension icon to your toolbar.",
        "Click the PayMore extension icon (or Press CMD + Shift + K / CTRL + Shift + K) to open the command menu)",
        "Type to filter results by tools, tabs, quick links, or search providers.",
        "Use Tab or arrow keys to focus an item and hit Enter to launch it.",
      ],
      subsections: [
        {
          title: "Search Providers",
          description:
            "Quickly search across multiple platforms by typing a shortcut, hitting Tab to activate, and Enter to open results.",
          subSubsections: [
            {
              title: "eBay Sold Listings",
              description:
                "Give a product name or MPN to search on eBay for sold listings.",
            },
            {
              title: "UPC Item Database",
              description:
                "Give a product name or UPC code to search on UPC Item Database for product information and UPC codes.",
            },
            {
              title: "Price Charting",
              description:
                "Give a UPC code or product name to search PriceCharting for market pricing data and attribute data.",
            },
          ],
        },
        {
          title: "Quick Navigation",
          description:
            "Select a tab, bookmark, or tool to open instantly by clicking or navigating with the arrow keys and hitting Enter on the desired item.",
        },
        {
          title: "Tab Switching",
          description:
            "Switch between active tabs by just hitting Enter on the desired tab.",
        },
        {
          title: "eBay Category Suggestions",
          description:
            "This command menu uses the eBay Taxonomy API to automatically show you a matching eBay category for query. Hit the Enter key or click on a category suggestion to copy it to your clipboard.",
        },
      ],
    },
    {
      id: 3,
      title: "Built-In Controller Testing",
      description:
        "Built-in controller testing tool with color visuals to indicate problems.",
      image: "/assets/images/controller-testing.png",
      icon: Gamepad2,
      features: [
        "Test hardware functionality of controllers.",
        "Colors give visual feedback for issues.",
        "Automatically opens when a controller is connected.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/assets/icons/dog.png"
                alt="PayMore"
                className="w-10 h-10 rounded-lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Paymore Lite - Features
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Chrome Extension Features Overview
                  {version && (
                    <span className="ml-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                      v{version}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  chrome.tabs.create({ url: "chrome://extensions/shortcuts" })
                }
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Keyboard className="w-4 h-4" />
                Keyboard Shortcuts
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full mb-6">
              <Command className="w-4 h-4" />
              <span className="text-sm font-medium">
                Powerful Features for Enhanced Productivity
              </span>
            </div>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Paymore Lite Features
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Essential tools and features designed to enhance productivity and
              streamline workflows for PayMore team members.
            </p>
          </div>

          {/* Main Features */}
          <div className="space-y-16 mb-16">
            {mainFeatures.map((feature, index) => (
              <div
                key={feature.id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8"
              >
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className={`${index % 2 === 1 ? "lg:order-2" : ""}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <feature.icon className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {feature.id}. {feature.title}
                      </h3>
                    </div>
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                      {feature.description}
                    </p>

                    {/* How to Use, Subsections, or Features */}
                    <div className="space-y-4">
                      {feature.subsections ? (
                        <div className="space-y-4">
                          {feature.howToUse && (
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <ArrowRight className="w-4 h-4" />
                                How To Use
                              </h4>
                              <ul className="space-y-2">
                                {feature.howToUse.map((step, stepIndex) => (
                                  <li
                                    key={stepIndex}
                                    className="flex items-start gap-3"
                                  >
                                    <span className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs flex items-center justify-center mt-0.5">
                                      {stepIndex + 1}
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-400 text-sm flex flex-wrap items-center gap-1">
                                      {renderTextWithKbd(step)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {feature.subsections.map((subsection, subIndex) => (
                            <div
                              key={subIndex}
                              className="border-l-2 border-green-500 pl-4"
                            >
                              <h5 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm">
                                {subsection.title}
                              </h5>
                              <p className="text-slate-600 dark:text-slate-400 text-sm flex flex-wrap items-center gap-1">
                                {renderTextWithKbd(subsection.description)}
                              </p>
                              {subsection.subSubsections && (
                                <div className="mt-3 ml-4 space-y-3">
                                  {subsection.subSubsections.map(
                                    (subSub, subSubIndex) => (
                                      <div
                                        key={subSubIndex}
                                        className="border-l-2 border-blue-400 pl-3"
                                      >
                                        <h6 className="font-medium text-slate-800 dark:text-slate-200 mb-1 text-xs">
                                          {subSub.title}
                                        </h6>
                                        <p className="text-slate-600 dark:text-slate-400 text-xs flex flex-wrap items-center gap-1">
                                          {renderTextWithKbd(
                                            subSub.description
                                          )}
                                        </p>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : feature.howToUse ? (
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            <ArrowRight className="w-4 h-4" />
                            How To Use
                          </h4>
                          <ul className="space-y-2">
                            {feature.howToUse.map((step, stepIndex) => (
                              <li
                                key={stepIndex}
                                className="flex items-start gap-3"
                              >
                                <span className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs flex items-center justify-center mt-0.5">
                                  {stepIndex + 1}
                                </span>
                                <span className="text-slate-600 dark:text-slate-400 text-sm flex flex-wrap items-center gap-1">
                                  {renderTextWithKbd(step)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Features
                          </h4>
                          <ul className="space-y-2">
                            {feature.features?.map(
                              (featureItem, featureIndex) => (
                                <li
                                  key={featureIndex}
                                  className="flex items-start gap-3"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-slate-600 dark:text-slate-400 text-sm">
                                    {featureItem}
                                  </span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`${index % 2 === 1 ? "lg:order-1" : ""}`}>
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-auto rounded-lg shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Customization Section */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-8 mb-12">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Settings className="w-6 h-6 text-green-600 dark:text-green-400" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Customization Options
                </h3>
              </div>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 max-w-3xl mx-auto">
                You can customize the command menu and keyboard shortcuts to
                match your workflow preferences. Press <kbd>Ctrl+Shift+O</kbd>{" "}
                (or <kbd>CMD+Shift+O</kbd> on Mac) to open extension settings
                and configure the command menu.
              </p>
              <div className="flex items-center justify-center">
                <button
                  onClick={() =>
                    chrome.tabs.create({ url: "chrome://extensions/shortcuts" })
                  }
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Keyboard className="w-5 h-5" />
                  Customize Keyboard Shortcuts
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/icons/dog.png"
                alt="PayMore"
                className="w-8 h-8 rounded-lg"
              />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Paymore Lite
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Chrome Extension for Paymore Staff
                </p>
              </div>
            </div>
            <a
              href="https://github.com/JuanQuenga/scout"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <span>Made with ❤️ by Juan Quenga</span>
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
