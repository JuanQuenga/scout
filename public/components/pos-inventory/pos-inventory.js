/**
 * POS Inventory Scanner Component
 * Scans the pos.paymore.tech/inventory page table and displays overview stats
 */

class POSInventoryScanner {
  constructor() {
    console.log("[POS Scanner] Constructor called");

    this.stats = {
      totalOrders: 0,
      totalProducts: 0,
      totalPurchaseAmount: 0,
      totalEstimatedValue: 0,
      totalEstimatedMargin: 0,
      averageMarginPercentage: 0,
      rollsOffTomorrow: 0,
      leftToList: 0,
    };

    this.debugMode = true;
    this.initialized = false;
    this.completeDataset = []; // Store complete order + product data
    this.init();
  }

  log(message, data = null) {
    if (this.debugMode) {
      if (data) {
        console.log(`[POS Scanner] ${message}`, data);
      } else {
        console.log(`[POS Scanner] ${message}`);
      }
    }
  }

  init() {
    this.log("Initializing POS Inventory Scanner");

    // Wait for page to load and table to be present
    this.waitForTable();
  }

  waitForTable() {
    this.log("Waiting for table to appear in kt_app_main...");

    const checkTable = () => {
      // First check if kt_app_main exists
      const mainContainer = document.getElementById("kt_app_main");
      if (!mainContainer) {
        this.log("kt_app_main container not found yet, retrying in 1 second");
        setTimeout(checkTable, 1000);
        return;
      }

      // Then look for table within kt_app_main
      const table = mainContainer.querySelector(
        "table.table.table-row-bordered"
      );
      if (table) {
        this.log("Table found in kt_app_main, starting scan");
        this.initialized = true;
        this.scanTable();
      } else {
        this.log("Table not found in kt_app_main yet, retrying in 1 second");
        setTimeout(checkTable, 1000);
      }
    };

    checkTable();
  }

  scanTable() {
    try {
      this.log("Starting table scan");

      // Get all rows and parse them into orders with products
      const allRows = this.getAllTableRows();
      this.log(`Total rows found: ${allRows.length}`);

      if (allRows.length === 0) {
        this.log("No rows found, table might still be loading");
        setTimeout(() => this.scanTable(), 2000);
        return;
      }

      // Parse rows into orders with products
      this.parseOrdersAndProducts(allRows);

      // Calculate stats from complete dataset
      this.calculateStatsFromDataset();

      // Display stats
      this.displayStats();

      // Log complete dataset
      this.logCompleteDataset();

      this.log("Table scan completed", this.stats);
    } catch (error) {
      this.log("Error during table scan", error);
      console.error("[POS Scanner] Full error:", error);
    }
  }

  getAllTableRows() {
    // Get all TR elements from the table within kt_app_main
    const mainContainer = document.getElementById("kt_app_main");
    if (!mainContainer) {
      this.log("kt_app_main container not found");
      return [];
    }

    const table = mainContainer.querySelector("table.table.table-row-bordered");
    if (!table) {
      this.log("Table not found in kt_app_main");
      return [];
    }

    const allRows = table.querySelectorAll("tbody tr");
    this.log(`Total TR elements found in kt_app_main table: ${allRows.length}`);

    // Convert to array and filter out non-TR elements
    const validRows = Array.from(allRows).filter(row => row.tagName === "TR");
    this.log(`Valid TR rows: ${validRows.length}`);

    // Log detailed structure of first few rows for debugging
    validRows.slice(0, 5).forEach((row, index) => {
      const cells = row.querySelectorAll("td");
      const hasId = row.hasAttribute("id");
      const hasColspan = row.hasAttribute("colspan");
      const colspanValue = row.getAttribute("colspan");
      const hasCollapse = row.classList.contains("collapse");
      const hasSubTable = !!row.querySelector("table.table.table-row-bordered");

      this.log(`Row ${index} structure:`, {
        cellCount: cells.length,
        hasId,
        id: row.getAttribute("id") || "none",
        hasColspan,
        colspanValue,
        hasCollapse,
        hasSubTable,
        classes: row.className,
        firstCellText: cells[0]
          ? this.getCellText(cells[0]).substring(0, 50)
          : "N/A",
        secondCellText: cells[1]
          ? this.getCellText(cells[1]).substring(0, 50)
          : "N/A",
      });
    });

    return validRows;
  }

