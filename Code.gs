/**
 * Boutique Stock & Billing - Google Sheet cloud storage
 *
 * Paste this whole file into Extensions > Apps Script of a new Google Sheet,
 * run setup() once, then Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone). See SETUP-GOOGLE-SHEET.md.
 *
 * Each app record is one row. The readable columns are for you to view,
 * filter and print; the app reads the hidden "Data" column, so make changes
 * in the app, not by typing in the sheet.
 */

/* RUN THIS ONE: pick "setup" in the function list above, then click Run. */
/* ------------------------------------------------------------------ setup */
function setup() {
  var ss = SpreadsheetApp.getActive();
  Object.keys(SHEETS).forEach(function (k) { sheetFor(k); });
  deletedSheet();
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('SHOP_KEY');
  if (!key) {
    key = Utilities.getUuid().replace(/-/g, '').slice(0, 24);
    props.setProperty('SHOP_KEY', key);
    props.setProperty('REV', '0');
  }
  var st = ss.getSheetByName('Setup') || ss.insertSheet('Setup', 0);
  st.clear();
  st.getRange(1, 1, 8, 2).setValues([
    ['Boutique Stock & Billing - cloud storage', ''],
    ['Shop key (paste into the app)', key],
    ['', ''],
    ['Next step', 'Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Copy the Web app URL into the app.'],
    ['Keep the key private', 'Anyone with the Web app URL AND this key can read and change your shop data.'],
    ['To change the key', 'Run resetKey() in Apps Script, then reconnect every phone.'],
    ['Editing in the sheet', 'You can change the visible columns, add rows or delete rows in Products, Sales, Purchases, Expenses and App Settings. Phones pick the change up within about 10 seconds. Do not edit the hidden Rev / Data columns.'],
    ['Product photos', 'Saved privately in the Google Drive folder "YAAL Product Photos" (only you can open it in Drive; the app loads them through this script).']
  ]);
  st.getRange('A1').setFontWeight('bold').setFontSize(14);
  st.getRange('A2:B2').setFontWeight('bold').setBackground('#FFF1D1');
  st.setColumnWidth(1, 240); st.setColumnWidth(2, 520);
  photoFolder(); // asks for Google Drive permission (product photos are saved there)
  installChangeTrigger(); // lets the app notice rows you delete in the sheet
  var s1 = ss.getSheetByName('Sheet1');
  if (s1 && s1.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s1);
  Logger.log('Shop key: ' + key);
}

function resetKey() {
  PropertiesService.getScriptProperties().deleteProperty('SHOP_KEY');
  setup();
}

var SHEETS = {
  products: {tab: 'Products', cols: [
    ['SKU', 'sku'], ['Product Name', 'name'], ['Category', 'category'], ['Fabric', 'fabric'], ['Colour', 'colour'],
    ['Size', 'size'], ['Cost Price', 'cost'], ['Selling Price', 'price'], ['Opening Stock', 'opening'], ['Reorder Level', 'reorder']]},
  sales: {tab: 'Sales', cols: [
    ['Invoice', 'invoice'], ['Date', 'date'], ['Customer', 'customer'], ['Phone', 'phone'], ['Payment', 'pay'], ['Channel', 'channel'],
    ['Pieces', 'qty'], ['Taxable Value', 'taxable'], ['GST', 'gst'], ['Bill Total', 'total'], ['Items', itemsText]]},
  purchases: {tab: 'Purchases', cols: [
    ['Date', 'date'], ['SKU', 'sku'], ['Product', 'name'], ['Qty', 'qty'], ['Unit Cost', 'cost'], ['Supplier', 'supplier'],
    ['Supplier Bill No', 'ref'], ['Payment', 'status'], ['Notes', 'notes']]},
  expenses: {tab: 'Expenses', cols: [
    ['Date', 'date'], ['Type', 'type'], ['Category', 'category'], ['Description', 'note'], ['Paid To', 'vendor'], ['Amount', 'amount'],
    ['Paid By', 'paidBy'], ['Payment', 'pay'], ['Settled With', 'to'], ['Split', splitText]]},
  config: {tab: 'App Settings', cols: [['Business Name', 'name'], ['GST Registered', 'gstReg'], ['Invoice Prefix', 'prefix']]}
};
var TEXT_KEYS = {phone: 1, ref: 1, sku: 1, invoice: 1};
var DELETED_TAB = '_deleted';


