var DEFAULT_SPREADSHEET_ID = '1fHx-iquw-pGeWmHsr0szKxylxIhlFpmujU5PYqvmP0w';
var SHEETS = {
  reports: { name: 'Reports', headers: ['id', 'unit', 'date', 'time', 'details', 'status', 'createdAt', 'updatedAt', 'finalStatus', 'finalDate', 'finalTime', 'finalNote', 'deleted'] },
  statuses: { name: 'Statuses', headers: ['id', 'name', 'color', 'updatedAt', 'deleted'] },
  units: { name: 'Units', headers: ['unit', 'name', 'updatedAt', 'deleted'] },
  config: { name: 'Config', headers: ['key', 'value', 'updatedAt'] }
};

function doGet(e) {
  const p = e && e.parameter ? e.parameter : {};
  const id = p.spreadsheetId || DEFAULT_SPREADSHEET_ID;
  try {
    var result = { ok: true, state: loadState(id) };
    return p.callback ? jsonp(p.callback, result) : json(result);
  } catch (err) {
    var result = { ok: false, error: String(err && err.message ? err.message : err) };
    return p.callback ? jsonp(p.callback, result) : json(result);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    var body = JSON.parse(e && e.postData ? e.postData.contents : '{}');
    var id = body.spreadsheetId || DEFAULT_SPREADSHEET_ID;
    lock.waitLock(30000);
    ensureBook(id);
    if (body.action === 'sync') applyOps(id, body.operations || []);
    return json({ ok: true, state: loadState(id) });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function ensureBook(id) {
  const ss = SpreadsheetApp.openById(id);
  Object.keys(SHEETS).forEach(function(k) {
    var cfg = SHEETS[k];
    let sh = ss.getSheetByName(cfg.name);
    if (!sh) sh = ss.insertSheet(cfg.name);
    var rg = sh.getRange(1, 1, 1, cfg.headers.length);
    var old = rg.getValues()[0];
    let bad = false;
    cfg.headers.forEach(function(h, i) { if (old[i] !== h) bad = true; });
    if (bad) { rg.setValues([cfg.headers]); rg.setFontWeight('bold'); sh.setFrozenRows(1); }
  });
}

function applyOps(id, ops) {
  ops.forEach(function(op) {
    var p = op.payload || {};
    if (op.type === 'upsertReport') upsert(id, SHEETS.reports, p.id, [p.id, p.unit, p.date, p.time, p.details, p.status, p.createdAt || p.updatedAt, p.updatedAt, p.finalStatus || '', p.finalDate || '', p.finalTime || '', p.finalNote || '', !!p.deleted]);
    if (op.type === 'deleteReport') markDeleted(id, SHEETS.reports, p.id, p.updatedAt);
    if (op.type === 'upsertStatus') upsert(id, SHEETS.statuses, p.id, [p.id, p.name, p.color, p.updatedAt, !!p.deleted]);
    if (op.type === 'deleteStatus') markDeleted(id, SHEETS.statuses, p.id, p.updatedAt);
    if (op.type === 'upsertUnit') upsert(id, SHEETS.units, p.unit, [p.unit, p.name || '', p.updatedAt || new Date().toISOString(), !!p.deleted]);
    if (op.type === 'deleteUnit') markDeleted(id, SHEETS.units, p.unit, p.updatedAt);
    if (op.type === 'saveConfig') {
      var t = new Date().toISOString();
      upsert(id, SHEETS.config, 'mainTitle', ['mainTitle', p.mainTitle || '', t]);
      upsert(id, SHEETS.config, 'titleTag', ['titleTag', p.titleTag || p.mainTitle || '', t]);
      upsert(id, SHEETS.config, 'subTitle', ['subTitle', p.subTitle || '', t]);
      upsert(id, SHEETS.config, 'footerText', ['footerText', p.footerText || '', t]);
    }
  });
}

function upsert(id, cfg, key, values) {
  if (!key) return;
  var sh = SpreadsheetApp.openById(id).getSheetByName(cfg.name);
  var row = findRow(sh, key);
  if (row) sh.getRange(row, 1, 1, cfg.headers.length).setValues([values]);
  else sh.appendRow(values);
}

function markDeleted(id, cfg, key, updatedAt) {
  var sh = SpreadsheetApp.openById(id).getSheetByName(cfg.name);
  var row = findRow(sh, key);
  if (!row) return;
  sh.getRange(row, cfg.headers.indexOf('deleted') + 1).setValue(true);
  sh.getRange(row, cfg.headers.indexOf('updatedAt') + 1).setValue(updatedAt || new Date().toISOString());
}

function findRow(sh, key) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var vals = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) if (String(vals[i][0]) === String(key)) return i + 2;
  return 0;
}

