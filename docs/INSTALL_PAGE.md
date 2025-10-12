# Paymore Lite Install Page

This document describes the install page for the Paymore Lite Chrome extension.

## Overview

The install page provides a user-friendly interface for installing the Paymore Lite extension. It includes step-by-step instructions, feature highlights, and download links.

## Files

- `src/components/landing/InstallPage.tsx` - The main React component for the install page
- `entrypoints/install/index.html` - HTML template for the install page
- `entrypoints/install/main.tsx` - Entry point that renders the InstallPage component

## Features

### Installation Steps

The install page guides users through 4 simple steps:

1. Download the Extension
2. Open Chrome Extensions
3. Enable Developer Mode
4. Install the Extension

### Feature Highlights

The page showcases key features of Paymore Lite:

- Command Menu (CMD+Shift+K)
- Lightning Fast performance
- Secure & Private operation
- Time-saving capabilities

### Download Section

Users can download the latest version directly from the install page with a single click.

## Accessing the Install Page

### From the Landing Page

1. Open the extension options page
2. Click the "Install Extension" button in the header

### Direct URL

The install page can be accessed directly at:

```
chrome-extension://[EXTENSION_ID]/install.html
```

Replace `[EXTENSION_ID]` with the actual ID of your installed extension.

## Testing

To test the install page functionality:

1. Load the extension in developer mode
2. Open the browser console
3. Run the test script:
   ```javascript
   // Copy and paste the contents of test-install.js in the console
   ```

## Building

The install page is automatically included when building the extension:

```bash
npm run build
```

The install page will be available in the `.output/scout/` directory.

### WXT Configuration

The install page is automatically detected by WXT as an "unlisted-page" entrypoint. No additional configuration is required in `wxt.config.ts`. The page is accessible via `chrome.runtime.getURL("/install.html")` from within the extension.

## Customization

### Modifying Installation Steps

Edit the `installSteps` array in `InstallPage.tsx` to customize the installation instructions.

### Updating Features

Modify the `features` array in `InstallPage.tsx` to update the feature highlights.

### Changing Download Link

Update the download link in the "Download Section" of `InstallPage.tsx`:

```tsx
<a
  href="/releases/scout-1.0.0-chrome.zip"
  download
  // ...
>
```

## Browser Compatibility

The install page is designed for Google Chrome. A compatibility notice is shown for non-Chrome browsers.

## Styling

The install page uses Tailwind CSS for styling and follows the same design system as the rest of the extension.

## Troubleshooting

### Install Page Not Loading

1. Ensure the extension is properly loaded in developer mode
2. Check the browser console for any errors
3. Verify that all files are correctly built

### Download Link Not Working

1. Check that the release file exists in the `releases/` directory
2. Verify the file path in the download link
3. Ensure the file is included in the build output

### Styling Issues

1. Check that Tailwind CSS is properly configured
2. Verify that the CSS file is correctly imported
3. Check for any CSS conflicts in the browser console
