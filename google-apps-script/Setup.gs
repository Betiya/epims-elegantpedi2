/**
 * Run setupEpimsSheets() once (Run > setupEpimsSheets, from the Apps Script editor)
 * to create all six tabs with the correct headers in a blank Google Sheet.
 * Safe to re-run — it only creates sheets/headers that don't already exist.
 */
function setupEpimsSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const tabs = {
    'Inventory': ['Product ID', 'Colour', 'Design', 'Size', 'Quantity Available', 'Reserved Quantity', 'Minimum Stock', 'Cost Price', 'Selling Price', 'Last Updated'],
    'Supplier Orders': ['Order Number', 'Supplier', 'Date', 'Colour', 'Design', 'Size', 'Quantity', 'Status', 'Notes'],
    'Packaging': ['Packaging Type', 'Quantity', 'Minimum Quantity', 'Supplier'],
    'Payments': ['Customer', 'Order Number', 'Amount', 'Paid', 'Outstanding', 'Date', 'Status'],
    'Settings': ['Key', 'Value'],
    'Inventory History': ['ID', 'Product ID', 'Change', 'Reason', 'Date', 'User'],
    'Notifications': ['ID', 'Type', 'Message', 'Date', 'Sent']
  };

  Object.keys(tabs).forEach((name) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    const headers = tabs[name];
    const existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (existing.join('') === '') {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
  });

  // Remove the default "Sheet1" if it's empty and unused.
  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1 && sheet1.getDataRange().getValues().flat().every((c) => c === '')) {
    ss.deleteSheet(sheet1);
  }

  // Seed the colours/designs/sizes product matrix so Inventory isn't empty.
  const inv = ss.getSheetByName('Inventory');
  if (inv.getLastRow() < 2) {
    const colours = ['Black', 'White'];
    const designs = ['Clean', 'Mebotorong', 'Neat'];
    const sizes = ['Small', 'Medium', 'Large', 'X-Large'];
    const rows = [];
    colours.forEach((c) => designs.forEach((d) => sizes.forEach((s) => {
      rows.push([`${c.charAt(0)}-${d.slice(0, 3).toUpperCase()}-${s.charAt(0)}`, c, d, s, 0, 0, 5, 85, 220, new Date()]);
    })));
    inv.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }

  // Seed default settings JSON if missing.
  const settingsSheet = ss.getSheetByName('Settings');
  const values = settingsSheet.getDataRange().getValues();
  if (!values.some((r) => r[0] === 'settings')) {
    settingsSheet.appendRow(['settings', JSON.stringify({
      businessName: 'ElegantPedi',
      suppliers: [{ name: 'PrintCraft Apparel', contact: '', leadTimeDays: 7 }],
      defaultMinimumStock: 5,
      whatsappNumbers: [],
      notificationPreferences: { lowStock: true, packagingAlert: true, supplierOrderAlert: true, dailySummary: true, weeklyReport: true }
    })]);
  }

  SpreadsheetApp.getUi().alert('EPIMS sheets are set up. You can now deploy Code.gs as a web app.');
}

/** Optional: run once to install the daily/weekly notification triggers. */
function installTriggers() {
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (['sendDailySummary', 'sendWeeklyReport'].includes(t.getHandlerFunction())) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendDailySummary').timeBased().everyDays(1).atHour(18).create();
  ScriptApp.newTrigger('sendWeeklyReport').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();
}
