/**
 * EPIMS — ElegantPedi Inventory & Supplier Management System
 * Google Apps Script backend.
 *
 * Deploy: Extensions > Apps Script (from the Google Sheet) > paste this file as Code.gs,
 * then Deploy > New deployment > type "Web app":
 *   - Execute as: Me
 *   - Who has access: Anyone with the link (or "Anyone within [org]" if using Workspace)
 * Copy the resulting /exec URL into the React app's .env as VITE_EPIMS_API_URL.
 *
 * Expected sheet tabs (create these once, headers in row 1):
 *   Inventory        | Product ID, Colour, Design, Size, Quantity Available, Reserved Quantity,
 *                       Minimum Stock, Cost Price, Selling Price, Last Updated
 *   Supplier Orders  | Order Number, Supplier, Date, Colour, Design, Size, Quantity, Status, Notes
 *   Packaging        | Packaging Type, Quantity, Minimum Quantity, Supplier
 *   Payments         | Customer, Order Number, Amount, Paid, Outstanding, Date, Status
 *   Settings         | Key, Value   (single JSON blob stored under key "settings")
 *   Inventory History| ID, Product ID, Change, Reason, Date, User
 *   Notifications    | ID, Type, Message, Date, Sent
 */

const SHEET_NAMES = {
  INVENTORY: 'Inventory',
  SUPPLIER_ORDERS: 'Supplier Orders',
  PACKAGING: 'Packaging',
  PAYMENTS: 'Payments',
  SETTINGS: 'Settings',
  HISTORY: 'Inventory History',
  NOTIFICATIONS: 'Notifications'
};

function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error(`Sheet "${name}" not found. Create it with the expected headers.`);
  return sheet;
}

function sheetToObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map((h) => String(h).trim());
  return values.slice(1).filter((row) => row.some((c) => c !== '')).map((row) => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = row[i]));
    return obj;
  });
}

function toInventoryItem_(o) {
  return {
    productId: o['Product ID'],
    colour: o['Colour'],
    design: o['Design'],
    size: o['Size'],
    quantityAvailable: Number(o['Quantity Available']) || 0,
    reservedQuantity: Number(o['Reserved Quantity']) || 0,
    minimumStock: Number(o['Minimum Stock']) || 0,
    costPrice: Number(o['Cost Price']) || 0,
    sellingPrice: Number(o['Selling Price']) || 0,
    lastUpdated: o['Last Updated'] instanceof Date ? o['Last Updated'].toISOString() : String(o['Last Updated'] || '')
  };
}

function getAllData_() {
  const inventory = sheetToObjects_(getSheet_(SHEET_NAMES.INVENTORY)).map(toInventoryItem_);

  const supplierOrders = sheetToObjects_(getSheet_(SHEET_NAMES.SUPPLIER_ORDERS)).map((o) => ({
    orderNumber: o['Order Number'], supplier: o['Supplier'],
    date: o['Date'] instanceof Date ? o['Date'].toISOString() : String(o['Date'] || ''),
    colour: o['Colour'], design: o['Design'], size: o['Size'],
    quantity: Number(o['Quantity']) || 0, status: o['Status'], notes: o['Notes'] || ''
  }));

  const packaging = sheetToObjects_(getSheet_(SHEET_NAMES.PACKAGING)).map((o) => ({
    packagingType: o['Packaging Type'], quantity: Number(o['Quantity']) || 0,
    minimumQuantity: Number(o['Minimum Quantity']) || 0, supplier: o['Supplier']
  }));

  const payments = sheetToObjects_(getSheet_(SHEET_NAMES.PAYMENTS)).map((o) => ({
    customer: o['Customer'], orderNumber: o['Order Number'],
    amount: Number(o['Amount']) || 0, paid: Number(o['Paid']) || 0, outstanding: Number(o['Outstanding']) || 0,
    date: o['Date'] instanceof Date ? o['Date'].toISOString() : String(o['Date'] || ''), status: o['Status']
  }));

  const history = sheetToObjects_(getSheet_(SHEET_NAMES.HISTORY)).map((o) => ({
    id: o['ID'], productId: o['Product ID'], change: Number(o['Change']) || 0, reason: o['Reason'],
    date: o['Date'] instanceof Date ? o['Date'].toISOString() : String(o['Date'] || ''), user: o['User']
  })).reverse();

  const notifications = sheetToObjects_(getSheet_(SHEET_NAMES.NOTIFICATIONS)).map((o) => ({
    id: o['ID'], type: o['Type'], message: o['Message'],
    date: o['Date'] instanceof Date ? o['Date'].toISOString() : String(o['Date'] || ''), sent: !!o['Sent']
  })).reverse();

  const settings = getSettings_();

  return { inventory, supplierOrders, packaging, payments, settings, history, notifications };
}

