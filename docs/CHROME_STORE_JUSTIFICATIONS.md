# Chrome Web Store Privacy Practices Justifications

## Permissions and Features Justifications

### activeTab

**Justification:** The activeTab permission allows the extension to access the currently active tab when the user explicitly interacts with the extension. This is used to provide context-aware functionality and display relevant information about the current page when the user opens the sidepanel or popup.

### bookmarks

**Justification:** The bookmarks permission is used to allow users to access and search through their browser bookmarks directly from the extension's command palette. This provides a quick way to navigate to bookmarked pages without leaving the current context.

### contextMenus

**Justification:** Context menu permissions are used to add useful options to the right-click menu, allowing users to quickly access extension features and perform actions related to the current page or selected content.

### history

**Justification:** The history permission enables the extension to search through browser history in the command palette, helping users quickly find and revisit previously viewed pages without disrupting their workflow.

### host permissions

**Justification:** Host permissions are required for the extension to interact with specific websites as needed for its core functionality. This includes reading page content for context-aware features and providing enhanced functionality on supported sites.

### remote code

**Justification:** Remote code execution is not used in this extension. All code is bundled locally within the extension package.

### scripting

**Justification:** The scripting permission is used to inject content scripts into web pages to provide enhanced functionality and integration with the extension's features. This allows the extension to display UI elements and interact with page content when needed.

### sidePanel

**Justification:** The sidePanel permission enables the extension to display a persistent side panel in the browser, providing easy access to extension features like controller testing, command palette, and other tools while browsing.

### storage

**Justification:** Local storage is used to save user preferences, settings, and cached data to improve performance and maintain user customization across browser sessions. No sensitive personal data is stored.

### system.display

**Justification:** System display permission may be used to adapt the extension's UI based on the user's screen size and resolution, ensuring optimal display across different devices.

### tabs

**Justification:** Tabs permission is used to manage and interact with browser tabs, allowing users to switch between tabs, create new tabs, and access tab information through the extension's interface.

## Single Purpose Description

Paymore Lite is a browser extension that provides a command palette, controller testing interface, and productivity tools to enhance the browsing experience.

## Detailed Description

Paymore Lite is a comprehensive browser extension designed to improve productivity and browsing efficiency. It features a powerful command palette for quick access to bookmarks, history, and various tools. The extension includes a unique controller testing interface that allows users to test and visualize gamepad inputs in real-time. With its intuitive side panel interface, users can easily access all features without disrupting their browsing workflow. The extension is built with performance in mind and respects user privacy by minimizing data collection and processing most functionality locally.

## Data Usage Certification

I certify that this extension's data usage complies with the Chrome Web Store Developer Program Policies. The extension minimizes data collection, processes most functionality locally, and only requests permissions that are necessary for its core features. No sensitive personal information is collected or transmitted without explicit user consent.
