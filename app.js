/* TNDA 電子表單系統 — 共用執行期
   form.html 與 dashboard.html 都用這一份。無外部相依。 */

window.APP = (() => {
const T = window.TNDA;

/* ── 字串 ──────────────────────────────────────────────── */
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ── 名單健檢 ──────────────────────────────────────────────
   名單是手打的。編號重複會讓兩個人被當成同一個人，而且不會報錯——
   所以在頁面最上方擋一塊紅字，讓打名單的人當場看見，而不是活動當天才發現。
   回傳 true 代表名單有問題。 */
function guard(hostEl) {
  const bad = T.problems();
  if (!bad.length) return false;
  const box = document.createElement('div');
  box.style.cssText = 'background:#FF4F2C;color:#fff;padding:16px 18px;font:400 14px/1.7 ' +
    '"Noto Sans TC","PingFang TC",sans-serif';
  box.innerHTML = '<b style="display:block;margin-bottom:6px">config.js 的名單有問題，請先修好再用</b>' +
    bad.map((p) => '· ' + esc(p)).join('<br>');
  hostEl.insertBefore(box, hostEl.firstChild);
  return true;
}

/* ── 入口頁 ────────────────────────────────────────────────
   學員入口（index.html）與業師入口（staff.html）共用這一段，
   差別只在 role —— 學員看不到業師端的評分表，也看不到儀表板。 */
const ENTRY_DESC = {
  peer1:    '每位同學發表後填一列。匿名，不計入錄取分數。',
  topic2:   '每組一張。全組決定來源角色，一人代表送出。',
  self2:    '每人一張。先自評，再評隊友，寫具體事例。',
  mentor1:  '每位候選人一張。六個面向 1–5 分，每分都要有證據。',
  vote2:    '每組提報完按一票：想玩／還不想。不計分。',
};

function entryHTML(role) {
  let html = '';
  [1, 2].forEach((day) => {
    const ids = Object.keys(T.FORMS).filter((id) => T.FORMS[id].day === day &&
      !T.FORMS[id].retired &&
      (T.FORMS[id].role === role || T.FORMS[id].role === 'all'));
    if (!ids.length) return;
    html += '<div class="day"><span>' + day + '</span><span>DAY ' + day + '</span></div>';
    ids.forEach((id) => {
      const f = T.FORMS[id];
      const extra = (f.role === 'all' && role === 'mentor') ? '&who=m' : '';
      html += '<a class="entry" href="form.html?f=' + encodeURIComponent(id) + extra + '">' +
        '<div class="top"><span class="nm">' + esc(f.title) + '</span>' +
        '<span class="wt">' + esc(f.weightLabel) + '</span></div>' +
        '<div class="sub">' + esc(ENTRY_DESC[id] || '') + '</div></a>';
    });
  });
  return html;
}

/* ── 返回 ──────────────────────────────────────────────────
   每一頁都要有。**刻意不用 history.back()**——大家是掃 QR 進來的，
   瀏覽器的上一頁可能是另一張表單、儀表板、或同一張表單的舊狀態，
   按下去會跑到莫名其妙的地方。一律導到明確的目的地，
   標籤也直接寫要去哪，不寫含糊的「上一頁」。 */
function mountBack(el, href, label) {
  if (!el) return;
  el.innerHTML = '<a href="' + esc(href || 'index.html') + '" id="__back">← ' +
    esc(label || '返回') + '</a>';
}

/** 這個時段、這個角色要填哪幾份表單。行程表兩邊共用同一份 forms 設定。 */
function formsFor(block, role) {
  return (block.forms || []).filter((id) => T.FORMS[id] &&
    (!role || T.FORMS[id].role === role || T.FORMS[id].role === 'all'));
}

/* ── 送出鎖 ────────────────────────────────────────────────
   一旦送出就不能改。sid = 表單＋填答者＋抬頭上的 key 欄位，
   跟後端用的是同一把鑰匙，所以兩邊擋的是同一件事。 */
const lock = {
  key: (sid) => 'tnda:sent:' + sid,
  is(sid) { try { return !!localStorage.getItem(this.key(sid)); } catch (e) { return false; } },
  set(sid) { try { localStorage.setItem(this.key(sid), new Date().toISOString()); } catch (e) { /* ignore */ } },
  at(sid) { try { return localStorage.getItem(this.key(sid)) || ''; } catch (e) { return ''; } },
};

/* ── 名單同步 ──────────────────────────────────────────────
   工作人員在儀表板改過的姓名。讀取不需要金鑰（名字本來就印在名牌上），
   寫入才需要。抓不到就用 config.js 的原名，頁面照常運作。 */
const ROSTER_CACHE = 'tnda:roster';

/** 姓名還沒載入時，在頁面最上方擋一塊——不然畫面全是編號，
 *  學員會以為壞了，工作人員也不會發現名單還沒建。 */
function nameNotice(hostEl) {
  const el = hostEl && hostEl.querySelector('#__names');
  const missing = T.missingNames();
  if (!hostEl) return;
  if (!missing.length) { if (el) el.remove(); return; }
  const box = el || document.createElement('div');
  box.id = '__names';
  box.style.cssText = 'background:#000;color:#fff;padding:14px 18px;font:400 13px/1.7 ' +
    '"Noto Sans TC","PingFang TC",sans-serif';
  box.innerHTML = '<b style="color:#FF4F2C">名單還沒載入，畫面上顯示的是編號。</b><br>' +
    (T.ENDPOINT
      ? '還缺 ' + missing.length + ' 個人的姓名。工作人員請到<b>統計儀表板 →「名單」</b>輸入後儲存。'
      // 黑底裡不要用 <code>——app.css 給它淺底，字會看不見
      : 'config.js 的 ENDPOINT 還沒填，所以讀不到試算表上的姓名。');
  if (!el) hostEl.insertBefore(box, hostEl.firstChild);
}

async function syncNames() {
  try {
    const cached = JSON.parse(localStorage.getItem(ROSTER_CACHE) || 'null');
    if (cached) T.applyNames(cached);
  } catch (e) { /* ignore */ }
  if (!T.ENDPOINT) return false;
  try {
    const res = await fetch(T.ENDPOINT + (T.ENDPOINT.includes('?') ? '&' : '?') + 'action=roster');
    const d = await res.json();
    if (!d.ok || !d.names) return false;
    T.applyNames(d.names);
    try { localStorage.setItem(ROSTER_CACHE, JSON.stringify(d.names)); } catch (e) { /* ignore */ }
    return true;
  } catch (e) { return false; }
}

/* ── 本機草稿 ──────────────────────────────────────────── */
const draft = {
  key: (formId, submitter, ctx) => 'tnda:' + formId + ':' + submitter + ':' + (ctx || ''),
  get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  /** 記住「我是誰」，跨表單共用，換一支表單不用重選。 */
  identity(v) {
    if (v) return this.set('tnda:me', v);
    return this.get('tnda:me');
  },
  forget() { try { localStorage.removeItem('tnda:me'); } catch (e) { /* private mode */ } },
};


/** 網址上的 ?me=07 就是「我是誰」。

    名牌上的 QR 各自帶自己的編號，掃進來就認人，不用在 38 個按鈕裡
    找自己——**選錯人是這整套資料最難救的錯**：他填的東西會掛到別人
    身上，兩個人的資料同時壞掉，而且不會有任何錯誤訊息。

    無效的編號一律忽略（寧可退回手動選，也不要認成錯的人）。
    回傳 true 表示這次有從網址認出身分。 */
function claimIdentity() {
  const id = new URLSearchParams(location.search).get('me');
  if (!id) return false;
  const p = T.person(id);
  if (!p) return false;
  const cur = draft.identity();
  if (!cur || cur.id !== p.id) draft.identity({ id: p.id, role: p.role });
  return true;
}

/* ── 名單 ──────────────────────────────────────────────────
   一律回傳 id，不回傳姓名。姓名只在畫面上出現，同名同姓才不會混在一起。 */

/** per 段的對象清單。me 是填答者 id，ctx 是 head 段已填的值。 */
function scopeList(scope, me, ctx) {
  if (scope === 'd1-peers')     return T.studentsIn(T.d1GroupOf(me)).filter((id) => id !== me);
  if (scope === 'd2-teammates') return T.teamMembers(T.d2TeamOf(me)).filter((id) => id !== me);
  if (scope === 'd2-members')   return T.teamMembers((ctx && ctx.team) || '');
  // 想玩投票：對每一組各投一票；學員跳過自己那組，業師全投。
  if (scope === 'vote-teams') {
    const mine = T.d2TeamOf(me);
    return T.d2Teams().filter((t) => t !== mine);
  }
  return [];
}

/** pick 欄位的 optionsFrom 解析，回傳 [{v, label}]。
 *  me 只有 'students-except-me' 用得到。 */
function optionList(from, me) {
  const asPeople = (ids) => ids.map((id) => ({ v: id, label: T.labelOf(id) }));
  if (from === 'all-students')      return asPeople(T.allStudentIds());
  if (from === 'students-except-me') return asPeople(T.allStudentIds().filter((id) => id !== me));
  if (from === 'mentors')           return asPeople(T.allMentorIds());
  if (from === 'mentors-day1')      return asPeople(T.mentorIdsForDay(1));
  if (from === 'mentors-day2')      return asPeople(T.mentorIdsForDay(2));
  if (from === 'd1-groups')         return T.d1Groups().map((g) => ({ v: g, label: g }));
  if (from === 'd2-teams')          return T.d2Teams().map((t) => ({ v: t, label: t }));
  // 想玩投票的組別：學員跳過自己那組，業師全部都能投。
  if (from === 'vote-teams') {
    const mine = T.d2TeamOf(me);
    return T.d2Teams().filter((t) => t !== mine).map((t) => ({ v: t, label: t }));
  }
  // 業師主責的組——Day2 觀察表與回饋單用。
  if (from === 'assigned-teams') return T.assignedTeams(me).map((t) => ({ v: t, label: t }));
  // 只有「我自己那一組」——選題單用，別組的題目不干你的事。
  if (from === 'my-d2-team') {
    const t = T.d2TeamOf(me);
    return t ? [{ v: t, label: t }] : [];
  }
  // cards:archetype / cards:moveLimit / cards:stage / cards:interaction
  if (from && from.indexOf('cards:') === 0) {
    const deck = (T.CARDS || {})[from.slice(6)] || [];
    return deck.map((c) => ({ v: c.v, label: c.v + '　' + c.label }));
  }
  return [];
}

/** 卡片代號 → 顯示名稱。統計時把 A03 還原成「投技猜拳」。 */
function cardLabel(code) {
  let hit = null;
  Object.values(T.CARDS || {}).forEach((deck) => {
    deck.forEach((c) => { if (c.v === code) hit = c; });
  });
  return hit ? hit.v + '　' + hit.label : (code || '');
}

/** 一份表單所有欄位（head + self + per + foot）的 key，順序即欄位順序。 */
function columnsOf(form) {
  // submitter/subject 存 id（統計靠它），另外各存一欄姓名，
  // 純粹是為了讓試算表打開時看得懂——所有 join 都不碰姓名欄。
  const keys = ['timestamp', 'sid', 'form', 'submitter', 'submitter_name',
                'role', 'subject', 'subject_name', 'rel'];
  const push = (fs) => (fs || []).forEach((f) => {
    keys.push(f.k);
    if (f.evidence) keys.push(f.k + '_ev');
  });
  push(form.head);
  push(form.self && form.self.fields);
  push(form.per && form.per.fields);
  push(form.foot && form.foot.fields);
  return keys;
}

/* ── 送出 ──────────────────────────────────────────────── */
/**
 * rows 已是最終列（每列一個 subject）。回傳 {ok, saved} 或 throw。
 * body 用純文字，避免 CORS preflight —— Apps Script 的網頁應用程式
 * 不回應 OPTIONS，加 Content-Type: application/json 反而會失敗。
 */
async function submit(formId, columns, rows) {
  if (!T.ENDPOINT) throw new Error('OFFLINE');
  const res = await fetch(T.ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ form: formId, columns, rows }),
    redirect: 'follow',
  });
  const txt = await res.text();
  // 後端也擋重複送出——同一個 sid 已經有資料就不接受，
  // 前端的鎖只是讓人不必走到這一步。
  if (txt.indexOf('already-submitted') >= 0) throw new Error('ALREADY');
  if (!res.ok || txt.indexOf('"ok":true') === -1) throw new Error(txt.slice(0, 200) || ('HTTP ' + res.status));
  return JSON.parse(txt);
}

