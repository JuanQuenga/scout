# Paymore Chrome Lite Extension Releases

Download the latest version of the Paymore Chrome Lite Extension.

## Latest Release

### v1.0.1 (Current)

**Release Date:** October 06, 2025
**Download:** [paymore-chrome-v1.0.1.zip](./paymore-chrome-v1.0.1.zip)

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
**Download:** [paymore-chrome-lite-v1.0.0.zip](./paymore-chrome-lite-v1.0.0.zip)

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

1. Download [paymore-chrome-lite-v1.0.0.zip](./paymore-chrome-lite-v1.0.0.zip)
2. Unzip the file
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" (toggle in top right)
5. Click "Load unpacked"
6. Select the unzipped `paymore-chrome-lite` folder

Note: The packed version for Chrome Web Store submission is located at `.output/paymore-chrome-lite-v1.0.0-packed.zip`

## Installation Instructions

1. Download `paymore-chrome-lite-v1.0.0.zip`
2. Extract the ZIP file to a folder on your computer
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked"
6. Navigate to the extracted folder and select it
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
- CMDK requires `bookmarks` and `history` permissions (granted on install)
- Quick Links are cached for 30 minutes in Chrome storage
- If you encounter issues, check the [CMDK_README.md](../CMDK_README.md) for troubleshooting
- Settings changes are automatically saved

## Changelog Summary

**v1.0.0** - Initial Lite Release with CMDK Command Palette, Settings Page, and Multi-Platform Search

For questions or support, contact support@paymore.com
