# Paymore Lite Chrome Extension Releases

Download the latest version of the Paymore Lite Chrome Extension.

## Latest Release

### v1.0.3 (Current)

**Release Date:** October 10, 2025
**Download:** [paymore-lite-1.0.3-chrome.zip](./paymore-lite-1.0.3-chrome.zip)

**What's New:**

### Features

- **Enhanced Context Menu Options**: Added three new right-click search options for selected text:
  - Search on UPCItemDB
  - Search for UPC on Google
  - Search on PriceCharting
- **Improved Install Page**: Updated install page with better "How To Use" sections and clearer feature descriptions

### Improvements

- **Smarter CSV Caching**: Quick Links now return cached data immediately even if expired, then refresh in background for seamless UX
- **Improved Loading States**: Loading skeleton only shows on true initial load (no cache), not on cache refresh
- **Cleaner Context Menu Titles**: Simplified right-click menu item labels for better readability

### Bug Fixes

- Fixed cache expiration logic to prevent unnecessary loading states when cached data is available

---

## Previous Releases

### v1.0.2

**Release Date:** October 07, 2025
**Download:** [paymore-lite-1.0.2-chrome.zip](./paymore-lite-1.0.2-chrome.zip)

**What's New:**

This release refines the CMDK search palette and adds an integrated eBay taxonomy lookup for quickly finding the matching eBay category for items.

### Features

- eBay Categories (Taxonomy API): You can now query the eBay Taxonomy API directly and surfaces matching categories in the Command Menu.
- Copy-to-clipboard: Press Enter or click a category suggestion to copy the category path without closing the palette; a short "Copied" hint appears. (for eBay categories in the Command Menu)
- Source Ordering: Command Menu sources can be reordered and persisted in settings.

### Improvements

- Commad Menu: refined skeletons, focused scrolling behavior, and improved keyboard handling for provider triggers.

### Bug Fixes

- Fixed scrolling bug in Command Menu when typing your query.
- Fixed various provider activation edge-cases and improved debounce/error handling for taxonomy lookups.
- Fixed the opening/close behavior for the controller testing sidepanel.

---

### v1.0.1

**Release Date:** October 06, 2025
**Download:** [paymore-lite-1.0.1-chrome.zip](./paymore-lite-1.0.1-chrome.zip)

**What's New:**

### Features

- Fixed UPC Item Database search URL format

### Improvements

- Updated search provider to use correct UPC database URL path

### Bug Fixes

- Corrected UPCItemDB search URL from `/search?q={query}` to `/upc/{query}`

---

### v1.0.0

**Release Date:** October 05, 2025
**Download:** [paymore-lite-1.0.0-chrome.zip](./paymore-lite-1.0.0-chrome.zip)

**What's New:**

This is the first release of Paymore Lite, a streamlined browser extension designed for Paymore staff focusing on quick navigation and search capabilities.

### Features

- **CMDK Command Palette**: Arc-style command palette accessible via `CMD+Shift+K` / `CTRL+Shift+K`
- **Quick Links**: Cached custom links from Google Sheets with 30-minute caching for instant access
- **Tab Switching**: Fast switching between open tabs with search and filter
- **Search Providers**: 10 integrated search engines including PayMore, Google, Amazon, Best Buy, eBay, Price Charting, UPC Item DB, YouTube, GitHub, and Twitter/X
- **Bookmarks & History**: Access your 20 most recent bookmarks and last 30 visited pages
- **Settings Page**: Configure which command sources are enabled/disabled via `CMD+Shift+O` / `CTRL+Shift+O`
- **Auto-Save Settings**: Changes to settings are automatically saved
- **Smart Navigation**: Backspace to exit search providers, arrow keys for navigation

### Keyboard Shortcuts

- `CMD+Shift+K` / `CTRL+Shift+K` - Open CMDK popup
- `CMD+Shift+O` / `CTRL+Shift+O` - Open settings page

### Installation

1. Download [paymore-lite-1.0.0-chrome.zip](./paymore-lite-1.0.0-chrome.zip)
2. Unzip the file
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" (toggle in top right)
5. Click "Load unpacked"
6. Select the unzipped `paymore-lite` folder

## Installation Instructions

1. Download `paymore-lite-1.0.3-chrome.zip`
2. Extract the ZIP file to a folder on your computer
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked"
6. Navigate to the extracted folder and select the `paymore-lite` folder
7. The extension will be installed and ready to use

### For Chrome Web Store Submission

The packed version is ready for Chrome Web Store upload via the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

## Keyboard Shortcuts Setup

After installation, you can customize keyboard shortcuts:

1. Go to `chrome://extensions/shortcuts`
2. Find "Paymore Lite" extension
3. Customize shortcuts for:
   - Open CMDK popup (default: `CMD+Shift+K`)
   - Open settings page (default: `CMD+Shift+O`)

## Notes

- Always download from official releases to ensure security
- For the latest features and bug fixes, use the current release (v1.0.3)
- CMDK requires `bookmarks` and `history` permissions (granted on install)
- Quick Links are cached for 30 minutes in Chrome storage
- If you encounter issues, check the [CMDK_README.md](../CMDK_README.md) for troubleshooting
- Settings changes are automatically saved

## Changelog Summary

**v1.0.3** - Enhanced context menu options, smarter CSV caching, improved install page
**v1.0.2** - eBay taxonomy lookup, command menu refinements, source ordering
**v1.0.1** - Fixed UPC Item Database search URL format
**v1.0.0** - Initial Lite Release with CMDK Command Palette, Settings Page, and Multi-Platform Search

For questions or support, contact support@paymore.com