/** 送出前的確認。講清楚送出後不能改，不是可有可無的提示。 */
function confirmSend(what) {
  return window.confirm(
    '確定要送出' + (what ? '「' + what + '」' : '') + '嗎？\n\n' +
    '送出後就不能再修改了。\n請先確認每一格都填好。');
}

/* ── CSV ───────────────────────────────────────────────── */
function toCSV(head, rows) {
  const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  return '﻿' + [head.map(q).join(','), ...rows.map((r) => r.map(q).join(','))].join('\n');
}
/** RFC-4180：支援引號、雙引號跳脫、欄位內換行。 */
function parseCSV(s) {
  const out = []; let row = [], cell = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); out.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); out.push(row); }
  return out;
}
function download(name, text, mime) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: (mime || 'text/csv') + ';charset=utf-8' }));
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
}

/* ── 數字 ──────────────────────────────────────────────── */
const mean = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
const median = (xs) => {
  const a = xs.filter((x) => x != null).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};
/** 1–5 的加權平均換算成 0–100。fields 需帶 weight，缺 weight 視為等權。 */
function weighted100(fields, values) {
  let sw = 0, acc = 0;
  fields.forEach((f) => {
    if (f.type !== 'scale') return;
    const v = Number(values[f.k]);
    if (!v) return;
    const w = f.weight == null ? 1 : f.weight;
    sw += w; acc += w * v;
  });
  return sw ? (acc / sw) / 5 * 100 : null;
}