/* ------------------------------------------------------------------ web app */
function doGet() { return out({ok: true, app: 'boutique-stock'}); }

var SCRIPT_VERSION = 6;

function doPost(e) {
  try { return handle(e); }
  catch (err) { return out({ok: false, error: 'server: ' + (err && err.message ? err.message : String(err))}); }
}

function handle(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); } catch (x) { return out({ok: false, error: 'bad_request'}); }
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('SHOP_KEY');
  if (!key || req.key !== key) return out({ok: false, error: 'bad_key'});
  if (req.action === 'ping') return out({ok: true, version: SCRIPT_VERSION, rev: Number(props.getProperty('REV')) || 0});
  if (req.action === 'load') return out(load(Number(req.since) || 0));
  if (req.action === 'photo') return out(savePhoto(req));
  if (req.action === 'billPdf') return out(saveBillPdf(req));
  if (req.action === 'getPhoto') return out(getPhoto(req));
  if (req.action === 'deletePhoto') return out(deletePhoto(req));
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) return out({ok: false, error: 'busy'});
  try {
    if (req.action === 'batch') return out(batch(req.ops || []));
    if (req.action === 'replaceAll') return out(replaceAll(req.docs || {}));
    return out({ok: false, error: 'bad_action'});
  } finally {
    lock.releaseLock();
  }
}

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ------------------------------------------------------------------ storage */
function splitText(d) {
  d = d || {};
  if (!d.split || !d.split.shares) return '';
  return (d.split.mode === 'percent' ? '% ' : d.split.mode === 'amount' ? 'Amounts: ' : 'Equal: ') + d.split.shares.map(function (s) { return s.name + ' ' + s.amt; }).join(', ');
}

function itemsText(d) {
  d = d || {};
  return (d.items || []).map(function (i) { return i.name + (i.size ? ' (' + i.size + ')' : '') + ' x' + i.qty; }).join(', ');
}

function header(coll) {
  return ['ID'].concat(SHEETS[coll].cols.map(function (c) { return c[0]; })).concat(['Rev', 'Data (do not edit)']);
}

function sheetFor(coll) {
  var ss = SpreadsheetApp.getActive(), def = SHEETS[coll];
  var sh = ss.getSheetByName(def.tab);
  if (!sh) {
    sh = ss.insertSheet(def.tab);
    var h = header(coll);
    sh.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold').setBackground('#0B3D22').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
    sh.hideColumns(h.length - 1, 2);
  }
  return sh;
}

function deletedSheet() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(DELETED_TAB);
  if (!sh) {
    sh = ss.insertSheet(DELETED_TAB);
    sh.getRange(1, 1, 1, 2).setValues([['Path', 'Rev']]);
    sh.hideSheet();
  }
  return sh;
}

function cell(key, v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'string' && TEXT_KEYS[key] && /^[0-9+]/.test(v)) return "'" + v;
  return v;
}

function buildRow(coll, id, data, rev) {
  var row = [id];
  SHEETS[coll].cols.forEach(function (c) {
    row.push(typeof c[1] === 'function' ? c[1](data) : cell(c[1], data[c[1]]));
  });
  var json = JSON.stringify(data);
  if (json.length > 49000) throw new Error('record too large for one sheet cell (' + id + ')');
  row.push(rev, json);
  return row;
}

