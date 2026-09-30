/* GoIT · Онбординг менторів і тьюторів */
(function () {
  "use strict";
  const ONB = window.ONB, TESTS = window.ONB_TESTS, CFG = window.ONB_CONFIG || {};
  const KEY = "goit-onboarding-v1";
  const app = document.getElementById("app");
  const who = document.getElementById("who");
  const LET = ["А", "Б", "В", "Г"];

  /* ───────── піксельні іконки 9×9 ───────── */
  const ICONS = {
    building: [".XXXXXXX.", ".X.X.X.X.", ".XXXXXXX.", ".X.X.X.X.", ".XXXXXXX.", ".X.X.X.X.", ".XXXXXXX.", ".XXX.XXX.", "XXXXXXXXX"],
    book: ["XXXX.XXXX", "X..X.X..X", "X.XX.XX.X", "X..X.X..X", "X.XX.XX.X", "X..X.X..X", "XXXX.XXXX", "...XXX...", "........."],
    gift: [".XX...XX.", "...X.X...", "XXXXXXXXX", "X...X...X", "XXXXXXXXX", ".X..X..X.", ".X..X..X.", ".X..X..X.", ".XXXXXXX."],
    people: [".XX...XX.", "XXXX.XXXX", ".XX...XX.", ".........", "XXXX.XXXX", "XXXX.XXXX", "XXXX.XXXX", ".........", "........."],
    coin: ["..XXXXX..", ".X.....X.", "X...X...X", "X..XXX..X", "X...X...X", "X..XXX..X", "X...X...X", ".X.....X.", "..XXXXX.."],
    wrench: ["......XX.", ".....X..X", ".....X.X.", "....XXX..", "...XXX...", "..XXX....", ".XXX.....", "XXX......", "XX......."],
    person: ["...XXX...", "..XXXXX..", "..XXXXX..", "...XXX...", ".........", ".XXXXXXX.", "XXXXXXXXX", "XXXXXXXXX", "........."],
    screen: ["XXXXXXXXX", "X.......X", "X.XXX...X", "X.......X", "X.XXXXX.X", "X.......X", "XXXXXXXXX", "...XXX...", "..XXXXX.."],
    check: [".........", "........X", ".......XX", "......XX.", "X....XX..", "XX..XX...", ".XXXX....", "..XX.....", "........."],
    chat: ["XXXXXXXXX", "X.......X", "X.XX.XX.X", "X.......X", "X.XXXX..X", "X.......X", "XXXXXXXXX", ".XX......", ".X......."],
    hash: ["..X...X..", "..X...X..", "XXXXXXXXX", "..X...X..", "..X...X..", "XXXXXXXXX", "..X...X..", "..X...X..", "........."],
    plane: ["........X", "......XXX", "....XXXX.", "..XXXXXX.", "XXXXXXX..", "...XXXX..", "...X.XX..", "...X..X..", "........."],
    mega: ["......XX.", "....XXXX.", "XXXXXXXX.", "XXXXXXXXX", "XXXXXXXX.", ".X..XXXX.", ".X....XX.", ".X.......", "........."],
    star: ["....X....", "...XXX...", "XXXXXXXXX", ".XXXXXXX.", "..XXXXX..", "..XXXXX..", ".XX...XX.", ".X.....X.", "........."],
    compass: ["..XXXXX..", ".X.....X.", "X.....XXX", "X....XX.X", "X...X...X", "X.XX....X", "XXX.....X", ".X.....X.", "..XXXXX.."],
    cal: [".X....X..", "XXXXXXXXX", "XXXXXXXXX", "X.......X", "X.....X.X", "X.X..X..X", "X..XX...X", "X.......X", "XXXXXXXXX"],
    play: [".........", ".XX......", ".XXXX....", ".XXXXXX..", ".XXXXXXX.", ".XXXXXX..", ".XXXX....", ".XX......", "........."],
    clock: ["..XXXXX..", ".X.....X.", "X...X...X", "X...X...X", "X...XXX.X", "X.......X", "X.......X", ".X.....X.", "..XXXXX.."],
    lock: ["...XXX...", "..X...X..", "..X...X..", ".XXXXXXX.", ".XXXXXXX.", ".XXX.XXX.", ".XXX.XXX.", ".XXXXXXX.", "........."],
    flag: ["X........", "XXXXXXX..", "XXXXXXXX.", "XXXXXXX..", "X........", "X........", "X........", "X........", "........."],
    chart: ["........X", "......X.X", "......X.X", "...X..X.X", "...X..X.X", "X..X..X.X", "X..X..X.X", "X..X..X.X", "XXXXXXXXX"],
    arrow: [".........", "....X....", ".....X...", "......X..", "XXXXXXXXX", "......X..", ".....X...", "....X....", "........."]
  };
  const px = (name, size) => `<span class="px" style="--s:${size}px" aria-hidden="true">${(ICONS[name] || ICONS.star).join("").split("").map(c => `<i${c === "X" ? ' class="on"' : ""}></i>`).join("")}</span>`;
  const tile = (icon, color, size, isz) => `<span class="tile c-${color}" style="width:${size}px;height:${size}px">${px(icon, isz || Math.round(size * .5))}</span>`;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; if (m10 === 1 && m100 !== 11) return a; if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return b; return c; };
  const shuffle = n => { const a = [...Array(n).keys()]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmtDate = iso => { try { return new Date(iso).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return ""; } };

  /* ───────── стан ───────── */
  const fresh = () => ({ user: null, read: {}, quizzes: {}, checks: {}, final: null, outbox: [] });
  let S = fresh();
  try { const r = localStorage.getItem(KEY); if (r) S = Object.assign(fresh(), JSON.parse(r)); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  const track = () => S.user && ONB.tracks[S.user.track];
  const trackSections = () => track() ? track().sections : [];
  const readCount = () => trackSections().filter(s => S.read[s]).length;
  const allRead = () => trackSections().length > 0 && readCount() === trackSections().length;
  const test = () => S.user && TESTS[S.user.track];

  function finalStatus() {
    const f = S.final;
    if (f && f.phase === "done") return "пройдено";
    if (f && f.phase !== "intro") return "в процесі";
    return "не почато";
  }
  function summary() {
    const secs = trackSections();
    const qz = Object.entries(S.quizzes).filter(([k]) => secs.includes(k));
    const ok = qz.reduce((a, [, v]) => a + v.score, 0), tot = qz.reduce((a, [, v]) => a + v.total, 0);
    const f = S.final, t = test();
    let firstPct = "";
    if (f && f.phase === "done" && t) firstPct = Math.round(Object.values(f.first).filter(Boolean).length / t.questions.length * 100);
    return {
      sectionsDone: readCount(), sectionsTotal: secs.length,
      quizzesDone: qz.length, quizPct: tot ? Math.round(ok / tot * 100) : "",
      finalStatus: finalStatus(), finalFirstPct: firstPct, finalDoneAt: f && f.finishedAt || "",
      weakBlocks: f && f.phase === "done" ? weakBlocks().map(b => b.title).join(", ") : ""
    };
  }

  /* ───────── синхронізація з Google Таблицею ───────── */
  function send(type, payload) {
    if (!S.user) return;
    const ev = {
      type, ts: new Date().toISOString(),
      name: S.user.name, email: S.user.email, track: S.user.track, trackTitle: track() ? track().title : "",
      registeredAt: S.user.registeredAt, payload: payload || {}, summary: summary(),
      progress: { read: S.read, quizzes: S.quizzes, final: S.final ? { phase: S.final.phase, first: S.final.first, finishedAt: S.final.finishedAt, checks: S.final.checks } : null }
    };
    S.outbox.push(ev); if (S.outbox.length > 50) S.outbox = S.outbox.slice(-50); save(); flush();
  }
  let flushing = false;
  async function flush() {
    if (!CFG.APPS_SCRIPT_URL || flushing || !S.outbox.length) return;
    flushing = true;
    while (S.outbox.length) {
      const ev = S.outbox[0];
      try {
        await fetch(CFG.APPS_SCRIPT_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(ev) });
        S.outbox.shift(); save();
      } catch (e) { break; }
    }
    flushing = false;
  }
  window.addEventListener("online", flush);

  async function restoreProgress(email) {
    if (!CFG.APPS_SCRIPT_URL) return null;
    try {
      const r = await fetch(CFG.APPS_SCRIPT_URL + "?action=progress&email=" + encodeURIComponent(email));
      const d = await r.json();
      return d && d.found ? d : null;
    } catch (e) { return null; }
  }

  /* ───────── роутер ───────── */
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [a, b] = h.split("/");
    renderWho();
    if (a === "report") return renderReport();
    if (!S.user) return renderRegister();
    if (a === "s" && ONB.sections[b] && trackSections().includes(b)) return renderSection(b);
    if (a === "quiz" && ONB.sections[b] && ONB.sections[b].quiz.length) return renderQuiz(b);
    if (a === "final") return renderFinal();
    return renderDash();
  }
  window.addEventListener("hashchange", () => { route(); window.scrollTo(0, 0); });
  function go(h) { if (location.hash === h) route(); else location.hash = h; }

  function renderWho() {
    if (!who) return;
    if (S.user) {
      who.innerHTML = `<div class="who"><b>${esc(S.user.name)}</b><br>${esc(track().short)}</div><button class="linkbtn" id="logout">Вийти</button>`;
      document.getElementById("logout").onclick = () => renderLogout();
    } else who.innerHTML = "";
  }

  /* ───────── реєстрація ───────── */
  function renderRegister() {
    const tr = Object.entries(ONB.tracks);
    app.innerHTML = `
    <div class="hero">
      <section>
        <div class="tiles">${[["building", "blue"], ["book", "yellow"], ["chat", "pink"], ["check", "green"], ["star", "lilac"]].map(([i, c]) => tile(i, c, 54)).join("")}</div>
        <p class="eyebrow">GoIT · Департамент менторів</p>
        <h1 class="big" style="margin:10px 0 18px">Онбординг ментора й тьютора</h1>
        <p class="lead">Усе, що потрібно для старту роботи зі студентами: компанія й продукт, твоя роль, інструменти, процеси, KPI. Наприкінці — фінальне тестування, яке відкриває допуск до роботи.</p>
        <div class="card soft stack" style="margin-top:26px">
          <div class="steps">
            <div class="step"><span class="n">1</span><div><b>Реєструєшся</b><br><span class="muted">Ім’я, прізвище, пошта й твоя роль</span></div></div>
            <div class="step"><span class="n">2</span><div><b>Проходиш розділи</b><br><span class="muted">Спільні для всіх і розділи своєї ролі. У частині розділів є проміжні тести — за бажанням</span></div></div>
            <div class="step"><span class="n">3</span><div><b>Складаєш фінальне тестування</b><br><span class="muted">25 ситуаційних питань і чек-лист доступів. Результат автоматично бачить керівник</span></div></div>
          </div>
        </div>
      </section>
      <section class="card">
        <form class="form" id="reg" novalidate>
          <h2 class="h2">Реєстрація</h2>
          <label class="field" for="rname">Ім’я та прізвище
            <input id="rname" type="text" autocomplete="name" placeholder="Олена Коваль" required>
            <span class="err" id="ename" hidden>Вкажи ім’я та прізвище</span>
          </label>
          <label class="field" for="remail">Робоча пошта
            <input id="remail" type="email" autocomplete="email" placeholder="name@gmail.com" required>
            <span class="err" id="eemail" hidden>Перевір адресу пошти</span>
          </label>
          <div class="field">Твоя роль
            <div class="tracks">${tr.map(([id, t], i) => `
              <label class="track" for="tr-${id}"><input type="radio" name="track" id="tr-${id}" value="${id}">
                ${tile(t.icon, t.color, 44)}<span><b>${esc(t.title)}</b><small>${t.sections.length} розділів · фінальний тест на 25 питань</small></span></label>`).join("")}
            </div>
            <span class="err" id="etrack" hidden>Обери свою роль</span>
          </div>
          <button class="btn" type="submit">Почати онбординг ${px("arrow", 16)}</button>
          <p class="muted" style="font-size:13px">Прогрес зберігається автоматично. Якщо зайдеш з іншого пристрою з тією ж поштою — продовжиш з того ж місця.</p>
        </form>
      </section>
    </div>`;
    document.getElementById("reg").onsubmit = async e => {
      e.preventDefault();
      const name = document.getElementById("rname").value.trim().replace(/\s+/g, " ");
      const email = document.getElementById("remail").value.trim().toLowerCase();
      const t = (document.querySelector('input[name="track"]:checked') || {}).value;
      const okName = name.split(" ").length >= 2 && name.length >= 4;
      const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      document.getElementById("ename").hidden = okName;
      document.getElementById("eemail").hidden = okEmail;
      document.getElementById("etrack").hidden = !!t;
      if (!okName || !okEmail || !t) return;
      const btn = e.target.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Зберігаємо…";
      S = fresh();
      S.user = { name, email, track: t, registeredAt: new Date().toISOString() };
      const prev = await restoreProgress(email);
      if (prev && prev.progress && prev.track === t) {
        const p = prev.progress;
        S.read = p.read || {}; S.quizzes = p.quizzes || {};
        if (p.final && p.final.phase === "done") S.final = Object.assign(freshFinal(), p.final, { phase: "done" });
        if (prev.registeredAt) S.user.registeredAt = prev.registeredAt;
      }
      save(); send(prev ? "login" : "register"); go("#/");
    };
  }

  function renderLogout() {
    app.innerHTML = `<div class="wrap-narrow"><section class="card stack">
      <h2 class="h2">Вийти з онбордингу?</h2>
      <p class="lead">Прогрес уже збережено для пошти <b>${esc(S.user.email)}</b>. Щоб продовжити, знову зареєструйся з тією самою поштою й роллю.</p>
      <div class="row"><button class="btn" id="yes">Вийти</button><a class="btn ghost" href="#/">Залишитися</a></div>
    </section></div>`;
    document.getElementById("yes").onclick = () => { flush(); S = fresh(); save(); go("#/"); };
  }

  /* ───────── головна ───────── */
  function renderDash() {
    const t = track(), secs = trackSections(), done = readCount(), pct = Math.round(done / secs.length * 100);
    const next = secs.find(s => !S.read[s]);
    const groups = [...new Set(secs.map(s => ONB.sections[s].group))];
    const fs = finalStatus(), T = test();
    const list = g => secs.filter(s => ONB.sections[s].group === g).map(s => {
      const sec = ONB.sections[s], q = S.quizzes[s], idx = secs.indexOf(s) + 1;
      const chips = [
        S.read[s] ? `<span class="chip done">Прочитано</span>` : `<span class="chip">Не прочитано</span>`,
        sec.quiz.length ? (q ? `<span class="chip quiz">Тест ${q.score}/${q.total}</span>` : `<span class="chip">Тест · за бажанням</span>`) : ""
      ].join("");
      return `<a class="item" href="#/s/${s}">${tile(sec.icon, sec.color, 44)}<span><span class="m">Розділ ${idx}</span><br><span class="t">${esc(sec.title)}</span></span><span class="chips">${chips}</span></a>`;
    }).join("");
    app.innerHTML = `<div class="stack">
      <section class="card">
        <div class="dash-head">
          <div class="stack" style="gap:12px">
            <p class="eyebrow">${esc(t.title)}</p>
            <h1 class="h2">Привіт, ${esc(S.user.name.split(" ")[0])}!</h1>
            <p class="lead muted">${done === secs.length ? "Усі розділи пройдено. Залишилось фінальне тестування." : `Пройдено ${done} з ${secs.length} ${plural(secs.length, "розділу", "розділів", "розділів")}.`}</p>
          </div>
          <div class="pct">${pct}%</div>
        </div>
        <div class="progress" style="margin:22px 0"><span style="width:${pct}%"></span></div>
        <div class="row">
          ${next ? `<a class="btn" href="#/s/${next}">${done ? "Продовжити" : "Почати"}: ${esc(ONB.sections[next].title)} ${px("arrow", 16)}</a>` :
            `<a class="btn" href="#/final">${fs === "пройдено" ? "Переглянути результат тесту" : "До фінального тестування"} ${px("arrow", 16)}</a>`}
        </div>
      </section>
      ${groups.map(g => `<div class="group-title"><h2 style="font-size:22px">${esc(ONB.groups[g])}</h2><span class="muted" style="font-weight:600;font-size:14px">${secs.filter(s => ONB.sections[s].group === g && S.read[s]).length} / ${secs.filter(s => ONB.sections[s].group === g).length}</span></div><div class="list">${list(g)}</div>`).join("")}
      <div class="group-title"><h2 style="font-size:22px">Фінальне тестування</h2></div>
      <section class="card final-card">
        ${tile(fs === "пройдено" ? "check" : allRead() ? "flag" : "lock", fs === "пройдено" ? "green" : allRead() ? "yellow" : "lilac", 64)}
        <div><h3 style="font-size:20px">${esc(T.title)}</h3>
          <p class="muted">${fs === "пройдено" ? `Пройдено ${fmtDate(S.final.finishedAt)} · з першої спроби ${summary().finalFirstPct}%` :
            allRead() ? `${T.questions.length} питань, робота над помилками до 100% і чек-лист доступів. Обов’язковий крок.` :
            `Відкриється, щойно ти позначиш прочитаними всі розділи. Залишилось: ${secs.length - done}.`}</p></div>
        ${allRead() ? `<a class="btn" href="#/final">${fs === "пройдено" ? "Результат" : fs === "в процесі" ? "Продовжити" : "Почати тест"}</a>` : `<span class="chip lock">Недоступно</span>`}
      </section>
    </div>`;
  }

  /* ───────── розділ ───────── */
  function renderSection(slug) {
    const sec = ONB.sections[slug], secs = trackSections(), i = secs.indexOf(slug);
    const prev = secs[i - 1], next = secs[i + 1], q = S.quizzes[slug];
    const mins = Math.max(2, Math.round(sec.html.replace(/<[^>]+>/g, " ").split(/\s+/).length / 180));
    app.innerHTML = `<div class="wrap-narrow">
      <nav class="crumbs"><a href="#/">Усі розділи</a> <span>/</span> <span>${esc(ONB.groups[sec.group])}</span></nav>
      <article class="card">
        <div class="sec-head">${tile(sec.icon, sec.color, 60)}<div><p class="eyebrow">Розділ ${i + 1} з ${secs.length} · ${mins} хв читання</p><h1 class="h2" style="margin-top:6px">${esc(sec.title)}</h1></div></div>
        <div class="prose" style="margin-top:26px">${sec.html}</div>
      </article>
      <div class="sec-foot" style="margin-top:20px">
        ${sec.quiz.length ? `<section class="card soft final-card">${tile("check", "yellow", 52)}<div><h3 style="font-size:18px">Проміжний тест · необов’язковий</h3><p class="muted">${sec.quiz.length} ${plural(sec.quiz.length, "питання", "питання", "питань")} для самоперевірки${q ? ` · твій результат: ${q.score}/${q.total}` : ""}</p></div><a class="btn ghost small" href="#/quiz/${slug}">${q ? "Пройти ще раз" : "Пройти тест"}</a></section>` : ""}
        <section class="card row" style="justify-content:space-between">
          <div><b>${S.read[slug] ? "Розділ позначено як прочитаний" : "Дочитав(-ла) до кінця?"}</b><br><span class="muted" style="font-size:14px">${S.read[slug] ? fmtDate(S.read[slug]) : "Познач розділ, щоб зарахувати його в прогрес"}</span></div>
          ${S.read[slug] ? (next ? `<a class="btn" href="#/s/${next}">Наступний розділ ${px("arrow", 16)}</a>` : `<a class="btn" href="#/">До всіх розділів</a>`) :
            `<button class="btn" id="markread">${px("check", 16)} Прочитано${next ? " — далі" : ""}</button>`}
        </section>
        <nav class="pager">
          ${prev ? `<a href="#/s/${prev}"><small>← Попередній</small>${esc(ONB.sections[prev].title)}</a>` : "<span></span>"}
          ${next ? `<a class="next" href="#/s/${next}"><small>Наступний →</small>${esc(ONB.sections[next].title)}</a>` : `<a class="next" href="#/final"><small>Далі →</small>Фінальне тестування</a>`}
        </nav>
      </div>
    </div>`;
    const mr = document.getElementById("markread");
    if (mr) mr.onclick = () => { S.read[slug] = new Date().toISOString(); save(); send("section_read", { section: slug, title: sec.title }); go(next ? "#/s/" + next : "#/"); };
    app.querySelectorAll("input[data-chk]").forEach(el => {
      el.checked = !!S.checks[el.dataset.chk];
      el.onchange = () => { S.checks[el.dataset.chk] = el.checked; save(); };
    });
    app.querySelectorAll(".prose a.zoom").forEach(a => a.onclick = e => {
      e.preventDefault();
      const lb = document.createElement("div"); lb.className = "lightbox"; lb.innerHTML = `<img src="${a.getAttribute("href")}" alt="">`;
      lb.onclick = () => lb.remove(); document.addEventListener("keydown", function k(ev) { if (ev.key === "Escape") { lb.remove(); document.removeEventListener("keydown", k); } });
      document.body.appendChild(lb);
    });
  }

  /* ───────── проміжний тест ───────── */
  let QZ = null;
  function renderQuiz(slug) {
    const sec = ONB.sections[slug];
    if (!QZ || QZ.slug !== slug) QZ = { slug, pos: 0, ok: 0, pick: null, perm: null };
    if (QZ.pos >= sec.quiz.length) {
      const total = sec.quiz.length, score = QZ.ok;
      app.innerHTML = `<div class="wrap-narrow"><section class="card stack">
        <p class="eyebrow">Проміжний тест · ${esc(sec.title)}</p>
        <div class="score">${score}/${total}</div>
        <p class="lead">${score === total ? "Чудово, усе правильно!" : "Непогано! Перечитай розділ там, де були помилки, — це знадобиться у фінальному тестуванні."}</p>
        <div class="row"><a class="btn" href="#/s/${slug}">Повернутися до розділу</a><button class="btn ghost" id="again">Пройти ще раз</button></div>
      </section></div>`;
      if (!QZ.saved) { QZ.saved = true; S.quizzes[slug] = { score, total, at: new Date().toISOString() }; save(); send("quiz", { section: slug, title: sec.title, score, total }); }
      document.getElementById("again").onclick = () => { QZ = null; renderQuiz(slug); };
      return;
    }
    const q = sec.quiz[QZ.pos];
    if (!QZ.perm) QZ.perm = shuffle(q.o.length);
    const picked = QZ.pick !== null;
    app.innerHTML = `<div class="wrap-narrow"><section class="card stack">
      <div class="rail">${sec.quiz.map((_, i) => `<div class="seg"><span style="width:${i < QZ.pos || (i === QZ.pos && picked) ? 100 : 0}%"></span></div>`).join("")}</div>
      <div class="qmeta"><span class="blocktag">${tile(sec.icon, sec.color, 34)}${esc(sec.title)}</span><span class="count">${QZ.pos + 1} / ${sec.quiz.length}</span></div>
      <span class="badge c-yellow">Проміжний тест · необов’язковий</span>
      ${q.t ? `<p class="eyebrow">${esc(q.t)}</p>` : ""}
      <p class="qtext">${esc(q.q)}</p>
      <div class="opts">${QZ.perm.map((oi, p) => {
        let c = "opt"; if (picked) { if (oi === q.a) c += " right"; else if (oi === QZ.pick) c += " wrong"; else c += " dim"; }
        return `<button class="${c}" data-oi="${oi}" ${picked ? "disabled" : ""}><span class="k">${LET[p]}</span><span>${esc(q.o[oi])}</span></button>`;
      }).join("")}</div>
      ${picked ? `<div class="fb ${QZ.pick === q.a ? "ok" : "no"}"><span class="v">${QZ.pick === q.a ? "Правильно" : "Не зовсім"}</span>${QZ.pick === q.a ? "" : `<span>Правильна відповідь: <b>${esc(q.o[q.a])}</b></span>`}${q.e ? `<span>${esc(q.e)}</span>` : ""}</div>
        <button class="btn" id="qnext">${QZ.pos === sec.quiz.length - 1 ? "Завершити" : "Наступне питання"}</button>` : `<a href="#/s/${slug}" class="muted" style="font-size:14px">← Повернутися до розділу</a>`}
    </section></div>`;
    app.querySelectorAll(".opt").forEach(b => b.onclick = () => { if (QZ.pick !== null) return; QZ.pick = +b.dataset.oi; if (QZ.pick === q.a) QZ.ok++; renderQuiz(slug); });
    const n = document.getElementById("qnext"); if (n) n.onclick = () => { QZ.pos++; QZ.pick = null; QZ.perm = null; renderQuiz(slug); window.scrollTo(0, 0); };
  }

  /* ───────── фінальне тестування ───────── */
  function freshFinal() { return { phase: "intro", pos: 0, first: {}, queue: [], rpos: 0, checks: {}, cur: null, confirmReset: false, finishedAt: null }; }
  const ORDER = () => { const T = test(); return T.blocks.flatMap(b => T.questions.map((q, i) => [q, i]).filter(([q]) => q.b === b.id).map(([, i]) => i)); };
  function blockStats() {
    const T = test(), F = S.final, O = ORDER();
    return T.blocks.map(b => { const ids = O.filter(qi => T.questions[qi].b === b.id); const ok = ids.filter(qi => F.first[qi] === true).length; return { b, ok, total: ids.length }; }).filter(s => s.total);
  }
  function weakBlocks() { return blockStats().filter(s => s.ok < s.total).map(s => s.b); }

  function renderFinal() {
    if (!allRead()) {
      app.innerHTML = `<div class="wrap-narrow"><section class="card stack" style="align-items:flex-start">${tile("lock", "lilac", 64)}<h2 class="h2">Фінальне тестування поки закрите</h2><p class="lead">Спершу познач прочитаними всі розділи. Залишилось: ${trackSections().length - readCount()}.</p><a class="btn" href="#/">До розділів</a></section></div>`;
      return;
    }
    if (!S.final) S.final = freshFinal();
    const F = S.final, T = test(), O = ORDER(), B = Object.fromEntries(T.blocks.map(b => [b.id, b]));
    const curQi = () => F.phase === "main" ? O[F.pos] : F.queue[F.rpos];
    const persist = () => save();

    if (F.phase === "intro") {
      app.innerHTML = `<div class="wrap-narrow stack">
        <section class="card stack">
          <div class="row">${T.blocks.map(b => tile(b.icon, b.color, 44)).join("")}</div>
          <p class="eyebrow">Фінальне тестування · обов’язкове</p>
          <h1 class="h2">${esc(T.title)}</h1>
          <p class="lead">Тест перевіряє, чи ти готовий до роботи: ситуації, з якими стикаєшся в перші тижні. Після кожної відповіді побачиш пояснення й розділ, де про це написано.</p>
          <div class="rules">
            <div class="rule"><b>${T.questions.length}</b><span>питань у ${T.blocks.length} блоках</span></div>
            <div class="rule"><b>100%</b><span>для допуску: помилки повертаються в «Роботі над помилками», доки не відповіси правильно</span></div>
            <div class="rule"><b>${T.checklist.length}</b><span>пунктів чек-листа доступів наприкінці</span></div>
          </div>
          <p class="muted">Займе близько 10–15 хвилин. Прогрес зберігається: можна зробити паузу й повернутися.</p>
          <button class="btn" id="start">Почати тест ${px("arrow", 16)}</button>
        </section></div>`;
      document.getElementById("start").onclick = () => { F.phase = "main"; persist(); send("final_start"); renderFinal(); };
      return;
    }
    if (F.phase === "main" || F.phase === "review") {
      const qi = curQi();
      if (!F.cur || F.cur.qi !== qi) F.cur = { qi, perm: shuffle(T.questions[qi].o.length), pick: null };
      const q = T.questions[qi], b = B[q.b], picked = F.cur.pick !== null;
      const counter = F.phase === "main" ? `${F.pos + 1} / ${O.length}` : `${F.rpos + 1} / ${F.queue.length}`;
      const rail = F.phase === "review" ? `<div class="rail"><div class="seg"><span style="width:${Math.round(F.rpos / F.queue.length * 100)}%"></span></div></div>` :
        `<div class="rail">${T.blocks.map(bb => { const ids = O.filter(x => T.questions[x].b === bb.id); if (!ids.length) return ""; const a = ids.filter(x => x in F.first).length; return `<div class="seg" title="${esc(bb.title)}"><span style="width:${Math.round(a / ids.length * 100)}%"></span></div>`; }).join("")}</div>`;
      const last = F.phase === "main" ? F.pos === O.length - 1 : F.rpos === F.queue.length - 1;
      app.innerHTML = `<div class="wrap-narrow"><section class="card stack">
        ${rail}
        <div class="qmeta"><span class="blocktag">${tile(b.icon, b.color, 34)}${esc(b.title)}</span><span class="count">${counter}</span></div>
        ${F.phase === "review" ? `<span class="badge c-pink">Робота над помилками</span>` : ""}
        <p class="qtext">${esc(q.q)}</p>
        <div class="opts">${F.cur.perm.map((oi, p) => {
          let c = "opt"; if (picked) { if (oi === 0) c += " right"; else if (oi === F.cur.pick) c += " wrong"; else c += " dim"; }
          return `<button class="${c}" data-oi="${oi}" ${picked ? "disabled" : ""}><span class="k">${LET[p]}</span><span>${esc(q.o[oi])}</span></button>`;
        }).join("")}</div>
        ${picked ? `<div class="fb ${F.cur.pick === 0 ? "ok" : "no"}" role="status"><span class="v">${F.cur.pick === 0 ? "Правильно" : "Не зовсім"}</span>
          ${F.cur.pick === 0 ? "" : `<span>Правильна відповідь: <b>${esc(q.o[0])}</b></span>`}<span>${esc(q.e)}</span><span class="src">Де прочитати: <b>${esc(q.s)}</b></span></div>
          <button class="btn" id="fnext">${last ? "Далі" : "Наступне питання"}</button>` : ""}
      </section></div>`;
      app.querySelectorAll(".opt").forEach(el => el.onclick = () => {
        if (F.cur.pick !== null) return;
        F.cur.pick = +el.dataset.oi; const ok = F.cur.pick === 0;
        if (F.phase === "main") F.first[qi] = ok; else if (!ok) F.queue.push(qi);
        persist(); renderFinal();
      });
      const nx = document.getElementById("fnext");
      if (nx) { nx.focus({ preventScroll: true }); nx.onclick = () => {
        F.cur = null;
        if (F.phase === "main") { F.pos++; if (F.pos >= O.length) { const wrong = O.filter(x => F.first[x] === false); if (wrong.length) { F.queue = wrong; F.rpos = 0; F.phase = "reviewIntro"; } else F.phase = "check"; } }
        else { F.rpos++; if (F.rpos >= F.queue.length) F.phase = "check"; }
        persist(); renderFinal(); window.scrollTo(0, 0);
      }; }
      return;
    }
    if (F.phase === "reviewIntro") {
      const n = F.queue.length;
      app.innerHTML = `<div class="wrap-narrow"><section class="card stack">
        <span class="badge c-pink">Робота над помилками</span>
        <h2 class="h2">Основну частину пройдено. Залишилось ${n} ${plural(n, "питання", "питання", "питань")}</h2>
        <p class="lead">Зараз повернуться питання, де була помилка, з перемішаними варіантами. Якщо знову помилишся — питання повториться в кінці. Для допуску всі відповіді мають бути правильними.</p>
        <p class="muted">Порада: перш ніж продовжити, відкрий розділи з блоків, де були помилки:</p>
        <ul>${weakBlocks().map(b => `<li>${esc(b.title)} — «${esc(b.src)}»</li>`).join("")}</ul>
        <button class="btn" id="go">Почати роботу над помилками</button>
      </section></div>`;
      document.getElementById("go").onclick = () => { F.phase = "review"; F.rpos = 0; persist(); renderFinal(); };
      return;
    }
    if (F.phase === "check") {
      const all = T.checklist.every(c => F.checks[c.id]);
      app.innerHTML = `<div class="wrap-narrow"><section class="card stack">
        <p class="eyebrow">Останній крок</p><h2 class="h2">Чек-лист доступів</h2>
        <p class="lead">Знання — половина готовності. Друга половина — доступи й техніка. Відміть лише те, що вже перевірив сам. Чогось бракує — напиши керівнику й повернись сюди.</p>
        <div class="checks">${T.checklist.map(c => `<label class="check" for="${c.id}"><input type="checkbox" id="${c.id}" ${F.checks[c.id] ? "checked" : ""}><span>${esc(c.t)}</span></label>`).join("")}</div>
        <p class="count" id="cc">${T.checklist.filter(c => F.checks[c.id]).length} з ${T.checklist.length}</p>
        <button class="btn" id="finish" ${all ? "" : "disabled"}>Завершити тест</button>
      </section></div>`;
      T.checklist.forEach(c => document.getElementById(c.id).onchange = e => {
        F.checks[c.id] = e.target.checked; persist();
        const n = T.checklist.filter(x => F.checks[x.id]).length;
        document.getElementById("cc").textContent = `${n} з ${T.checklist.length}`;
        document.getElementById("finish").disabled = n !== T.checklist.length;
      });
      document.getElementById("finish").onclick = () => {
        F.phase = "done"; F.finishedAt = new Date().toISOString(); persist();
        const st = blockStats();
        send("final_done", { firstOk: Object.values(F.first).filter(Boolean).length, total: O.length, blocks: st.map(s => ({ block: s.b.title, ok: s.ok, total: s.total })) });
        renderFinal(); window.scrollTo(0, 0);
      };
      return;
    }
    // done
    const firstOk = O.filter(x => F.first[x] === true).length, pct = Math.round(firstOk / O.length * 100), weak = weakBlocks();
    app.innerHTML = `<div class="wrap-narrow stack">
      <section class="card stack">
        <div class="row">${tile("check", "green", 84, 46)}<div><p class="eyebrow">Тестування пройдено · ${esc(fmtDate(F.finishedAt))}</p><h2 class="h2">${esc(S.user.name)}, ти готовий до роботи</h2></div></div>
        <p class="lead">Усі ${O.length} питань розібрано правильно, чек-лист доступів завершено. Результат уже надіслано керівнику.</p>
        <div><div class="score">${pct}%</div><p class="muted">з першої спроби · ${firstOk} з ${O.length}</p></div>
      </section>
      <section class="card stack">
        <h3>Результат першої спроби по блоках</h3>
        <div class="bars">${blockStats().map(s => `<div class="bar"><span>${esc(s.b.title)}</span><span>${s.ok}/${s.total}</span><div class="track2"><div class="fill c-${s.b.color}" style="width:${Math.round(s.ok / s.total * 100)}%"></div></div></div>`).join("")}</div>
        ${weak.length ? `<div class="confirm"><b>Перед стартом роботи перечитай:</b><ul style="margin:0">${weak.map(b => `<li>«${esc(b.src)}»</li>`).join("")}</ul></div>` : `<p class="muted">Жодної помилки з першої спроби — чудова підготовка.</p>`}
      </section>
      <section class="card">${F.confirmReset ? `<div class="confirm"><b>Пройти тест заново?</b><span class="muted">Попередній результат залишиться в звіті керівника, новий його оновить.</span><div class="row"><button class="btn" id="yes">Так, почати заново</button><button class="btn ghost" id="no">Скасувати</button></div></div>` : `<div class="row"><a class="btn" href="#/">До розділів</a><button class="btn ghost" id="reset">Пройти тест ще раз</button></div>`}</section>
    </div>`;
    const r = document.getElementById("reset"); if (r) r.onclick = () => { F.confirmReset = true; renderFinal(); };
    const y = document.getElementById("yes"); if (y) y.onclick = () => { S.final = freshFinal(); S.final.phase = "main"; persist(); send("final_restart"); renderFinal(); };
    const no = document.getElementById("no"); if (no) no.onclick = () => { F.confirmReset = false; renderFinal(); };
  }

  /* ───────── звіт керівника ───────── */
  let REP = { rows: null, q: "", track: "", status: "", sort: "lastActivity", dir: -1, err: "" };
  async function loadReport(key) {
    const r = await fetch(CFG.APPS_SCRIPT_URL + "?action=report&key=" + encodeURIComponent(key));
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || "Невірний ключ");
    return d.rows;
  }
  function renderReport() {
    if (!CFG.APPS_SCRIPT_URL) {
      app.innerHTML = `<div class="wrap-narrow"><section class="card stack">${tile("chart", "lilac", 64)}<h1 class="h2">Звіт керівника</h1><p class="notice">Звіт ще не підключено. Розгорніть Google Apps Script і вставте його адресу в файл <code>assets/js/config.js</code> — покроково в README.</p></section></div>`;
      return;
    }
    let key = ""; try { key = sessionStorage.getItem("goit-onb-key") || ""; } catch (e) {}
    if (!REP.rows) {
      app.innerHTML = `<div class="wrap-narrow"><section class="card stack">${tile("chart", "lilac", 64)}<h1 class="h2">Звіт керівника</h1>
        <form class="form" id="kf"><label class="field" for="key">Ключ доступу<input id="key" type="password" autocomplete="current-password" value="${esc(key)}"></label>
        ${REP.err ? `<span class="err" style="color:var(--bad);font-weight:600">${esc(REP.err)}</span>` : ""}
        <button class="btn" type="submit">Відкрити звіт</button></form>
        ${CFG.REPORT_SHEET_URL ? `<p class="muted">Повні дані також у <a href="${esc(CFG.REPORT_SHEET_URL)}" target="_blank" rel="noopener">Google Таблиці</a>.</p>` : ""}</section></div>`;
      document.getElementById("kf").onsubmit = async e => {
        e.preventDefault(); const k = document.getElementById("key").value.trim(); const b = e.target.querySelector("button"); b.disabled = true; b.textContent = "Завантажуємо…";
        try { REP.rows = await loadReport(k); REP.err = ""; try { sessionStorage.setItem("goit-onb-key", k); } catch (er) {} } catch (er) { REP.err = "Не вдалося відкрити звіт: " + er.message; }
        renderReport();
      };
      return;
    }
    const rows = REP.rows;
    const tracks = [...new Set(rows.map(r => r.trackTitle).filter(Boolean))];
    const f = rows.filter(r => (!REP.track || r.trackTitle === REP.track) && (!REP.status || r.finalStatus === REP.status) &&
      (!REP.q || (r.name + " " + r.email).toLowerCase().includes(REP.q.toLowerCase())))
      .sort((a, b) => { const x = a[REP.sort] ?? "", y = b[REP.sort] ?? ""; return (x > y ? 1 : x < y ? -1 : 0) * REP.dir; });
    const cnt = s => rows.filter(r => r.finalStatus === s).length;
    const cols = [["name", "Працівник"], ["trackTitle", "Роль"], ["registeredAt", "Реєстрація"], ["sectionsDone", "Розділи"], ["quizPct", "Проміжні тести"], ["finalStatus", "Фінальний тест"], ["finalFirstPct", "З 1-ї спроби"], ["finalDoneAt", "Пройдено"], ["weakBlocks", "Слабкі блоки"], ["lastActivity", "Остання активність"]];
    const d = v => v ? new Date(v).toLocaleDateString("uk-UA") : "—";
    const chip = s => `<span class="chip ${s === "пройдено" ? "done" : s === "в процесі" ? "quiz" : ""}">${esc(s || "не почато")}</span>`;
    app.innerHTML = `<div class="stack">
      <div class="row" style="justify-content:space-between"><div><p class="eyebrow">Звіт керівника</p><h1 class="h2" style="margin-top:6px">Онбординг команди</h1></div>
        <div class="row"><button class="btn ghost small" id="csv">Експорт CSV</button><button class="btn small" id="refresh">Оновити</button></div></div>
      <div class="tiles4">
        <div class="stat"><span class="muted">Зареєстровано</span><b>${rows.length}</b></div>
        <div class="stat c-yellow"><span>Проходять онбординг</span><b>${rows.length - cnt("пройдено")}</b></div>
        <div class="stat c-green"><span>Пройшли фінальний тест</span><b>${cnt("пройдено")}</b></div>
        <div class="stat"><span class="muted">Середній результат з 1-ї спроби</span><b>${(() => { const v = rows.filter(r => r.finalFirstPct !== "" && r.finalFirstPct != null).map(r => +r.finalFirstPct); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) + "%" : "—"; })()}</b></div>
      </div>
      <div class="filters">
        <input id="fq" type="search" placeholder="Пошук за ім’ям або поштою" value="${esc(REP.q)}">
        <select id="ft"><option value="">Усі ролі</option>${tracks.map(t => `<option ${t === REP.track ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>
        <select id="fs"><option value="">Усі статуси тесту</option>${["не почато", "в процесі", "пройдено"].map(s => `<option ${s === REP.status ? "selected" : ""}>${s}</option>`).join("")}</select>
        <span class="muted" style="font-weight:600">${f.length} з ${rows.length}</span>
      </div>
      <div class="rtable-wrap"><table class="rtable"><thead><tr>${cols.map(([k, t]) => `<th data-k="${k}">${t}${REP.sort === k ? (REP.dir > 0 ? " ↑" : " ↓") : ""}</th>`).join("")}</tr></thead><tbody>
      ${f.map(r => { const p = r.sectionsTotal ? Math.round(r.sectionsDone / r.sectionsTotal * 100) : 0; return `<tr>
        <td><b>${esc(r.name)}</b><br><span class="muted">${esc(r.email)}</span></td><td>${esc(r.trackTitle)}</td><td class="num">${d(r.registeredAt)}</td>
        <td class="num"><span class="mini"><span style="width:${p}%"></span></span>${r.sectionsDone}/${r.sectionsTotal}</td>
        <td class="num">${r.quizzesDone ? `${r.quizPct}% · ${r.quizzesDone} ${plural(+r.quizzesDone, "тест", "тести", "тестів")}` : "—"}</td>
        <td>${chip(r.finalStatus)}</td><td class="num">${r.finalFirstPct !== "" && r.finalFirstPct != null ? r.finalFirstPct + "%" : "—"}</td><td class="num">${d(r.finalDoneAt)}</td>
        <td style="white-space:normal;min-width:180px">${esc(r.weakBlocks || "—")}</td><td class="num">${d(r.lastActivity)}</td></tr>`; }).join("") || `<tr><td colspan="${cols.length}" class="muted">Нікого не знайдено</td></tr>`}
      </tbody></table></div>
      ${CFG.REPORT_SHEET_URL ? `<p class="muted">Повні дані й журнал подій — у <a href="${esc(CFG.REPORT_SHEET_URL)}" target="_blank" rel="noopener">Google Таблиці</a>.</p>` : ""}
    </div>`;
    document.getElementById("fq").oninput = e => { REP.q = e.target.value; const pos = e.target.selectionStart; renderReport(); const el = document.getElementById("fq"); el.focus(); el.setSelectionRange(pos, pos); };
    document.getElementById("ft").onchange = e => { REP.track = e.target.value; renderReport(); };
    document.getElementById("fs").onchange = e => { REP.status = e.target.value; renderReport(); };
    app.querySelectorAll("th[data-k]").forEach(th => th.onclick = () => { const k = th.dataset.k; REP.dir = REP.sort === k ? -REP.dir : 1; REP.sort = k; renderReport(); });
    document.getElementById("refresh").onclick = async () => { try { REP.rows = await loadReport(sessionStorage.getItem("goit-onb-key") || ""); } catch (e) { REP.rows = null; REP.err = "Сесію завершено, введи ключ ще раз"; } renderReport(); };
    document.getElementById("csv").onclick = () => {
      const head = ["ПІ", "Пошта", "Роль", "Реєстрація", "Розділи", "Всього розділів", "Проміжні тести %", "Статус фінального тесту", "З 1-ї спроби %", "Дата проходження", "Слабкі блоки", "Остання активність"];
      const lines = [head].concat(f.map(r => [r.name, r.email, r.trackTitle, r.registeredAt, r.sectionsDone, r.sectionsTotal, r.quizPct, r.finalStatus, r.finalFirstPct, r.finalDoneAt, r.weakBlocks, r.lastActivity]));
      const csv = "﻿" + lines.map(l => l.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = "onboarding-report.csv"; a.click();
    };
  }

  flush();
  route();
})();