/* ── 收件進度 ──────────────────────────────────────────────
   「一份表單收齊了沒」每一份的定義不一樣：學員端算人頭，
   業師端算「每位候選人被評過沒」或「每組每時段有沒有那一張」。
   儀表板與現場流程頁共用這一份定義，兩邊的數字才不會兜不起來。 */
const PROGRESS_LABEL = {
  peer1:    '同儕評價單',
  pair1:    '選兩位最想同組的人',
  self2:    '自評與團隊內互評單',
  topic2:   '選題單',
  mentor1:  '作品集答辯評分表',
  observe2: '個人過程觀察表（已改紙本）',
  team2:    '業師回饋單（已停用）',
  vote2:    '想玩投票',
};

function progressItems(formId, rows) {
  rows = rows || [];
  const has = (set, k) => ({ label: k, ok: set.has(k) });

  if (formId === 'peer1' || formId === 'self2' || formId === 'pair1') {
    const done = new Set(rows.map((r) => r.submitter));   // 誰交了
    return T.allStudentIds().map((id) => ({ id, label: id + '　' + T.nameOf(id), ok: done.has(id) }));
  }
  if (formId === 'vote2') {
    const done = new Set(rows.map((r) => r.submitter));
    return T.allStudentIds().concat(T.mentorIdsForDay(2))
      .map((id) => ({ id, label: id + '　' + T.nameOf(id), ok: done.has(id) }));
  }
  if (formId === 'mentor1') {
    const done = new Set(rows.map((r) => r.subject));     // 誰被評過
    return T.allStudentIds().map((id) => ({ id, label: id + '　' + T.nameOf(id), ok: done.has(id) }));
  }
  if (formId === 'observe2') {
    // 時段清單直接讀 config 的選項，改成三段制也不用回來動這裡。
    const slots = (T.FORMS.observe2.head.find((f) => f.k === 'slot') || {}).options || [];
    const done = new Set(rows.map((r) => r.team + '｜' + r.slot));
    const out = [];
    T.d2Teams().forEach((t) => slots.forEach((s) => out.push(has(done, t + '｜' + s))));
    return out.map((o) => ({ label: o.label.replace('｜', ' '), ok: o.ok }));
  }
  if (formId === 'team2' || formId === 'topic2') {
    // 一組一張（選題單開題時、回饋單 Final Proposal 講評時）。
    const done = new Set(rows.map((r) => r.subject));
    return T.d2Teams().map((t) => ({ label: t, ok: done.has(t) }));
  }
  return [];
}

