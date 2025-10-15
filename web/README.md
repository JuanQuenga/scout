# Scout Landing Page

This is the public-facing Next.js landing page for the Scout Chrome extension, designed to be deployed on Vercel.

## Features

- Public landing page showcasing all Scout extension features
- Adapted from the extension's ThankYouPage component
- No Chrome extension APIs (works as a standalone website)
- Install buttons linking to Chrome Web Store
- Same styling and features as the extension
- Instructions for pinning the extension after installation

## Development

```bash
# Install dependencies
cd web
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

The dev server will run on http://localhost:3000

## Deployment

### Vercel

This project is configured for automatic deployment with Vercel:

1. Push your code to GitHub
2. Import your repository in Vercel
3. Vercel will automatically detect the configuration from `vercel.json` in the root directory
4. Deploy!

The `vercel.json` file in the root directory tells Vercel to:

- Build from the `web/` directory
- Install dependencies with pnpm
- Output to `web/.next`

### Important: Update Chrome Web Store URL

Before deploying, update the Chrome Web Store URL in `app/page.tsx`:

```typescript
// TODO: Replace with your actual Chrome Web Store URL
const chromeWebStoreUrl =
  "https://chrome.google.com/webstore/detail/scout/YOUR_EXTENSION_ID";
```

Replace `YOUR_EXTENSION_ID` with your actual extension ID from the Chrome Web Store.

## Project Structure

```
web/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (landing page)
│   └── globals.css        # Global styles
├── components/            # React components (add as needed)
├── public/                # Static assets (images, icons)
│   └── assets/            # Copied from extension's public/assets
├── package.json           # Dependencies
├── next.config.js         # Next.js configuration
├── tailwind.config.ts     # Tailwind configuration
├── postcss.config.js      # PostCSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Sharing Assets

The assets from the extension's `public/assets` directory are copied to `web/public/assets` during setup. If you update images in the extension, remember to update them in the web directory as well, or set up a symlink.

## Pinning the Extension

The landing page should include instructions for users to pin the Scout extension after installation:

### Why Pin?

- Quick access to the extension icon
- Easy visual indicator that Scout is active
- One-click access to extension features
- Faster access to the command menu

### Pin Instructions

After installing Scout from the Chrome Web Store, users should:

1. Click the **Extensions icon** (puzzle piece) in the Chrome toolbar
2. Find **Scout** in the list of extensions
3. Click the **pin icon** next to Scout
4. The Scout icon will now appear in the toolbar for quick access

Consider adding these instructions to the landing page UI in `app/page.tsx` as part of the post-installation guidance.

## Notes

- This is a separate Next.js app from the Chrome extension
- The extension code remains in the root directory (`src/`, `entrypoints/`, etc.)
- Both projects share the same monorepo but have independent dependencies
- The landing page uses the same Tailwind styling as the extension
