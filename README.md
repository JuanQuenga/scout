# Paymore Chrome Extension

## Overview

The Paymore Chrome Extension is a browser extension built with WXT (Web Extension Toolkit) and React. It provides tools for inventory management, price checking, and e-commerce assistance specifically tailored for Paymore's operations. The extension includes popup interfaces, content scripts for interacting with web pages (e.g., POS inventory), background scripts, and side panels.

Key features:

- **Popup UI**: React-based interface for quick actions like scanning items, checking prices, and accessing settings.
- **Content Scripts**: Inject functionality into e-commerce sites (e.g., Shopify) for real-time data extraction and automation.
- **Background Services**: Handle persistent tasks like API calls, storage, and notifications.
- **Side Panel**: Additional UI for detailed views.

The project uses Tailwind CSS for styling, TypeScript for type safety, and PNPM for package management.

## Prerequisites

- Node.js (v18 or higher)
- PNPM (v8 or higher) - Install via `npm install -g pnpm`
- Chrome browser (for testing)

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/paymore-chrome.git
   cd paymore-chrome
   ```

2. Install dependencies:

   ```
   pnpm install
   ```

3. Set up environment variables (if needed):
   - Copy `.env.example` to `.env.local` and fill in API keys (e.g., for Paymore backend, PriceCharting API).

## Development

1. Start the development server:

   ```
   pnpm dev
   ```

   This builds the extension and serves it for hot-reloading. The extension will be available in the `.output` directory.

2. Load the extension in Chrome:

   - Open Chrome and go to `chrome://extensions/`.
   - Enable "Developer mode".
   - Click "Load unpacked" and select the `.output` directory.

3. For hot-reloading during development:
   - Changes to source files will trigger rebuilds.
   - Reload the extension in Chrome to see updates.

### Scripts

- `pnpm dev`: Development mode with hot-reloading.
- `pnpm build`: Production build.
- `pnpm preview`: Preview the built extension.

## Project Structure

```
paymore-chrome/
├── entrypoints/          # Extension entry points
│   ├── background.ts     # Background script
│   ├── content.ts        # Main content script
│   ├── content-pos-inventory.ts  # POS-specific content script
│   ├── popup/            # Popup UI (React components)
│   ├── sidepanel/        # Side panel UI
│   └── styles/           # Global styles
├── public/               # Static assets (images, etc.)
├── src/                  # Source code
│   ├── common/           # Shared utilities
│   ├── components/       # React components
│   ├── lib/              # Library functions
│   └── utils/            # Helper utilities
├── tailwind.config.cjs   # Tailwind configuration
├── wxt.config.ts         # WXT configuration
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Key Configurations

- **WXT Config** (`wxt.config.ts`): Defines runtime, permissions, and entry points. Review for manifest settings.
- **Tailwind** (`tailwind.config.cjs`): Configured for Chrome extension content (purging unused styles).
- **TypeScript**: Strict mode enabled for better code quality.

## Building for Production

1. Build the extension:

   ```
   pnpm build
   ```

2. The output will be in `.output/`, ready for zipping and submission to Chrome Web Store.

3. To zip for store submission:
   ```
   zip -r paymore-extension.zip .output/
   ```

## Testing

- **Manual Testing**: Load in Chrome and test popup, content scripts on target sites (e.g., Shopify POS).
- **POS Inventory**: Use `debug-pos-inventory.js` in public/ for standalone testing.
- **Unit Tests**: Add Jest or Vitest for component testing (not implemented yet).

## Deployment to Chrome Web Store

1. Create a developer account at [Chrome Web Store](https://chrome.google.com/webstore/devconsole).
2. Prepare assets: icons, screenshots (in `public/assets/`).
3. Upload the zip file generated from build.
4. Fill in store listing details (description provided separately).

## Troubleshooting

- **Hot-reload not working**: Restart `pnpm dev` and reload extension.
- **Content script issues**: Check console in page inspect (ensure permissions in manifest).
- **Build errors**: Verify Node/PNPM versions; clear cache with `pnpm store prune`.
- **Tailwind styles missing**: Ensure PostCSS is configured correctly.

## Contributing

1. Fork the repo.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit changes: `git commit -m 'Add amazing feature'`.
4. Push: `git push origin feature/amazing-feature`.
5. Open a Pull Request.

## License

MIT License - see LICENSE file for details.

For issues or questions, open a GitHub issue.