function progressOf(formId, rows) {
  const items = progressItems(formId, rows);
  return { label: PROGRESS_LABEL[formId] || formId,
           done: items.filter((i) => i.ok).length, total: items.length, items };
}

/* ── 各組題目 ──────────────────────────────────────────────
   選題單送出後，各組選了什麼不是秘密（現場本來就會公布），
   所以後端提供免金鑰的 action=topics——業師手機不用金鑰也看得到。
   後端還沒更新或斷網時回空物件，畫面照常只是不顯示題目。 */
async function fetchTopics() {
  if (!T.ENDPOINT) return {};
  try {
    const res = await fetch(T.ENDPOINT + (T.ENDPOINT.includes('?') ? '&' : '?') + 'action=topics');
    const d = await res.json();
    return (d.ok && d.topics) ? d.topics : {};
  } catch (e) { return {}; }
}

/* ── 儀表板的讀取金鑰 ──────────────────────────────────────
   後端的 /exec 網址是公開的（學員不必登入 Google 才做得到），所以
   「把資料讀出來」這件事另外用一把金鑰擋。金鑰不寫在任何上架的檔案裡，
   由主辦第一次開儀表板時輸入，存在自己這台裝置的瀏覽器。 */
const readKey = {
  get() { try { return localStorage.getItem('tnda:readkey') || ''; } catch (e) { return ''; } },
  set(v) { try { localStorage.setItem('tnda:readkey', v || ''); } catch (e) { /* private mode */ } },
};