function load(since) {
  var rev = Number(PropertiesService.getScriptProperties().getProperty('REV')) || 0;
  if (since > 0 && since >= rev) return {ok: true, rev: rev, docs: {}, deleted: [], same: true};
  var fullRev = Number(PropertiesService.getScriptProperties().getProperty('FULLREV')) || 0, full = false;
  if (since > 0 && fullRev > since) { since = 0; full = true; }
  var docs = {}, present = {}, deleted = [];
  Object.keys(SHEETS).forEach(function (coll) {
    var sh = sheetFor(coll), vals = sh.getDataRange().getValues(), n = header(coll).length;
    for (var r = 1; r < vals.length; r++) {
      var id = String(vals[r][0]);
      if (!id) continue;
      present[coll + '/' + id] = true;
      if (Number(vals[r][n - 2]) > since) {
        try { docs[coll + '/' + id] = JSON.parse(vals[r][n - 1]); } catch (x) {}
      }
    }
  });
  if (since > 0) {
    var dv = deletedSheet().getDataRange().getValues();
    for (var i = 1; i < dv.length; i++) {
      var p = String(dv[i][0]);
      if (Number(dv[i][1]) > since && !present[p]) deleted.push(p);
    }
  }
  return {ok: true, rev: rev, docs: docs, deleted: deleted, full: full};
}

function batch(ops) {
  var props = PropertiesService.getScriptProperties();
  var rev = Number(props.getProperty('REV')) || 0;
  var cache = {}, results = [];
  function ctx(coll) {
    if (!cache[coll]) {
      var sh = sheetFor(coll), last = sh.getLastRow();
      var ids = last ? sh.getRange(1, 1, last, 1).getValues().map(function (r) { return String(r[0]); }) : ['ID'];
      cache[coll] = {sh: sh, ids: ids, coll: coll};
    }
    return cache[coll];
  }
  ops.forEach(function (o) {
    try { one(o); } catch (err) { results.push({ok: false, error: 'server: ' + (err && err.message ? err.message : String(err))}); }
  });
  function one(o) {
    var parts = String(o.path || '').split('/');
    var coll = parts[0], id = parts[1];
    if (parts.length !== 2 || !SHEETS[coll] || !id) { results.push({ok: false, error: 'bad_path'}); return; }
    var c = ctx(coll);
    if (o.op === 'put') {
      var data = o.data || {};
      if (o.ifAbsent && c.ids.indexOf(id) > 0) {
        var same = data._op ? findOp(c, data._op) : '';
        if (same) { results.push({ok: true, path: coll + '/' + same, data: data, dup: true}); return; }
        id = nextId(c.ids, id);
        if (coll === 'sales') data.invoice = id;
      }
      rev++;
      var row = buildRow(coll, id, data, rev), i = c.ids.indexOf(id);
      if (i > 0) c.sh.getRange(i + 1, 1, 1, row.length).setValues([row]);
      else { c.sh.appendRow(row); c.ids.push(id); }
      results.push({ok: true, path: coll + '/' + id, data: data});
    } else if (o.op === 'delete') {
      var j = c.ids.indexOf(id);
      if (j > 0) {
        if (c.sh.getMaxRows() > j + 1 || c.sh.getMaxRows() > 2) c.sh.deleteRow(j + 1);
        else c.sh.getRange(j + 1, 1, 1, header(coll).length).clearContent();
        c.ids.splice(j, 1);
      }
      rev++;
      deletedSheet().appendRow([coll + '/' + id, rev]);
      results.push({ok: true, path: coll + '/' + id});
    } else results.push({ok: false, error: 'bad_op'});
  }
  props.setProperty('REV', String(rev));
  return {ok: true, rev: rev, results: results};
}

function findOp(c, op) {
  var n = header(c.coll).length, last = c.sh.getLastRow();
  if (last < 2) return '';
  var vals = c.sh.getRange(2, 1, last - 1, n).getValues();
  for (var r = 0; r < vals.length; r++) {
    var j = String(vals[r][n - 1]);
    if (j.indexOf(op) >= 0) { try { if (JSON.parse(j)._op === op) return String(vals[r][0]); } catch (x) {} }
  }
  return '';
}