  parseOrdersAndProducts(allRows) {
    this.log("Starting to parse orders and products...");
    this.completeDataset = [];

    let currentOrder = null;

    allRows.forEach((row, index) => {
      const cells = row.querySelectorAll("td");
      const hasId = row.hasAttribute("id");
      const hasColspan = row.hasAttribute("colspan");
      const colspanValue = row.getAttribute("colspan");
      const hasCollapse = row.classList.contains("collapse");
      const hasSubTable = !!row.querySelector("table.table.table-row-bordered");

      this.log(`Processing row ${index}:`, {
        tagName: row.tagName,
        className: row.className,
        hasId,
        id: row.getAttribute("id") || "none",
        hasColspan,
        colspanValue,
        cellCount: cells.length,
        hasSubTable,
        isCollapse: hasCollapse,
        firstCellText: cells[0]
          ? this.getCellText(cells[0]).substring(0, 30)
          : "N/A",
        secondCellText: cells[1]
          ? this.getCellText(cells[1]).substring(0, 30)
          : "N/A",
      });

      // Check if this is an order row
      if (this.isOrderRow(row)) {
        // If we have a previous order, save it
        if (currentOrder) {
          this.saveOrderWithProducts(currentOrder, []);
        }

        // Start new order
        currentOrder = this.parseOrderRow(row, index);
        this.log(
          `New order started: ${currentOrder.orderNumber}`,
          currentOrder
        );
      } else {
        this.log(`Row ${index} - neither order nor product, skipping`);
      }
    });

    // Don't forget the last order
    if (currentOrder) {
      this.saveOrderWithProducts(currentOrder, []);
    }

    this.log(`Parsing complete. Total orders: ${this.completeDataset.length}`);
  }

  isOrderRow(row) {
    const cells = row.querySelectorAll("td");

    // Order rows have at least 12 cells, no colspan, no id attribute, and order number in second cell
    const hasEnoughCells = cells.length >= 12;
    const noColspan = !row.hasAttribute("colspan");
    const noId = !row.hasAttribute("id");
    const hasOrderNumber = cells[1] && this.getCellText(cells[1]).trim() !== "";
    const orderNumberPattern = /^[A-Z]{2}\d{2}-\d{4}$/; // Pattern like MI01-5210
    const matchesOrderPattern = orderNumberPattern.test(
      this.getCellText(cells[1])
    );

    const isOrder =
      hasEnoughCells &&
      noColspan &&
      noId &&
      hasOrderNumber &&
      matchesOrderPattern;

    this.log(`Row order check:`, {
      hasEnoughCells,
      noColspan,
      noId,
      hasOrderNumber,
      matchesOrderPattern,
      isOrder,
      cellCount: cells.length,
      secondCellText: cells[1] ? this.getCellText(cells[1]) : "N/A",
      rowId: row.getAttribute("id") || "none",
    });

    return isOrder;
  }

  parseOrderRow(row, index) {
    try {
      const cells = row.querySelectorAll("td");

      if (cells.length < 12) {
        this.log(`Order row ${index} has insufficient cells: ${cells.length}`);
        return null;
      }

      const orderData = {
        rowIndex: index,
        orderNumber: this.getCellText(cells[1]),
        customer: this.getCellText(cells[2]),
        productCount: this.parseNumber(this.getCellText(cells[3])),
        purchaseAmount: this.parseCurrency(this.getCellText(cells[4])),
        estimatedValue: this.parseCurrency(this.getCellText(cells[5])),
        estimatedMargin: this.parseCurrency(this.getCellText(cells[6])),
        marginPercentage: this.parsePercentage(this.getCellText(cells[7])),
        location: this.getCellText(cells[8]),
        purchaseDate: this.getCellText(cells[9]),
        parsedPurchaseDate: this.parseDate(this.getCellText(cells[9])),
        employeeName: this.getCellText(cells[10]),
        daysInQueue: this.parseDays(this.getCellText(cells[11])),
      };

      this.log(`Order row ${index} parsed:`, orderData);
      return orderData;
    } catch (error) {
      this.log(`Error parsing order row ${index}:`, error);
      return null;
    }
  }

