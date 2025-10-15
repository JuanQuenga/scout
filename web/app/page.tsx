"use client";

import { useState } from "react";
import {
  Command,
  MousePointer,
  Gamepad2,
  Settings,
  Search,
  ArrowRight,
  ExternalLink,
  Copy,
  CheckCircle,
  Github,
  TrendingUp,
  Barcode,
  Shield,
  Download,
  Pin,
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

export default function HomePage() {
  // Updated Chrome Web Store URL
  const chromeWebStoreUrl =
    "https://chromewebstore.google.com/detail/scout/bmgghhmlflbhlnomgnoodpidekpaaifk?authuser=0&hl=en";

  const mainFeatures = [
    {
      id: 1,
      title: "Quick Actions",
      description:
        "Highlight text and instantly search for Sold Listings on eBay, MPN codes (Google), UPC codes (UPCItemDB & Google), or PriceCharting pricing data.",
      image: "/assets/images/quick-actions.png",
      icon: MousePointer,
      howToUse: [
        "Highlight/select the text for a product anywhere on the page.",
        "Right click the selection to open the context menu.",
        "Choose the search you need: Sold eBay Listings, UPC Item DB, Google UPC/MPN, or PriceCharting.",
      ],
    },
    {
      id: 2,
      title: "Command Menu",
      description:
        "Arc-style command palette for quick navigation, tab switching, and multi-provider search with 14 integrated search providers.",
      image: "/assets/images/command-menu.png",
      icon: Command,
      howToUse: [
        "Pin the Scout extension icon to your toolbar (or use CMD+Shift+K / CTRL+Shift+K).",
        "Click the Scout extension icon to open the command menu instantly.",
        "Type to filter through tabs, Scout Links, bookmarks, history, or search providers.",
        "Use Tab or arrow keys to navigate, hit Enter to select, or type a trigger word (like 'ebay' + Tab) to search.",
      ],
      subsections: [
        {
          title: "14 Search Providers",
          description:
            "Type a trigger word (like 'ebay', 'amazon', 'youtube') + Tab to activate a search provider, then type your query and hit Enter to search.",
          subSubsections: [
            {
              title: "E-commerce",
              description:
                "Amazon, Best Buy, eBay (sold listings), Home Depot, Lowe's, Menards, Micro Center, Price Charting",
            },
            {
              title: "General & Media",
              description: "Google, Scout Search, YouTube, GitHub, Twitter/X",
            },
            {
              title: "Product Data",
              description:
                "UPC Item DB (barcode lookup), eBay Taxonomy API (category suggestions)",
            },
          ],
        },
        {
          title: "Scout Links & Quick Navigation",
          description:
            "Access custom links from Google Sheets (30-min cache) with categories. Configure custom CSV URL in settings or download the template to create your own.",
        },
        {
          title: "Tab Switching & Bookmarks",
          description:
            "Switch between open tabs, access your 20 most recent bookmarks (with folder filtering), and browse last 30 visited pages.",
        },
        {
          title: "eBay Category API",
          description:
            "Live eBay category suggestions as you type. Click any category to copy the category ID to clipboard instantly.",
        },
      ],
    },
    {
      id: 3,
      title: "Built-In Controller Testing",
      description:
        "Real-time controller testing with visual feedback. Press CMD+J / CTRL+J to open the sidepanel and test any gamepad.",
      image: "/assets/images/controller-testing.png",
      icon: Gamepad2,
      features: [
        "Test all 20 buttons, analog sticks, and triggers with real-time visualization",
        "Color-coded feedback: Green (light input), Orange (medium input), Red (strong input)",
        "Customizable thresholds in settings for personalized sensitivity",
        "Auto-detects and connects to Xbox, PlayStation, and generic controllers",
        "SVG-based controller diagram with live input highlighting",
        "Automatically opens when a new controller is connected",
      ],
    },
    {
      id: 4,
      title: "eBay Price Summary",
      description:
        "Automatic price statistics displayed at the top of eBay sold listings pages. Get instant market insights without manual calculations.",
      image: "/assets/images/ebay-price-summary.png",
      icon: TrendingUp,
      features: [
        "Displays average, median, high, and low sale prices automatically",
        "Clickable metrics to jump to highest/lowest/latest sold items",
        "Quick filter buttons to view only new or used condition items",
        "Shows total item count for better market analysis",
        "Dismissible per search session to reduce clutter",
        "Toggle on/off in settings (enabled by default)",
      ],
    },
    {
      id: 5,
      title: "UPC Highlighter",
      description:
        "Automatically detects and highlights 12-digit UPC codes on any webpage. Click any highlighted code to copy it to your clipboard.",
      image: "/assets/images/upc-highlighter.png",
      icon: Barcode,
      features: [
        "Detects 12-digit UPC codes automatically across all websites",
        "Highlights codes with distinctive styling for easy identification",
        "Click-to-copy functionality with visual confirmation",
        "Hover tooltip shows 'Click to copy' instruction",
        "Works on dynamic content and AJAX-loaded pages",
        "Toggle on/off in settings (enabled by default)",
      ],
    },
    {
      id: 6,
      title: "Shopify Guardrails",
      description:
        "Automated validation checks for Shopify product pages to catch common errors before they cause problems.",
      image: "/assets/images/shopify-guardrails.png",
      icon: Shield,
      features: [
        "Condition Mismatch Check: Validates eBay condition ID matches Shopify condition",
        "Empty Google Fields Check: Alerts when required Google Shopping metafields are empty",
        "Visual indicators: Red border for condition mismatches, orange for empty fields",
        "Dismissible notifications with clear error descriptions",
        "Both checks can be toggled independently in settings",
        "Automatic refresh when settings are changed",
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
                alt="Scout"
                className="w-10 h-10 rounded-lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Scout
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Chrome Extension
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={chromeWebStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Install Extension
              </a>
              <a
                href="https://github.com/JuanQuenga/scout"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Full Screen */}
      <section className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <img
              src="/assets/icons/dog.png"
              alt="Scout"
              className="w-24 h-24 rounded-lg mx-auto mb-8"
            />
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full mb-6">
              <Command className="w-4 h-4" />
              <span className="text-sm font-medium">
                Powerful Features for Enhanced Productivity
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Scout Chrome Extension
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-12">
              Transform your browsing experience with Scout. A versatile Chrome
              extension with command palette, controller testing, multi-provider
              search, and automated content enhancement features.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a
              href={chromeWebStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-3 text-lg font-semibold"
            >
              <Download className="w-5 h-5" />
              Install from Chrome Web Store
            </a>
            <a
              href="https://github.com/JuanQuenga/scout"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-3 text-lg font-semibold"
            >
              <Github className="w-5 h-5" />
              View on GitHub
            </a>
          </div>

          <div className="flex items-center justify-center">
            <a
              href="#features"
              className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors animate-bounce"
            >
              <span>Explore Features</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Scout Features
            </h2>
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

          {/* Open Source CTA Section */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-8 mb-12">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Github className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Open Source & Open for Contributions
                </h3>
              </div>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 max-w-3xl mx-auto">
                Scout is open source and built by the community. We welcome
                contributions from developers of all skill levels. Whether you
                want to fix a bug, add a feature, or improve documentation, we'd
                love your help.
              </p>
              <div className="bg-white dark:bg-slate-700 rounded-lg p-8 text-left max-w-2xl mx-auto mb-6">
                <h4 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Ways to Contribute
                </h4>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Report bugs or request features on GitHub Issues
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Submit pull requests with bug fixes or new features
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Help improve documentation and write guides
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Share feedback and suggestions for improvement
                    </span>
                  </li>
                </ul>
              </div>
              <div className="flex items-center justify-center">
                <a
                  href="https://github.com/JuanQuenga/scout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <Github className="w-5 h-5" />
                  View on GitHub
                </a>
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
                alt="Scout"
                className="w-8 h-8 rounded-lg"
              />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Scout
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Versatile Chrome Extension
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