/** 試算表會把「01」這種編號存成數字 1，讀回來就對不上名單的 01–09。
 *  所有裝著人員編號的欄位在這裡統一補零＋轉字串——
 *  fetchAll（儀表板、run.html）與儀表板的 CSV 匯入都要過這一關。 */
const ID_COLS = ['submitter', 'subject', 'candidate', 'choice', 'choice2'];
function fixIds(data) {
  Object.values(data || {}).forEach((rows) => (rows || []).forEach((r) => {
    ID_COLS.forEach((k) => {
      if (r[k] === undefined || r[k] === null || r[k] === '') return;
      const v = String(r[k]);
      r[k] = /^\d$/.test(v) ? '0' + v : v;
    });
  }));
  return data;
}

/** 從後端抓資料。需要讀取金鑰；回傳 {peer1:[], mentor1:[], …}。 */
async function fetchAll() {
  if (!T.ENDPOINT) throw new Error('config.js 的 ENDPOINT 還沒填。');
  const q = 'action=data&key=' + encodeURIComponent(readKey.get());
  const res = await fetch(T.ENDPOINT + (T.ENDPOINT.includes('?') ? '&' : '?') + q);
  const d = await res.json();
  if (d.error === 'unauthorized') throw new Error('讀取金鑰不對，對一下 apps-script.gs 裡的 READ_KEY。');
  if (!d.ok) throw new Error(d.error || '回應格式不符');
  return fixIds(d.data || {});
}

/** 儀表板改名字用。寫入要金鑰。 */
async function saveNames(map) {
  if (!T.ENDPOINT) throw new Error('config.js 的 ENDPOINT 還沒填。');
  const res = await fetch(T.ENDPOINT, {
    method: 'POST', redirect: 'follow',
    body: JSON.stringify({ form: 'roster', key: readKey.get(), names: map }),
  });
  const d = JSON.parse(await res.text());
  if (d.error === 'unauthorized') throw new Error('讀取金鑰不對，改不了名單。');
  if (!d.ok) throw new Error(d.error || '存檔失敗');
  T.applyNames(map);
  try { localStorage.setItem(ROSTER_CACHE, JSON.stringify(map)); } catch (e) { /* ignore */ }
  return d;
}

return { esc, guard, entryHTML, readKey, fetchAll, fetchTopics, fixIds, progressItems, progressOf, PROGRESS_LABEL,
         draft, scopeList, optionList, cardLabel, columnsOf, submit, confirmSend,
         mountBack, formsFor, lock, syncNames, saveNames, nameNotice, claimIdentity,
         toCSV, parseCSV, download, mean, median, weighted100 };
})();