function nextId(ids, id) {
  var m = id.match(/^(.*?)(\d+)$/);
  if (!m) { var k = 2; while (ids.indexOf(id + '-' + k) > 0) k++; return id + '-' + k; }
  var pre = m[1], width = m[2].length, mx = 0;
  ids.forEach(function (x) {
    if (x.indexOf(pre) === 0) { var n = parseInt(x.slice(pre.length), 10); if (n > mx) mx = n; }
  });
  var s = String(mx + 1);
  while (s.length < width) s = '0' + s;
  return pre + s;
}

function replaceAll(docs) {
  var props = PropertiesService.getScriptProperties();
  var rev = (Number(props.getProperty('REV')) || 0) + 1;
  var gone = [];
  var groups = {};
  Object.keys(SHEETS).forEach(function (coll) { groups[coll] = []; });
  Object.keys(docs).forEach(function (p) {
    var parts = p.split('/');
    if (parts.length === 2 && groups[parts[0]]) groups[parts[0]].push(buildRow(parts[0], parts[1], docs[p], rev));
  });
  Object.keys(SHEETS).forEach(function (coll) {
    var sh = sheetFor(coll), last = sh.getLastRow(), n = header(coll).length;
    if (last > 1) {
      sh.getRange(2, 1, last - 1, 1).getValues().forEach(function (r) { if (r[0] !== '') gone.push([coll + '/' + r[0], rev]); });
      sh.getRange(2, 1, last - 1, n).clearContent();
    }
    var rows = groups[coll];
    if (rows.length) sh.getRange(2, 1, rows.length, n).setValues(rows);
  });
  if (gone.length) {
    var ds = deletedSheet();
    ds.getRange(ds.getLastRow() + 1, 1, gone.length, 2).setValues(gone);
  }
  props.setProperty('REV', String(rev));
  return {ok: true, rev: rev};
}

/* ------------------------------------------------------------------ photos */
function photoFolder() {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('PHOTO_FOLDER');
  if (id) { try { var f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (e) {} }
  var folder = DriveApp.createFolder('YAAL Product Photos');
  props.setProperty('PHOTO_FOLDER', folder.getId());
  return folder;
}

function savePhoto(req) {
  if (!req.data) return {ok: false, error: 'no_photo'};
  var bytes = Utilities.base64Decode(req.data);
  if (bytes.length > 4 * 1024 * 1024) return {ok: false, error: 'photo_too_large'};
  var name = String(req.name || 'photo').replace(/[^A-Za-z0-9_-]/g, '_') + '_' + new Date().getTime() + '.jpg';
  var file = photoFolder().createFile(Utilities.newBlob(bytes, req.mime || 'image/jpeg', name));
  return {ok: true, id: file.getId()};
}

function getPhoto(req) {
  try {
    var file = DriveApp.getFileById(String(req.id || ''));
    var blob = file.getBlob();
    return {ok: true, mime: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes())};
  } catch (e) { return {ok: false, error: 'photo_not_found'}; }
}

function deletePhoto(req) {
  try { DriveApp.getFileById(String(req.id || '')).setTrashed(true); } catch (e) {}
  return {ok: true};
}

/* ------------------------------------------------------------------ edits made directly in the sheet */
var NUM_KEYS = {amount: 1, cost: 1, price: 1, opening: 1, reorder: 1, qty: 1, taxable: 1, gst: 1, total: 1};

// Runs by itself whenever someone types in the sheet (not when the app writes).
function onEdit(e) {
  try { if (e && e.range) syncEditedRows(e.range); } catch (err) { console.error(err); }
}

function collForSheet(name) {
  var found = null;
  Object.keys(SHEETS).forEach(function (k) { if (SHEETS[k].tab === name) found = k; });
  return found;
}

function fromCell(key, v, tz, old) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  if (NUM_KEYS[key]) {
    if (v === '' || v === null || v === undefined) return key === 'reorder' ? '' : 0;
    var x = Number(String(v).replace(/[^0-9.\-]/g, ''));
    return isNaN(x) ? (old || 0) : x;
  }
  return v === null || v === undefined ? '' : String(v).trim();
}