  parseProductContainerRow(row, index) {
    try {
      // Find the sub-table within this product container row
      const subTable = row.querySelector("table.table.table-row-bordered");
      if (!subTable) {
        this.log(`Product container row ${index} has no sub-table`);
        return null;
      }

      // Get all product rows from the sub-table tbody
      const productRows = subTable.querySelectorAll("tbody tr");
      this.log(
        `Product container row ${index} contains ${productRows.length} products`
      );

      const products = [];

      productRows.forEach((productRow, productIndex) => {
        if (productRow.tagName !== "TR") return;

        const productCells = productRow.querySelectorAll("td");
        this.log(
          `Product row ${productIndex} has ${productCells.length} cells`
        );

        // Check if we have enough cells for a product
        if (productCells.length < 8) {
          this.log(
            `Product row ${productIndex} skipped - insufficient cells (${productCells.length})`
          );
          return;
        }

        // Extract product data based on the actual table structure
        const product = {
          productIndex,
          artNumber: this.getCellText(productCells[0]),
          make: this.getCellText(productCells[1]),
          model: this.getCellText(productCells[2]),
          condition: this.getCellText(productCells[3]),
          attributes: this.getCellText(productCells[4]),
          serial: this.getCellText(productCells[5]),
          location: this.getCellText(productCells[6]),
          estPrice: this.parseCurrency(this.getCellText(productCells[7])),
          offerPrice: this.parseCurrency(this.getCellText(productCells[8])),
          staffNotes: productCells[9] ? this.getCellText(productCells[9]) : "",
          hold: productCells[10] ? this.getCellText(productCells[10]) : "",
        };

        // Log the raw cell data for debugging
        this.log(`Product ${productIndex + 1} raw cells:`, {
          artNumber: this.getCellText(productCells[0]),
          make: this.getCellText(productCells[1]),
          model: this.getCellText(productCells[2]),
          condition: this.getCellText(productCells[3]),
          attributes: this.getCellText(productCells[4]),
          serial: this.getCellText(productCells[5]),
          location: this.getCellText(productCells[6]),
          estPrice: this.getCellText(productCells[7]),
          offerPrice: this.getCellText(productCells[8]),
          staffNotes: this.getCellText(productCells[9]),
          osNotes: this.getCellText(productCells[10]),
          hold: this.getCellText(productCells[11]),
        });

        products.push(product);
        this.log(`Product ${productIndex + 1} parsed successfully:`, product);
      });

      return {
        rowIndex: index,
        productCount: products.length,
        products: products,
      };
    } catch (error) {
      this.log(`Error parsing product container row ${index}:`, error);
      console.error(`Full error for product container row ${index}:`, error);
      return null;
    }
  }

  saveOrderWithProducts(order, products) {
    if (!order) return;

    const orderWithProducts = {
      ...order,
      products: products,
      actualProductCount: order.productCount || 0,
      totalProductValue: order.estimatedValue || 0,
      totalProductOfferPrice: order.estimatedValue || 0,
    };

    this.completeDataset.push(orderWithProducts);

    this.log(
      `Order ${order.orderNumber} saved with ${order.productCount || 0} products:`,
      orderWithProducts
    );
  }

  calculateStatsFromDataset() {
    this.log("Calculating stats from complete dataset...");

    // Reset stats
    this.resetStats();

    this.completeDataset.forEach((orderData, index) => {
      this.log(`Processing order ${index + 1}: ${orderData.orderNumber}`);

      // Basic counts
      this.stats.totalOrders++;
      this.stats.totalProducts +=
        orderData.actualProductCount || orderData.productCount;

      // Financial totals
      this.stats.totalPurchaseAmount += orderData.purchaseAmount;
      this.stats.totalEstimatedValue +=
        orderData.totalProductValue || orderData.estimatedValue;
      this.stats.totalEstimatedMargin += orderData.estimatedMargin;

      // Check if order rolls off tomorrow (exactly 2 days old)
      if (orderData.parsedPurchaseDate) {
        const daysSincePurchase = this.getDaysSincePurchase(
          orderData.parsedPurchaseDate
        );
        if (daysSincePurchase === 2) {
          // Count the products from this order, not the order itself
          const productCount =
            orderData.actualProductCount || orderData.productCount || 0;
          this.stats.rollsOffTomorrow += productCount;
          this.log(
            `Order ${orderData.orderNumber} rolls off tomorrow (exactly 2 days old) - Purchase date: ${orderData.purchaseDate} - Products rolling off: ${productCount}`
          );
        }

        // Check if order has been in queue for 3 days or more (Left To List)
        if (daysSincePurchase >= 3) {
          const productCount =
            orderData.actualProductCount || orderData.productCount || 0;
          this.stats.leftToList += productCount;
          this.log(
            `Order ${orderData.orderNumber} has been in queue for ${daysSincePurchase} days - Products left to list: ${productCount}`
          );
        }
      }
    });

    // Calculate averages
    if (this.stats.totalEstimatedValue > 0) {
      this.stats.averageMarginPercentage =
        (this.stats.totalEstimatedMargin / this.stats.totalEstimatedValue) *
        100;
    }

    this.log("Stats calculated:", this.stats);
    this.log(`Products rolling off tomorrow: ${this.stats.rollsOffTomorrow}`);
  }

