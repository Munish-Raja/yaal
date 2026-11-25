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
  st.getRange(1, 1, 6, 2).setValues([
    ['Boutique Stock & Billing - cloud storage', ''],
    ['Shop key (paste into the app)', key],
    ['', ''],
    ['Next step', 'Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Copy the Web app URL into the app.'],
    ['Keep the key private', 'Anyone with the Web app URL AND this key can read and change your shop data.'],
    ['To change the key', 'Run resetKey() in Apps Script, then reconnect every phone.']
  ]);
  st.getRange('A1').setFontWeight('bold').setFontSize(14);
  st.getRange('A2:B2').setFontWeight('bold').setBackground('#FFF1D1');
  st.setColumnWidth(1, 240); st.setColumnWidth(2, 520);
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
  config: {tab: 'App Settings', cols: [['Business Name', 'name'], ['GST Registered', 'gstReg'], ['Invoice Prefix', 'prefix']]}
};
var TEXT_KEYS = {phone: 1, ref: 1, sku: 1, invoice: 1};
var DELETED_TAB = '_deleted';


/* ------------------------------------------------------------------ web app */
function doGet() { return out({ok: true, app: 'boutique-stock'}); }

function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); } catch (x) { return out({ok: false, error: 'bad_request'}); }
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('SHOP_KEY');
  if (!key || req.key !== key) return out({ok: false, error: 'bad_key'});
  if (req.action === 'load') return out(load(Number(req.since) || 0));
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
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
  row.push(rev, JSON.stringify(data));
  return row;
}

function load(since) {
  var rev = Number(PropertiesService.getScriptProperties().getProperty('REV')) || 0;
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
  return {ok: true, rev: rev, docs: docs, deleted: deleted};
}

function batch(ops) {
  var props = PropertiesService.getScriptProperties();
  var rev = Number(props.getProperty('REV')) || 0;
  var cache = {}, results = [];
  function ctx(coll) {
    if (!cache[coll]) {
      var sh = sheetFor(coll), last = sh.getLastRow();
      var ids = last ? sh.getRange(1, 1, last, 1).getValues().map(function (r) { return String(r[0]); }) : ['ID'];
      cache[coll] = {sh: sh, ids: ids};
    }
    return cache[coll];
  }
  ops.forEach(function (o) {
    var parts = String(o.path || '').split('/');
    var coll = parts[0], id = parts[1];
    if (parts.length !== 2 || !SHEETS[coll] || !id) { results.push({ok: false, error: 'bad_path'}); return; }
    var c = ctx(coll);
    if (o.op === 'put') {
      var data = o.data || {};
      if (o.ifAbsent && c.ids.indexOf(id) > 0) {
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
  });
  props.setProperty('REV', String(rev));
  return {ok: true, rev: rev, results: results};
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
