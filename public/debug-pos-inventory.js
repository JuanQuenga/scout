/**
 * Debug Script for POS Inventory Scanner
 * Run this in the browser console on pos.paymore.tech/inventory to test the scanner
 */

console.log("🔍 POS Inventory Scanner Debug Script Loaded");

// Function to check if the extension is working
function debugExtension() {
  console.log("=== POS Inventory Scanner Debug ===");

  // Check if content script is loaded
  if (window.POSContentScriptDebug) {
    console.log("✅ Content script is loaded");
    console.log(
      "Available debug functions:",
      Object.keys(window.POSContentScriptDebug)
    );
  } else {
    console.log("❌ Content script is NOT loaded");
  }

  // Check if scanner is loaded
  if (window.POSInventoryScanner) {
    console.log("✅ Scanner class is available");
  } else {
    console.log("❌ Scanner class is NOT available");
  }

  // Check if scanner instance exists
  if (window.POSInventoryScanner && window.POSInventoryScanner.prototype) {
    console.log("✅ Scanner prototype is available");
  } else {
    console.log("❌ Scanner prototype is NOT available");
  }

  // Check current page
  console.log("Current page:", {
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    fullUrl: window.location.href,
  });

  // Check if table exists
  const table = document.querySelector("table.table.table-row-bordered");
  if (table) {
    console.log("✅ Inventory table found");
    const rows = table.querySelectorAll("tbody tr");
    console.log(`Table has ${rows.length} rows`);
  } else {
    console.log("❌ Inventory table NOT found");
  }

  // Check for stats display
  const statsDisplay = document.getElementById("pos-inventory-stats");
  if (statsDisplay) {
    console.log("✅ Stats display is visible");
  } else {
    console.log("❌ Stats display is NOT visible");
  }
}

// Function to manually trigger scanner
function triggerScanner() {
  console.log("🚀 Manually triggering scanner...");

  if (
    window.POSContentScriptDebug &&
    window.POSContentScriptDebug.injectPOSScanner
  ) {
    window.POSContentScriptDebug.injectPOSScanner();
  } else {
    console.log("❌ Cannot trigger scanner - debug functions not available");
  }
}

// Function to create scanner manually
function createScanner() {
  console.log("🔧 Creating scanner manually...");

  if (window.POSInventoryScanner) {
    const scanner = new window.POSInventoryScanner();
    console.log("✅ Scanner created manually:", scanner);
    return scanner;
  } else {
    console.log("❌ Cannot create scanner - class not available");
    return null;
  }
}

// Function to check extension files
function checkExtensionFiles() {
  console.log("📁 Checking extension files...");

  // Try to access the scanner file
  const scannerUrl = chrome.runtime.getURL(
    "components/pos-inventory/pos-inventory.js"
  );
  console.log("Scanner file URL:", scannerUrl);

  // Check if chrome.runtime is available
  if (typeof chrome !== "undefined" && chrome.runtime) {
    console.log("✅ Chrome runtime is available");
  } else {
    console.log("❌ Chrome runtime is NOT available");
  }
}

// Function to simulate table data for testing
function simulateTableData() {
  console.log("🧪 Simulating table data...");

  const table = document.querySelector("table.table.table-row-bordered tbody");
  if (!table) {
    console.log("❌ No table found to add data to");
    return;
  }

  // Add a test row
  const testRow = document.createElement("tr");
  testRow.innerHTML = `
    <td class="cursor-pointer" data-bs-toggle="collapse" data-bs-target="#collapse-test">
      <i class="fa-solid fa-arrow-right"></i>
    </td>
    <td class="cursor-pointer">TEST-001</td>
    <td class="cursor-pointer">Test Customer</td>
    <td>1</td>
    <td class="fw-bold">$50 cash</td>
    <td>$100</td>
    <td>$50</td>
    <td>100 %</td>
    <td>TEST</td>
    <td>01-01-2025</td>
    <td>Test Employee</td>
    <td>1 Days</td>
  `;

  table.appendChild(testRow);
  console.log("✅ Test row added to table");
}

// Function to force reload extension
function reloadExtension() {
  console.log("🔄 Reloading extension...");

  if (
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    chrome.runtime.reload
  ) {
    chrome.runtime.reload();
    console.log("✅ Extension reload requested");
  } else {
    console.log("❌ Cannot reload extension - chrome.runtime not available");
  }
}

// Make functions available globally
window.POSDebug = {
  debugExtension,
  triggerScanner,
  createScanner,
  checkExtensionFiles,
  simulateTableData,
  reloadExtension,
};

console.log(
  "🔍 Debug functions available. Run POSDebug.debugExtension() to start debugging."
);
console.log("Available functions:", Object.keys(window.POSDebug));

// Auto-run debug check
setTimeout(debugExtension, 1000);
