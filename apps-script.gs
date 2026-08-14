/**
 * TNDA 前導甄選 · 電子表單系統 — Google Sheets 後端
 * ─────────────────────────────────────────────────────────────
 * 五份表單共用這一支。每份表單自動開一個分頁，欄位由前端送來的
 * columns 決定，所以 config.js 加欄位時這裡不用改。
 *
 * 安裝：
 *   1. 新建一份 Google 試算表，命名例如「TNDA 前導甄選 評分資料」
 *   2. 擴充功能 → Apps Script，把本檔全部貼進去，存檔
 *   3. 部署 → 新增部署作業 → 類型「網頁應用程式」
 *        執行身分：我
 *        誰可以存取：任何人          ← 學員不需登入 Google
 *   4. 複製 /exec 網址，貼到 config.js 的 ENDPOINT
 *   5. 用瀏覽器打開該網址，看到 {"ok":true,…} 就代表通了
 *   6. 把下面的 READ_KEY 換成一串只有主辦知道的字（儀表板要用）
 *
 * 之後每次修改本檔，都要「部署 → 管理部署作業 → 編輯 → 新版本」
 * 才會生效。
 */

/**
 * 讀取金鑰。收件（doPost）不需要金鑰——學員與業師的裝置上不能放秘密。
 * 但「把全部資料讀出來」需要，因為 /exec 網址本身是公開的。
 *
 * 換成你自己的一串字（長一點、不要用生日），只給主辦，
 * 第一次開儀表板時輸入一次即可。留空字串＝不檢查，只建議測試時這樣。
 *
 * ⚠️ 真的金鑰**只改在 Apps Script 編輯器裡**，不要 commit 回這個檔案——
 *    repo 是公開的，金鑰寫在這裡等於沒有金鑰。
 * ⚠️ 在編輯器改完任何東西（含金鑰）要「部署 → 管理部署作業 → ✏️ 編輯 →
 *    版本選新增版本 → 部署」才會生效。按成「新增部署作業」會產生新網址，
 *    config.js 指的還是舊的，怎麼輸入金鑰都會說不對。
 */
var READ_KEY = 'CHANGE-ME-換成只有主辦知道的一串字';

/* ── 工具 ─────────────────────────────────────────────── */

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 取得（必要時建立）某份表單的分頁，並確保 columns 都有欄位。
 *  新欄位一律加在最右邊，既有資料不會位移。 */
function sheetFor_(form, columns) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(form);
  if (!sh) {
    sh = ss.insertSheet(form);
    sh.appendRow(columns);
    sh.getRange(1, 1, 1, columns.length).setFontWeight('bold');
    sh.setFrozenRows(1);
    return sh;
  }
  var header = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0]
    .map(function (h) { return String(h); });
  var missing = columns.filter(function (c) { return header.indexOf(c) === -1; });
  if (missing.length) {
    sh.getRange(1, header.length + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
  }
  return sh;
}

function headerOf_(sh) {
  return sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0]
    .map(function (h) { return String(h); });
}

/* ── 收件 ─────────────────────────────────────────────── */

/**
 * 前端送 { form, columns, rows }。每一列都帶同一個 sid
 * （表單 + 填答者 + 抬頭上的 key 欄位），寫入前先把同 sid 的舊列刪掉，
 * 所以同一個人改完重送不會產生重複。
 * 整段用 LockService 包住，避免多人同時送出互相覆蓋。
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    var p = JSON.parse(e.postData.contents);
    var form = String(p.form || '').replace(/[^\w-]/g, '');

    // 名單改名走另一條路，需要金鑰
    if (form === 'roster') return saveRoster_(p);

    var rows = p.rows || [];
    var columns = p.columns || [];
    if (!form || !rows.length || !columns.length) return json_({ ok: false, error: 'empty' });

    var sh = sheetFor_(form, columns);
    var header = headerOf_(sh);
    var sidCol = header.indexOf('sid');
    if (sidCol === -1) return json_({ ok: false, error: 'no sid column' });

    // 送出後不能修改：同一個 sid 已經有資料就不接受第二次。
    // 真的要讓某個人重填，到試算表把他那幾列刪掉即可。
    var sid = String(rows[0].sid || '');
    var last = sh.getLastRow();
    if (last > 1 && sid) {
      var existing = sh.getRange(2, sidCol + 1, last - 1, 1).getValues();
      for (var i = 0; i < existing.length; i++) {
        if (String(existing[i][0]) === sid) {
          return json_({ ok: false, error: 'already-submitted', sid: sid });
        }
      }
    }

    var now = new Date();
    var out = rows.map(function (r) {
      return header.map(function (h) {
        if (h === 'received_at') return now;
        return r[h] === undefined ? '' : r[h];
      });
    });
    sh.getRange(sh.getLastRow() + 1, 1, out.length, header.length).setValues(out);

    return json_({ ok: true, saved: out.length, form: form, sid: sid });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ── 名單改名 ─────────────────────────────────────────── */

/**
 * 工作人員在儀表板改學生姓名。存在 roster 分頁，兩欄：id、name。
 * **只改姓名，不動編號**——編號是所有資料的鍵，改了會對不上。
 * 寫入需要 READ_KEY；讀取（doGet action=roster）不需要，
 * 因為名字本來就印在名牌上，學員端各頁也要讀得到。
 */