function syncEditedRows(range) {
  var sh = range.getSheet(), coll = collForSheet(sh.getName());
  if (!coll) return;
  var n = header(coll).length, r0 = Math.max(2, range.getRow()), r1 = range.getLastRow();
  if (r1 < 2 || range.getColumn() > n - 2) return; // header row, or only the hidden Rev/Data columns
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return;
  try {
    var props = PropertiesService.getScriptProperties(), rev = Number(props.getProperty('REV')) || 0;
    var tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
    var vals = sh.getRange(r0, 1, r1 - r0 + 1, n).getValues();
    for (var i = 0; i < vals.length; i++) {
      var row = vals[i], id = String(row[0]).trim(), raw = String(row[n - 1] || ''), data = {};
      var blank = row.slice(1, n - 2).every(function (v) { return v === '' || v === null; });
      if (blank) continue;
      try { data = raw ? JSON.parse(raw) : {}; } catch (x) { data = {}; }
      var isNew = !raw;
      if (!id) {
        id = (coll === 'purchases' || coll === 'expenses') ? 'sheet' + new Date().getTime().toString(36) + i : String(row[1]).trim();
        if (!id) continue;
        sh.getRange(r0 + i, 1).setValue(id);
      }
      SHEETS[coll].cols.forEach(function (c, j) {
        if (typeof c[1] !== 'string') return;
        data[c[1]] = fromCell(c[1], row[j + 1], tz, data[c[1]]);
      });
      if (coll === 'products') { data.sku = id; if (isNew) data.createdAt = new Date().getTime(); }
      if (coll === 'sales') { data.invoice = data.invoice || id; if (!data.items) data.items = []; if (isNew) { data.createdAt = new Date().getTime(); data.fromSheet = true; } }
      if (coll === 'purchases' && isNew) data.createdAt = new Date().getTime();
      if (coll === 'expenses') { if (!data.type) data.type = 'expense'; if (isNew) data.createdAt = new Date().getTime(); }
      rev++;
      sh.getRange(r0 + i, n - 1, 1, 2).setValues([[rev, JSON.stringify(data)]]);
    }
    props.setProperty('REV', String(rev));
  } finally {
    lock.releaseLock();
  }
}

// Row deletions are not "edits", so a change trigger tells the phones to reload everything once.
function installChangeTrigger() {
  var ss = SpreadsheetApp.getActive();
  var has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'onSheetChange'; });
  if (!has) ScriptApp.newTrigger('onSheetChange').forSpreadsheet(ss).onChange().create();
}

function onSheetChange(e) {
  if (!e || (e.changeType !== 'REMOVE_ROW' && e.changeType !== 'REMOVE_GRID')) return;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return;
  try {
    var props = PropertiesService.getScriptProperties(), rev = (Number(props.getProperty('REV')) || 0) + 1;
    props.setProperty('REV', String(rev));
    props.setProperty('FULLREV', String(rev));
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------------ bill PDFs for WhatsApp links */
function billFolder() {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('BILL_FOLDER');
  if (id) { try { var f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (e) {} }
  var folder = DriveApp.createFolder('YAAL Bills');
  props.setProperty('BILL_FOLDER', folder.getId());
  return folder;
}

// Saves the bill PDF and makes a view-only link the customer can open from WhatsApp.
function saveBillPdf(req) {
  if (!req.data) return {ok: false, error: 'no_file'};
  var bytes = Utilities.base64Decode(req.data);
  if (bytes.length > 8 * 1024 * 1024) return {ok: false, error: 'file_too_large'};
  var name = String(req.name || 'bill.pdf').replace(/[^A-Za-z0-9_.-]/g, '_');
  var file = billFolder().createFile(Utilities.newBlob(bytes, 'application/pdf', name));
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }
  catch (e) { file.setTrashed(true); return {ok: false, error: 'sharing_blocked'}; }
  return {ok: true, id: file.getId(), url: 'https://drive.google.com/file/d/' + file.getId() + '/view'};
}
