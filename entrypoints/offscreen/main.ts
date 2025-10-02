/* global chrome */

// Offscreen: semantic engine removed. Minimal placeholder listener kept to
// avoid breaking code that may send messages to the offscreen target.

console.log("Offscreen: semantic engine removed");

chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
  sendResponse({ success: false, error: "similarity_engine_removed" });
  return true;
});

console.log("Offscreen placeholder loaded");