function saveRoster_(p) {
  if (READ_KEY && String(p.key || '') !== READ_KEY) {
    return json_({ ok: false, error: 'unauthorized' });
  }
  var names = p.names || {};
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('roster');
  if (!sh) {
    sh = ss.insertSheet('roster');
    sh.appendRow(['id', 'name']);
    sh.getRange(1, 1, 1, 2).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  var ids = Object.keys(names);
  if (!ids.length) return json_({ ok: true, saved: 0 });

  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, 2).clearContent();
  sh.getRange(2, 1, ids.length, 2).setValues(ids.map(function (id) {
    return [id, String(names[id] || '')];
  }));
  return json_({ ok: true, saved: ids.length });
}

function readRoster_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('roster');
  if (!sh || sh.getLastRow() < 2) return {};
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues();
  var out = {};
  vals.forEach(function (r) { if (r[0]) out[String(r[0])] = String(r[1] || ''); });
  return out;
}

/** 各組選的題目：讀 topic2 分頁，同一組有多列時後面的蓋前面（＝最新）。 */
function readTopics_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('topic2');
  if (!sh) return {};
  var vals = sh.getDataRange().getValues();
  if (vals.length < 2) return {};
  var head = vals[0].map(String);
  var iT = head.indexOf('subject'), iC = head.indexOf('character');
  if (iT < 0 || iC < 0) return {};
  var out = {};
  for (var i = 1; i < vals.length; i++) {
    var t = String(vals[i][iT] || ''), c = String(vals[i][iC] || '');
    if (t && c) out[t] = c;
  }
  return out;
}

/** 想玩投票的彙總（免金鑰）。學員匿名只計票數；
 *  業師是公開評審，逐位回傳投哪一邊（M 開頭的 submitter）。 */
function readVotes_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('vote2');
  if (!sh) return {};
  var vals = sh.getDataRange().getValues();
  if (vals.length < 2) return {};
  var head = vals[0].map(String);
  var iT = head.indexOf('subject'), iP = head.indexOf('play'), iS = head.indexOf('submitter');
  if (iT < 0 || iP < 0) return {};
  // 同一人對同一組投多次時取最新一列（改成一組一票制之前的舊票不會重複計）。
  var latest = {};
  for (var i = 1; i < vals.length; i++) {
    var t = String(vals[i][iT] || ''), v = String(vals[i][iP] || '');
    var who = iS >= 0 ? String(vals[i][iS] || '') : ('row' + i);
    if (!t || !v) continue;
    latest[who + '|' + t] = { t: t, who: who, v: v };
  }
  var out = {};
  Object.keys(latest).forEach(function (k) {
    var r = latest[k];
    out[r.t] = out[r.t] || { y: 0, n: 0, m: {} };
    if (r.who.charAt(0) === 'M') { out[r.t].m[r.who] = r.v; }
    else if (r.v === 'Y') out[r.t].y++; else if (r.v === 'N') out[r.t].n++;
  });
  return out;
}

/* ── 讀取（給儀表板） ─────────────────────────────────── */

/**
 *   ?action=ping                    → 健康檢查，不需金鑰
 *   ?action=data&key=…              → 所有表單的資料
 *   ?action=data&form=peer1&key=…   → 單一表單
 *   ?action=status&key=…            → 每份表單已交幾人
 *
 * data 與 status 需要 READ_KEY。沒有金鑰的人就算知道這個網址，
 * 也只讀得到 ping 的回應。活動結束後請到「部署 → 管理部署作業」停用。
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'ping';
  var only = e && e.parameter && e.parameter.form;

  // ping、roster、topics 不需要金鑰：學員端各頁都要讀得到姓名；
  // 各組選的題目現場本來就會公布，業師手機不用金鑰也要看得到。
  if (action === 'roster') return json_({ ok: true, names: readRoster_() });
  if (action === 'topics') return json_({ ok: true, topics: readTopics_() });
  if (action === 'votes') return json_({ ok: true, votes: readVotes_() });

  if (action !== 'ping' && READ_KEY &&
      String((e && e.parameter && e.parameter.key) || '') !== READ_KEY) {
    return json_({ ok: false, error: 'unauthorized' });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets().filter(function (sh) {
    return headerOf_(sh).indexOf('sid') !== -1 && (!only || sh.getName() === only);
  });

  if (action === 'ping') {
    return json_({ ok: true, service: 'TNDA forms', forms: sheets.map(function (s) { return s.getName(); }) });
  }

  var out = {};
  sheets.forEach(function (sh) {
    var header = headerOf_(sh);
    var last = sh.getLastRow();
    var vals = last > 1 ? sh.getRange(2, 1, last - 1, header.length).getValues() : [];
    out[sh.getName()] = vals.map(function (r) {
      var o = {};
      header.forEach(function (h, i) {
        o[h] = (r[i] instanceof Date) ? r[i].toISOString() : r[i];
      });
      return o;
    });
  });

  if (action === 'status') {
    var st = {};
    Object.keys(out).forEach(function (f) {
      var seen = {};
      out[f].forEach(function (r) { seen[r.sid] = true; });
      st[f] = { submissions: Object.keys(seen).length, rows: out[f].length };
    });
    return json_({ ok: true, status: st });
  }

  return json_({ ok: true, data: out });
}