function getSettings_() {
  const sheet = getSheet_(SHEET_NAMES.SETTINGS);
  const values = sheet.getDataRange().getValues();
  const row = values.find((r) => r[0] === 'settings');
  if (row && row[1]) {
    try { return JSON.parse(row[1]); } catch (e) { /* fall through */ }
  }
  return {
    businessName: 'ElegantPedi', suppliers: [], defaultMinimumStock: 5, whatsappNumbers: [],
    notificationPreferences: { lowStock: true, packagingAlert: true, supplierOrderAlert: true, dailySummary: true, weeklyReport: true }
  };
}

function saveSettings_(settings) {
  const sheet = getSheet_(SHEET_NAMES.SETTINGS);
  const values = sheet.getDataRange().getValues();
  const rowIndex = values.findIndex((r) => r[0] === 'settings');
  const json = JSON.stringify(settings);
  if (rowIndex >= 0) sheet.getRange(rowIndex + 1, 2).setValue(json);
  else sheet.appendRow(['settings', json]);
  return settings;
}

function findRowByValue_(sheet, columnHeader, value) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map((h) => String(h).trim());
  const colIndex = headers.indexOf(columnHeader);
  if (colIndex === -1) return -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][colIndex] === value) return i + 1; // 1-indexed sheet row
  }
  return -1;
}

function upsertInventoryItem_(item, reason) {
  const sheet = getSheet_(SHEET_NAMES.INVENTORY);
  const rowNum = findRowByValue_(sheet, 'Product ID', item.productId);
  const now = new Date();
  const row = [
    item.productId, item.colour, item.design, item.size, item.quantityAvailable,
    item.reservedQuantity, item.minimumStock, item.costPrice, item.sellingPrice, now
  ];
  let prevQty = 0;
  if (rowNum > 0) {
    const existing = sheet.getRange(rowNum, 1, 1, 10).getValues()[0];
    prevQty = Number(existing[4]) || 0;
    sheet.getRange(rowNum, 1, 1, 10).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  appendHistory_(item.productId, item.quantityAvailable - prevQty, reason || 'Updated via app');
  maybeSendLowStockAlert_(item);
  return item;
}

function appendHistory_(productId, change, reason) {
  if (change === 0) return;
  const sheet = getSheet_(SHEET_NAMES.HISTORY);
  sheet.appendRow([`H-${Date.now()}`, productId, change, reason, new Date(), Session.getActiveUser().getEmail() || 'Administrator']);
}

function saveSupplierOrder_(lines) {
  const sheet = getSheet_(SHEET_NAMES.SUPPLIER_ORDERS);
  lines.forEach((l) => sheet.appendRow([l.orderNumber, l.supplier, new Date(l.date), l.colour, l.design, l.size, l.quantity, l.status, l.notes || '']));
  const summary = lines.map((l) => `${l.colour} ${l.design} ${l.size} – ${l.quantity}`).join('\n');
  logNotification_('Supplier Order', `Supplier Order Required\n${summary}`);
  return lines;
}

function updateSupplierOrderStatus_(orderNumber, status) {
  const sheet = getSheet_(SHEET_NAMES.SUPPLIER_ORDERS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map((h) => String(h).trim());
  const orderCol = headers.indexOf('Order Number');
  const statusCol = headers.indexOf('Status');
  for (let i = 1; i < values.length; i++) {
    if (values[i][orderCol] === orderNumber) sheet.getRange(i + 1, statusCol + 1).setValue(status);
  }
}

function upsertPackaging_(item) {
  const sheet = getSheet_(SHEET_NAMES.PACKAGING);
  const rowNum = findRowByValue_(sheet, 'Packaging Type', item.packagingType);
  const row = [item.packagingType, item.quantity, item.minimumQuantity, item.supplier];
  if (rowNum > 0) sheet.getRange(rowNum, 1, 1, 4).setValues([row]);
  else sheet.appendRow(row);
  if (item.quantity < item.minimumQuantity) {
    logNotification_('Packaging Alert', `Packaging is running low.\n${item.packagingType}\nRemaining: ${item.quantity}`);
  }
  return item;
}

function upsertPayment_(payment) {
  const sheet = getSheet_(SHEET_NAMES.PAYMENTS);
  const rowNum = findRowByValue_(sheet, 'Order Number', payment.orderNumber);
  const row = [payment.customer, payment.orderNumber, payment.amount, payment.paid, payment.outstanding, new Date(payment.date), payment.status];
  if (rowNum > 0) sheet.getRange(rowNum, 1, 1, 7).setValues([row]);
  else sheet.appendRow(row);
  return payment;
}

function logNotification_(type, message) {
  const sheet = getSheet_(SHEET_NAMES.NOTIFICATIONS);
  const id = `N-${Date.now()}`;
  sheet.appendRow([id, type, message, new Date(), false]);
  const sent = sendWhatsApp_(message);
  if (sent) {
    const rowNum = findRowByValue_(sheet, 'ID', id);
    if (rowNum > 0) sheet.getRange(rowNum, 5).setValue(true);
  }
  return { id, type, message, sent };
}

function maybeSendLowStockAlert_(item) {
  if (item.quantityAvailable < item.minimumStock) {
    logNotification_('Low Stock', `🚨 Low Stock Alert\n${item.colour}\n${item.size}\n${item.design}\nRemaining: ${item.quantityAvailable}\nMinimum: ${item.minimumStock}`);
  }
}

/**
 * Sends a WhatsApp message via the WhatsApp Business Cloud API.
 * Set WHATSAPP_TOKEN and WHATSAPP_PHONE_ID in Script Properties
 * (Project Settings > Script properties) before this will actually send.
 * Returns true if the message was dispatched, false otherwise (e.g. not configured).
 */
function sendWhatsApp_(message) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('WHATSAPP_TOKEN');
  const phoneId = props.getProperty('WHATSAPP_PHONE_ID');
  if (!token || !phoneId) return false; // Not configured yet — message is still logged in the sheet.

  const settings = getSettings_();
  const numbers = settings.whatsappNumbers || [];
  numbers.forEach((to) => {
    try {
      UrlFetchApp.fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
        method: 'post',
        contentType: 'application/json',
        headers: { Authorization: `Bearer ${token}` },
        payload: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message }
        }),
        muteHttpExceptions: true
      });
    } catch (e) {
      console.error('WhatsApp send failed:', e);
    }
  });
  return true;
}

