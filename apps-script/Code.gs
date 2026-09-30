/**
 * GoIT · Онбординг — збір прогресу працівників у Google Таблицю.
 * Встановлення — див. README.md, розділ «Звіт керівника».
 *
 * Аркуш «Звіт»   — один рядок на працівника (оновлюється автоматично).
 * Аркуш «Події»  — журнал усіх дій: реєстрація, прочитані розділи, тести.
 */

const REPORT = "Звіт";
const EVENTS = "Події";
const HEAD = ["Пошта", "ПІ", "Роль", "Реєстрація", "Розділів прочитано", "Всього розділів",
  "Проміжних тестів пройдено", "Проміжні тести, %", "Фінальний тест", "З 1-ї спроби, %",
  "Фінальний тест пройдено", "Слабкі блоки", "Остання дія", "Остання активність", "Прогрес (службове)"];

/** Запустіть один раз вручну: створює аркуші. Ключ керівника задається в «Налаштуваннях проєкту → Властивості скрипта» (MANAGER_KEY). */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let r = ss.getSheetByName(REPORT) || ss.insertSheet(REPORT);
  if (r.getLastRow() === 0) { r.appendRow(HEAD); r.setFrozenRows(1); r.getRange(1, 1, 1, HEAD.length).setFontWeight("bold"); r.hideColumns(HEAD.length); }
  let e = ss.getSheetByName(EVENTS) || ss.insertSheet(EVENTS);
  if (e.getLastRow() === 0) { e.appendRow(["Час", "Пошта", "ПІ", "Роль", "Подія", "Деталі"]); e.setFrozenRows(1); e.getRange(1, 1, 1, 6).setFontWeight("bold"); }
  if (!PropertiesService.getScriptProperties().getProperty("MANAGER_KEY")) {
    PropertiesService.getScriptProperties().setProperty("MANAGER_KEY", Utilities.getUuid().slice(0, 8));
  }
  Logger.log("Ключ керівника: " + PropertiesService.getScriptProperties().getProperty("MANAGER_KEY"));
}

const EVENT_NAMES = { register: "Реєстрація", login: "Повторний вхід", section_read: "Прочитав розділ", quiz: "Проміжний тест",
  final_start: "Почав фінальний тест", final_done: "Пройшов фінальний тест", final_restart: "Перепроходить фінальний тест" };

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ev = JSON.parse(e.postData.contents);
    const email = String(ev.email || "").trim().toLowerCase();
    if (!email || !/@/.test(email)) return json({ ok: false, error: "no email" });
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rep = ss.getSheetByName(REPORT), log = ss.getSheetByName(EVENTS);
    const s = ev.summary || {};
    let details = "";
    const p = ev.payload || {};
    if (ev.type === "section_read") details = p.title || p.section || "";
    if (ev.type === "quiz") details = (p.title || p.section) + ": " + p.score + "/" + p.total;
    if (ev.type === "final_done") details = "з 1-ї спроби " + p.firstOk + "/" + p.total;
    log.appendRow([new Date(ev.ts || Date.now()), email, ev.name, ev.trackTitle, EVENT_NAMES[ev.type] || ev.type, details]);

    const row = [email, ev.name, ev.trackTitle, ev.registeredAt ? new Date(ev.registeredAt) : "",
      s.sectionsDone, s.sectionsTotal, s.quizzesDone, s.quizPct, s.finalStatus, s.finalFirstPct,
      s.finalDoneAt ? new Date(s.finalDoneAt) : "", s.weakBlocks, EVENT_NAMES[ev.type] || ev.type, new Date(ev.ts || Date.now()),
      JSON.stringify({ track: ev.track, progress: ev.progress })];
    const n = rep.getLastRow();
    const emails = n > 1 ? rep.getRange(2, 1, n - 1, 1).getValues().map(r => String(r[0]).toLowerCase()) : [];
    const i = emails.indexOf(email);
    if (i >= 0) rep.getRange(i + 2, 1, 1, row.length).setValues([row]);
    else rep.appendRow(row);
    return json({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const a = (e.parameter.action || "").toLowerCase();
  const rep = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(REPORT);
  const n = rep.getLastRow();
  const data = n > 1 ? rep.getRange(2, 1, n - 1, HEAD.length).getValues() : [];
  const iso = v => v instanceof Date ? v.toISOString() : (v || "");

  if (a === "progress") {
    const email = String(e.parameter.email || "").trim().toLowerCase();
    const r = data.find(x => String(x[0]).toLowerCase() === email);
    if (!r) return json({ found: false });
    let extra = {}; try { extra = JSON.parse(r[14]); } catch (err) {}
    return json({ found: true, track: extra.track, registeredAt: iso(r[3]), progress: extra.progress || {} });
  }
  if (a === "report") {
    const key = PropertiesService.getScriptProperties().getProperty("MANAGER_KEY");
    if (!key || e.parameter.key !== key) return json({ ok: false, error: "невірний ключ" });
    const rows = data.map(r => ({
      email: r[0], name: r[1], trackTitle: r[2], registeredAt: iso(r[3]), sectionsDone: r[4], sectionsTotal: r[5],
      quizzesDone: r[6], quizPct: r[7], finalStatus: r[8], finalFirstPct: r[9], finalDoneAt: iso(r[10]),
      weakBlocks: r[11], lastEvent: r[12], lastActivity: iso(r[13])
    }));
    return json({ ok: true, rows: rows });
  }
  return json({ ok: true, service: "GoIT onboarding" });
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