  logCompleteDataset() {
    console.group("📊 Complete POS Inventory Dataset");
    console.log(`Total Orders: ${this.completeDataset.length}`);
    console.log(`Total Products: ${this.stats.totalProducts}`);
    console.log("Dataset:", this.completeDataset);

    // Log summary for each order
    this.completeDataset.forEach((order, index) => {
      console.group(`Order ${index + 1}: ${order.orderNumber}`);
      console.log("Order Details:", {
        customer: order.customer,
        purchaseAmount: `$${order.purchaseAmount}`,
        estimatedValue: `$${order.estimatedValue}`,
        estimatedMargin: `$${order.estimatedMargin}`,
        marginPercentage: `${order.marginPercentage}%`,
        location: order.location,
        employee: order.employeeName,
        daysInQueue: order.daysInQueue,
      });

      if (order.products && order.products.length > 0) {
        console.log(`Products (${order.products.length}):`, order.products);
      } else {
        console.log("No products found for this order");
      }
      console.groupEnd();
    });

    console.groupEnd();
  }

  getCellText(cell) {
    return cell ? cell.textContent.trim() : "";
  }

  parseNumber(text) {
    const num = parseInt(text);
    return isNaN(num) ? 0 : num;
  }

  parseCurrency(text) {
    // Remove currency symbols and parse
    const cleanText = text.replace(/[$,]/g, "").trim();
    const num = parseFloat(cleanText);
    return isNaN(num) ? 0 : num;
  }

  parsePercentage(text) {
    // Remove % symbol and parse
    const cleanText = text.replace(/%/g, "").trim();
    const num = parseFloat(cleanText);
    return isNaN(num) ? 0 : num;
  }