/** Time-driven trigger target: run daily (e.g. 18:00) via Triggers > Add Trigger. */
function sendDailySummary() {
  const data = getAllData_();
  if (!data.settings.notificationPreferences.dailySummary) return;
  const totalShirts = data.inventory.reduce((s, i) => s + i.quantityAvailable, 0);
  const lowStock = data.inventory.filter((i) => i.quantityAvailable < i.minimumStock).length;
  const outstanding = data.payments.reduce((s, p) => s + p.outstanding, 0);
  const lowPackaging = data.packaging.filter((p) => p.quantity < p.minimumQuantity).map((p) => p.packagingType).join(', ') || 'none';
  logNotification_('Daily Summary',
    `📊 Daily Summary\nTotal shirts: ${totalShirts}\nLow stock lines: ${lowStock}\nPackaging low: ${lowPackaging}\nOutstanding payments: R${outstanding}`);
}

/** Time-driven trigger target: run weekly, Mondays. */
function sendWeeklyReport() {
  const data = getAllData_();
  if (!data.settings.notificationPreferences.weeklyReport) return;
  const value = data.inventory.reduce((s, i) => s + i.quantityAvailable * i.costPrice, 0);
  const pendingOrders = new Set(data.supplierOrders.filter((o) => o.status === 'Pending' || o.status === 'Ordered').map((o) => o.orderNumber)).size;
  logNotification_('Weekly Report',
    `📅 Weekly Report\nInventory value: R${value}\nSupplier orders pending: ${pendingOrders}\nPackaging items: ${data.packaging.length}`);
}

/** Web app entry point — handles all read/write actions from the React frontend. */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { action, payload } = body;
    let data;
    switch (action) {
      case 'getAllData':
        data = getAllData_(); break;
      case 'updateInventoryItem':
        data = upsertInventoryItem_(payload.item, payload.reason); break;
      case 'saveSupplierOrder':
        data = saveSupplierOrder_(payload.lines); break;
      case 'updateSupplierOrderStatus':
        updateSupplierOrderStatus_(payload.orderNumber, payload.status); data = {}; break;
      case 'updatePackaging':
        data = upsertPackaging_(payload.item); break;
      case 'recordPayment':
        data = upsertPayment_(payload.payment); break;
      case 'updateSettings':
        data = saveSettings_(payload.settings); break;
      case 'sendWhatsAppNotification':
        data = logNotification_(payload.type, payload.message); break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    return ContentService.createTextOutput(JSON.stringify({ data })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ data: getAllData_() })).setMimeType(ContentService.MimeType.JSON);
}
