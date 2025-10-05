/* global chrome */

// Type declaration for Chrome extension APIs
declare const chrome: any;

// Offscreen: gamepad detection and semantic engine placeholder
// This document is used for reliable gamepad detection in the background

console.log("Offscreen: gamepad detection enabled");

// Track gamepad connection state
let lastGamepadCount = 0;

// Check for connected gamepads
function checkGamepads() {
  const gamepads = navigator.getGamepads?.() || [];
  let connectedCount = 0;
  let controllerInfo = null;

  for (let i = 0; i < gamepads.length; i++) {
    if (gamepads[i]) {
      connectedCount++;
      if (!controllerInfo) {
        controllerInfo = {
          index: i,
          id: gamepads[i]!.id,
          mapping: gamepads[i]!.mapping,
        };
      }
    }
  }

  return {
    connectedCount,
    controllerInfo,
  };
}

// Listen for gamepad connection events
window.addEventListener("gamepadconnected", (event) => {
  console.log("Gamepad connected:", event.gamepad.id);
  // Notify background script
  try {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({
        action: "gamepadConnected",
        gamepad: {
          index: event.gamepad.index,
          id: event.gamepad.id,
          mapping: event.gamepad.mapping,
        },
      });
    }
  } catch (e) {
    console.error("Failed to send gamepad connected message:", e);
  }
});

window.addEventListener("gamepaddisconnected", (event) => {
  console.log("Gamepad disconnected:", event.gamepad.id);
  // Notify background script
  try {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({
        action: "gamepadDisconnected",
        gamepad: {
          index: event.gamepad.index,
          id: event.gamepad.id,
        },
      });
    }
  } catch (e) {
    console.error("Failed to send gamepad disconnected message:", e);
  }
});

// Handle messages from background script
if (typeof chrome !== "undefined" && chrome.runtime) {
  chrome.runtime.onMessage.addListener(
    (message: any, _sender: any, sendResponse: any) => {
      if (message.action === "checkGamepads") {
        const result = checkGamepads();
        sendResponse({ success: true, data: result });
        return true;
      }

      // Fallback for other messages
      sendResponse({ success: false, error: "unknown_action" });
      return true;
    }
  );
}

console.log("Offscreen gamepad detection loaded");