  parseDays(text) {
    // Extract number from "X Days" format
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  parseDate(dateText) {
    // Parse date in format "08-19-2025" (MM-DD-YYYY)
    if (!dateText || typeof dateText !== "string") return null;

    const parts = dateText.split("-");
    if (parts.length !== 3) return null;

    const month = parseInt(parts[0]) - 1; // Month is 0-indexed in Date constructor
    const day = parseInt(parts[1]);
    const year = parseInt(parts[2]);

    if (isNaN(month) || isNaN(day) || isNaN(year)) return null;

    return new Date(year, month, day);
  }

  getDaysSincePurchase(purchaseDate) {
    if (!purchaseDate) return 0;

    const today = new Date();
    const purchase = new Date(purchaseDate);

    // Reset time to midnight for accurate day calculation
    today.setHours(0, 0, 0, 0);
    purchase.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - purchase.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  resetStats() {
    this.stats = {
      totalOrders: 0,
      totalProducts: 0,
      totalPurchaseAmount: 0,
      totalEstimatedValue: 0,
      totalEstimatedMargin: 0,
      averageMarginPercentage: 0,
      rollsOffTomorrow: 0,
      leftToList: 0,
    };
  }

  displayStats() {
    // Remove existing stats display if present
    this.removeExistingDisplay();

    // Create stats display
    const statsContainer = this.createStatsDisplay();

    // Insert into the kt_app_content_container
    this.insertStatsDisplay(statsContainer);

    this.log("Stats display created and inserted");
  }

  createStatsDisplay() {
    const container = document.createElement("div");
    container.id = "pos-inventory-stats";
    container.style.cssText = `
      display: flex;
      gap: 0;
      margin-bottom: 20px;
      align-items: center;
      justify-content: flex-start;
    `;

    // Create stat cards
    const cards = [
      {
        title: "Total Orders",
        value: this.stats.totalOrders,
        icon: "📋",
        color: "#8436D1",
      },

      {
        title: "Total Products",
        value: this.stats.totalProducts,
        icon: "📦",
        color: "#3699D1",
      },
      {
        title: "Rolls Off Tomorrow",
        value: this.stats.rollsOffTomorrow,
        icon: "⏰",
        color: "#ef4444",
      },
      {
        title: "Ready To List",
        value: this.stats.leftToList,
        icon: "✅",
        color: "#10b981",
      },
    ];

    cards.forEach(card => {
      const cardElement = this.createStatCard(card);
      container.appendChild(cardElement);
    });

    // Add refresh button as the last stat card
    const refreshCard = this.createRefreshCard();
    container.appendChild(refreshCard);

    return container;
  }

  createStatCard(card) {
    const cardElement = document.createElement("div");
    cardElement.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 10px;
      border: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 160px;
      backdrop-filter: blur(10px);
      position: relative;
      overflow: hidden;
      margin-right: 10px;
    `;

    // Add subtle gradient overlay
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
      pointer-events: none;
    `;
    cardElement.appendChild(overlay);

    cardElement.onmouseenter = () => {
      cardElement.style.transform = "translateY(-4px) scale(1.02)";
      cardElement.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.15)";
    };

    cardElement.onmouseleave = () => {
      cardElement.style.transform = "translateY(0) scale(1)";
      cardElement.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.08)";
    };

    const icon = document.createElement("div");
    icon.textContent = card.icon;
    icon.style.cssText = `
      font-size: 24px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
      z-index: 1;
      position: relative;
    `;

    const content = document.createElement("div");
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      z-index: 1;
      position: relative;
    `;

    const title = document.createElement("div");
    title.textContent = card.title;
    title.style.cssText = `
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
      line-height: 1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    `;

    const value = document.createElement("div");
    value.textContent = card.value;
    value.style.cssText = `
      font-size: 20px;
      font-weight: 700;
      color: ${card.color};
      line-height: 1.2;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    `;

    content.appendChild(title);
    content.appendChild(value);
    cardElement.appendChild(icon);
    cardElement.appendChild(content);

    return cardElement;
  }

  insertStatsDisplay(container) {
    // Find the kt_app_content_container
    const targetContainer = document.getElementById("kt_app_content_container");

    if (targetContainer) {
      // Insert at the top of the container
      targetContainer.insertBefore(container, targetContainer.firstChild);
      this.log("Stats display inserted into kt_app_content_container");
    } else {
      // Fallback: insert into body if container not found
      document.body.appendChild(container);
      this.log(
        "kt_app_content_container not found, inserted into body as fallback"
      );
    }
  }

  removeExistingDisplay() {
    const existing = document.getElementById("pos-inventory-stats");
    if (existing) {
      existing.remove();
    }
  }

  // Public method to manually refresh stats
  refresh() {
    this.log("Manual refresh requested");
    this.scanTable();
  }

  // Public method to toggle debug mode
  toggleDebug() {
    this.debugMode = !this.debugMode;
    this.log(`Debug mode ${this.debugMode ? "enabled" : "disabled"}`);
  }

  // Public method to get complete dataset
  getDataset() {
    return this.completeDataset;
  }

  // Create refresh button as a stat card
  createRefreshCard() {
    const refreshCard = document.createElement("div");
    refreshCard.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 10px;
      border: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      width: 60px;
      height: 60px;
      backdrop-filter: blur(10px);
      position: relative;
      overflow: hidden;
      cursor: pointer;
    `;

    // Add subtle gradient overlay
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
      pointer-events: none;
    `;
    refreshCard.appendChild(overlay);

    refreshCard.onmouseenter = () => {
      refreshCard.style.transform = "translateY(-4px) scale(1.02)";
      refreshCard.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.15)";
    };

    refreshCard.onmouseleave = () => {
      refreshCard.style.transform = "translateY(0) scale(1)";
      refreshCard.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.08)";
    };

    refreshCard.onclick = () => {
      this.log("Manual refresh requested");
      this.scanTable();
    };

    const icon = document.createElement("div");
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-ccw-icon lucide-refresh-ccw"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>`;
    icon.style.cssText = `
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
      z-index: 1;
      position: relative;
      color: #6366f1;
    `;

    refreshCard.appendChild(icon);

    return refreshCard;
  }

  // Check if we're on the POS inventory page
  isOnInventoryPage() {
    return window.location.href.includes("pos.paymore.tech/inventory");
  }
}

// Auto-initialize when DOM is ready
let scannerInstance = null;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    console.log(
      "[POS Scanner] DOMContentLoaded fired, creating scanner instance"
    );
    scannerInstance = new POSInventoryScanner();
  });
} else {
  console.log("[POS Scanner] DOM already ready, creating scanner instance");
  scannerInstance = new POSInventoryScanner();
}

// Make scanner available globally for debugging
window.POSInventoryScanner = POSInventoryScanner;

console.log(
  "[POS Scanner] Script loaded and POSInventoryScanner class defined"
);
