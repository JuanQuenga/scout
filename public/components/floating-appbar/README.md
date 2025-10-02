### PayMore Extension Floating Toolbar – Add/Remove Buttons Guide

This guide explains the correct way (for humans and AI) to add or remove buttons on the PayMore Chrome Extension floating toolbar so the side panel opens reliably.

---

## Architecture overview

- Toolbar markup: `paymore-extension/components/floating-appbar/toolbar.html`
  - Contains the button HTML. Inline scripts in this file are NOT executed when injected (injected via `innerHTML`). Treat inline script as reference only.
- Event binding: `paymore-extension/content/content.js`
  - All toolbar button click handlers must be registered here. Do not rely on inline `<script>` inside `toolbar.html`.
- Side panel and routing: `paymore-extension/background/background.js`
  - Maps a tool slug to a Next.js route via `toolToPath()` and opens the side panel.
- Side panel header label: `paymore-extension/sidepanel.js`
  - Maps tool slug to display name in `toolToDisplayName()`.
- Tool UI (Next.js): `app/tools/**`
  - The central router is `app/tools/page.tsx`. Each tool is a folder like `app/tools/<slug>/page.tsx`.

Side panel open flow: Button click → `content.js:setActiveTool(slug)` → updates localStorage + sends `openInSidebar` message → background opens `sidepanel.html` and sets `sidePanelTool` = slug → side panel loads `/tools` and switches to the requested tool.

---

## Naming conventions

- Button id: `pm-tb-<slug>` (example: `pm-tb-ebay`)
- Tool slug: short, lowercase, kebab-case (example: `ebay`, `shopify-storefront`)

---

## Add a new toolbar button

1. Add the button markup to the toolbar

File: `paymore-extension/components/floating-appbar/toolbar.html`

```html
<div class="pm-tb-item">
  <button class="pm-tb-btn" id="pm-tb-<slug>" aria-label="<Title>">
    <!-- icon: inline SVG or <img> using chrome.runtime.getURL -->
    <!-- example inline SVG -->
    <svg class="pm-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <!-- ... -->
    </svg>
  </button>
  <div class="pm-tip"><Title></div>
  <!-- keep width/height around 22–24px for visual consistency -->
```

2. Register the click handler in the content script

File: `paymore-extension/content/content.js`

Find the existing handler block and add the new one:

```js
// <Title> button: open tool in sidepanel
const newBtn = container.querySelector("#pm-tb-<slug>");
if (newBtn) {
  newBtn.addEventListener("click", () => {
    setActiveTool("<slug>");
  });
}
```

Notes:

- This is mandatory. Do not rely on the inline `<script>` inside `toolbar.html`.
- `setActiveTool()` updates localStorage and sends `openInSidebar` to background.

3. Map the tool to a URL (background)

File: `paymore-extension/background/background.js`

Add a case in `toolToPath()`:

```js
case "<slug>":
  return "/tools/<slug>";
```

4. Add a readable label for the side panel header (optional but recommended)

File: `paymore-extension/sidepanel.js`

Update `toolToDisplayName()`:

```js
case "<slug>":
  return "<Title>";
```

5. Register the tool in the Next.js tools router

File: `app/tools/page.tsx`

- Dynamic import:

```ts
const NewToolPage = dynamic(() => import("./<slug>/page"), { ssr: false });
```

- Extend the `ToolType` union:

```ts
type ToolType = "checkout-prices" | "..." | "<slug>";
```

- Add to `toolComponents`:

```ts
"<slug>": NewToolPage,
```

- Add to `toolTitles`:

```ts
"<slug>": "<Title>",
```

- Create the page component if it doesn’t exist yet:

`app/tools/<slug>/page.tsx`

6. Icon assets (optional)

- If using an image file, add it under `paymore-extension/assets/images/` and reference it via `chrome.runtime.getURL("assets/images/<file>")`.
- Ensure `manifest.json` includes the folder under `web_accessible_resources`.

7. Build and reload

- Build extension bundle: `cd paymore-extension && npm run build`
- In Chrome: chrome://extensions → toggle Developer mode → Reload the PayMore extension.

8. Test

- Click the new toolbar button → side panel should open on `/tools/<slug>`.
- Verify the side panel header shows the desired title.

---

## Remove an existing toolbar button

1. Remove the button markup from `toolbar.html`.
2. Remove the corresponding click handler in `content.js`.
3. If the tool is being retired entirely:
   - Remove the `toolToPath()` mapping in `background.js`.
   - Remove the `toolToDisplayName()` case in `sidepanel.js`.
   - Remove the dynamic import, union entry, and mappings in `app/tools/page.tsx`.
   - Optionally delete `app/tools/<slug>/`.
4. Build and reload the extension.

---

## Troubleshooting

- Symptom: Button does nothing.
  - Ensure there is a click handler in `content.js` for `#pm-tb-<slug>`.
  - Confirm the button id in HTML exactly matches the selector in `content.js`.
  - Confirm the `toolToPath()` case exists in `background.js` and points to a valid `/tools/<slug>` route.
  - Ensure `app/tools/page.tsx` registers the tool in `toolComponents` and `ToolType`.
  - Reload the extension after building.

- Symptom: Side panel opens but shows wrong title.
  - Update `toolToDisplayName()` in `sidepanel.js` for the slug.

- Symptom: Icon not visible.
  - If using an image, load it via `chrome.runtime.getURL` and ensure `manifest.json` exposes it in `web_accessible_resources`.

---

## Notes

- Inline scripts in `toolbar.html` won’t run because the toolbar HTML is injected via `innerHTML`. Always bind events in `content.js`.
- Prefer inline SVG for icons to avoid CSP/resource issues. If you must use images, load with `chrome.runtime.getURL`.
- Keep button sizes consistent: 44×44 button with a ~22–24px icon.
