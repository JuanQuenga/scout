import * as React from "react";
import { TOOLBAR_TOOLS } from "../../lib/tools";

function getIconElement(tool: any) {
  try {
    if (tool.reactIcon) {
      const Icon = tool.reactIcon;
      return <Icon size={20} className="pm-icon" />;
    }
    if (tool.img) {
      const src = (() => {
        try {
          return (window as any).chrome?.runtime?.getURL
            ? (window as any).chrome.runtime.getURL(
                String(tool.img).replace(/^\//, "")
              )
            : String(tool.img).replace(/^\//, "");
        } catch (_) {
          return String(tool.img).replace(/^\//, "");
        }
      })();
      return <img className="pm-icon" src={src} alt={tool.label} />;
    }
    if (tool.svg) {
      return (
        <span
          className="pm-icon"
          dangerouslySetInnerHTML={{ __html: String(tool.svg) }}
        />
      );
    }
  } catch (_) {}
  return null;
}

export default function Toolbar() {
  return (
    <div id="paymore-toolbar" aria-hidden="true">
      <style
        dangerouslySetInnerHTML={{
          __html: `
  /* Toolbar CSS (inlined) */
  #paymore-toolbar { position: fixed; right: -100px; top: 50%; transform: translateY(-50%); z-index: 2147483646; opacity: 1; visibility: visible; transition: right 0.3s ease, opacity 0.3s ease, visibility 0.3s ease; }
  #paymore-toolbar.visible { opacity: 1; visibility: visible; right: 9px; }
  #paymore-toolbar.hidden { opacity: 0; visibility: hidden; right: -100px; }
  .pm-tb { display: flex; flex-direction: column; gap: 6px; padding: 6px; background: #1c1917; border: 1px solid #44403c; border-radius: 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.45); user-select: none; }
  .pm-tb-close { width: 40px; height: 28px; display: grid; place-items: center; border-radius: 8px; background: #292524; border: 1px solid #57534e; color: #e7e5e4; cursor: pointer; position: relative; margin-bottom: 2px; transition: all 0.2s ease; }
  .pm-tb-divider { width: 100%; height: 1px; background: #44403c; margin: 0 0 2px 0; border-radius: 0.5px; }
  .pm-tb-item { position: relative; }
  .pm-tb-btn { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 10px; background: #292524; border: 1px solid #57534e; color: #e7e5e4; cursor: pointer; position: relative; transition: all 0.2s ease; }
  .pm-tip { position: absolute; right: 110%; top: 50%; transform: translateY(-50%); background: #1c1917; border: 1px solid #44403c; color: #f5f5f4; padding: 6px 8px; border-radius: 8px; font-size: 12px; box-shadow: 0 6px 18px rgba(0,0,0,0.35); white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.15s ease, transform 0.15s ease; }
  .pm-tb-item:hover .pm-tip { opacity: 1; transform: translateY(-50%) translateX(-2px); }
  .pm-icon { width: 22px; height: 22px; display: block; object-fit: contain; object-position: center; margin: 0 auto; }
        `,
        }}
      />

      <div className="pm-tb" role="toolbar">
        <div className="pm-tb-item">
          <button
            className="pm-tb-close"
            id="pm-tb-close"
            aria-label="Dismiss Toolbar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
          <div className="pm-tip">Dismiss Toolbar</div>
        </div>

        <div className="pm-tb-divider" />

        {TOOLBAR_TOOLS.map((tool) => (
          <div className="pm-tb-item" key={tool.id} style={{ display: "" }}>
            <button
              className="pm-tb-btn"
              id={tool.buttonId}
              aria-label={tool.label}
            >
              {getIconElement(tool)}
            </button>
            <div className="pm-tip">{tool.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