function loadState(id) {
  ensureBook(id);
  var ss = SpreadsheetApp.openById(id);
  var reports = rows(ss.getSheetByName('Reports'), SHEETS.reports.headers).map(function(r) {
    var oldDeleted = r.updatedAt === true || r.updatedAt === false || String(r.updatedAt).toLowerCase() === 'true' || String(r.updatedAt).toLowerCase() === 'false';
    var created = r.createdAt || r.updatedAt;
    var updated = oldDeleted ? created : (r.updatedAt || created);
    return { id: str(r.id), unit: str(r.unit) || 'N1', date: dateStr(r.date), time: timeStr(r.time), details: str(r.details), status: str(r.status), createdAt: iso(created), updatedAt: iso(updated), finalStatus: str(r.finalStatus), finalDate: dateStr(r.finalDate), finalTime: timeStr(r.finalTime), finalNote: str(r.finalNote), deleted: bool(r.deleted) || (oldDeleted && bool(r.updatedAt)) };
  }).filter(function(r) { return r.id; });
  var statuses = rows(ss.getSheetByName('Statuses'), SHEETS.statuses.headers).map(function(r) {
    return { id: str(r.id), name: str(r.name), color: str(r.color) || 'gray', updatedAt: iso(r.updatedAt), deleted: bool(r.deleted) };
  }).filter(function(r) { return r.id && r.name; });
  var unitLabels = rows(ss.getSheetByName('Units'), SHEETS.units.headers).map(function(r) {
    return { unit: str(r.unit), name: str(r.name), updatedAt: iso(r.updatedAt), deleted: bool(r.deleted) };
  }).filter(function(r) { return r.unit; });
  var cfg = rows(ss.getSheetByName('Config'), SHEETS.config.headers);
  return { appConfig: { mainTitle: cfgVal(cfg, 'mainTitle') || 'ระบบรายงานสถานการณ์ Wargame', titleTag: cfgVal(cfg, 'titleTag') || cfgVal(cfg, 'mainTitle') || 'ระบบรายงานสถานการณ์ Wargame', subTitle: cfgVal(cfg, 'subTitle') || 'โรงเรียนเสนาธิการทหารเรือ', footerText: cfgVal(cfg, 'footerText') || 'เชื่อมต่อ Google Sheets พร้อมระบบสำรองข้อมูลในเครื่อง' }, activityStatuses: statuses, unitLabels: unitLabels, reports: reports, meta: { updatedAt: new Date().toISOString(), lastSyncAt: new Date().toISOString() } };
}

function rows(sh, headers) {
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, headers.length).getValues().map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function cfgVal(rows, key) {
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].key) === key) return str(rows[i].value);
  }
  return '';
}
function str(v) { return v === null || v === undefined ? '' : String(v); }
function bool(v) { return v === true || String(v).toLowerCase() === 'true'; }
function dateStr(v) { return v instanceof Date ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd') : str(v); }
function timeStr(v) { return v instanceof Date ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'HH:mm') : str(v); }
function iso(v) { return v instanceof Date ? v.toISOString() : (str(v) || new Date().toISOString()); }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function jsonp(cb, o) { return ContentService.createTextOutput(String(cb).replace(/[^\w.$]/g, '') + '(' + JSON.stringify(o) + ');').setMimeType(ContentService.MimeType.JAVASCRIPT); }
