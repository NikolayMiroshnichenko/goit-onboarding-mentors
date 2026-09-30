#!/usr/bin/env python3
"""Збирає контент онбордингу з експорту Notion у дані для сайту."""
import os, re, json, glob, shutil, html
from urllib.parse import unquote
import markdown
from PIL import Image

# Запуск з кореня сайту: python3 _build/build.py
# Експорт Notion розпакуйте поруч із папкою сайту: ../site_src/Private & Shared/онбординг/…
# Стиснуті відео покладіть у ../vid/ (lms-tutor.mp4, salary.mp4) або закоментуйте копіювання відео нижче.
S = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(S, "site_src", "Private & Shared")
SEC_DIR = os.path.join(SRC, "онбординг")
OUT = os.path.join(S, "goit-onboarding")
IMG_OUT = os.path.join(OUT, "assets", "img")
VID_OUT = os.path.join(OUT, "assets", "video")

# slug, префікс файлу, група, іконка, колір
SECTIONS = [
    ("about", "Про компанію", "general", "building", "blue"),
    ("product", "Продукт і навчання", "general", "book", "yellow"),
    ("benefits", "Бенефіти", "general", "gift", "pink"),
    ("team", "Знайомство з командою", "general", "people", "green"),
    ("salary", "Salary", "general", "coin", "yellow"),
    ("tools", "Допоміжні інструменти для роботи", "general", "wrench", "lilac"),
    ("mentor-who", "Хто такий ментор у GoIT", "mentor", "person", "blue"),
    ("mentor-lms", "LMS-платформа та перевірка ДЗ", "mentor", "screen", "yellow"),
    ("mentor-feedback", "Перевірка ДЗ і формування фідбеку", "mentor", "check", "green"),
    ("mentor-chat", "Комунікація ментора в чатах", "mentor", "chat", "pink"),
    ("slack", "Slack", "mentor", "hash", "lilac"),
    ("telegram", "Telegram", "mentor", "plane", "blue"),
    ("mentor-moderation", "Технічна модерація ментора", "mentor", "mega", "yellow"),
    ("mentor-kpi", "Mentor KPI", "mentor", "star", "green"),
    ("mentor-codex", "Кодекс і робочий ритм ментора", "mentor", "compass", "pink"),
    ("tutor-who", "Хто такий тьютор в GoIT", "tutor", "person", "blue"),
    ("tutor-codex", "Кодекс та робочий ритм тьютора", "tutor", "cal", "yellow"),
    ("tutor-standards", "Загальні стандарти проведення занять", "tutor", "chat", "pink"),
    ("tutor-guide", "Мінігайд тьютора як проводити ефективні заняття", "tutor", "play", "green"),
    ("tutor-schedule", "Розклад, процеси та форс-мажори", "tutor", "clock", "lilac"),
    ("tutor-lms", "LMS-платформа для тьютора і для студента", "tutor", "screen", "blue"),
    ("tutor-kpi", "Tutor KPI", "tutor", "star", "yellow"),
]
GENERAL = [s[0] for s in SECTIONS if s[2] == "general"]
TRACKS = {
    "slack": {"title": "Ментор у Slack", "short": "Ментор · Slack", "icon": "hash", "color": "lilac",
              "sections": GENERAL + ["mentor-who", "mentor-lms", "mentor-feedback", "mentor-chat", "slack",
                                     "mentor-moderation", "mentor-kpi", "mentor-codex"]},
    "telegram": {"title": "Ментор у Telegram", "short": "Ментор · Telegram", "icon": "plane", "color": "blue",
                 "sections": GENERAL + ["mentor-who", "mentor-lms", "mentor-feedback", "mentor-chat", "telegram",
                                        "mentor-moderation", "mentor-kpi", "mentor-codex"]},
    "tutor": {"title": "Тьютор", "short": "Тьютор", "icon": "play", "color": "green",
              "sections": GENERAL + ["tutor-who", "tutor-codex", "tutor-standards", "tutor-guide",
                                     "tutor-schedule", "tutor-lms", "tutor-kpi"]},
}
VIDEO_MAP = {".mov": "lms-tutor.mp4", ".mp4": "salary.mp4"}  # за розширенням оригіналу
YT = re.compile(r"(?:youtu\.be/|youtube\.com/watch\?v=)([A-Za-z0-9_-]{11})")

def find_file(prefix):
    c = [f for f in glob.glob(os.path.join(SEC_DIR, "*.md")) if os.path.basename(f).startswith(prefix)]
    assert len(c) == 1, (prefix, c)
    return c[0]

# ───────────────────────── квізи ─────────────────────────
ANS = re.compile(r"Правильн[а-яіїєґ’']*(?:\s+відповідь)?\s*\**\s*:\s*\**\s*([A-DА-Г1-4])")
QUIZ_START = [re.compile(p, re.M) for p in [
    r"^## Квіз для самоперевірки\s*$", r"^## Тест\s*$", r"^\*\*Тест 1\b", r"^### 1\. ", r"^\*\*1\.\*\*"]]
KEYMAP = {**{k: i for i, k in enumerate("ABCD")}, **{k: i for i, k in enumerate("АБВГ")}, **{k: i for i, k in enumerate("1234")}}

def strip_md(s):
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", s)
    s = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"\1", s)
    s = re.sub(r"`([^`]+)`", r"\1", s)
    return s.strip()

def parse_quiz(region):
    lines = region.split("\n")
    chunks, cur = [], []
    for ln in lines:
        m = ANS.search(ln)
        if m:
            chunks.append((cur, m.group(1))); cur = []
        else:
            cur.append(ln)
    out = []
    for body, key in chunks:
        body = [l.strip() for l in body if l.strip() and l.strip() not in ("---", "## Квіз для самоперевірки", "## Тест")]
        title, qtext, opts = "", [], []
        for l in body:
            mt = re.match(r"^\*\*Тест \d+\.?\s*(.*?)\*\*$", l)
            if mt: title = mt.group(1); continue
            mh = re.match(r"^###\s*\d+\.\s*(.*)$", l)
            if mh: qtext.append(mh.group(1)); continue
            if re.search(r"(?:^|\s)[АA][\.\)]\s.+\s[БB][\.\)]\s", l):
                parts = re.split(r"(?:^|\s)[АБВГABCD][\.\)]\s+", l)
                parts = [p for p in parts if p.strip()]
                opts.extend(parts); continue
            mo = re.match(r"^(?:\*\*)?([A-DА-Г1-4])[\.\)](?:\*\*)?\s+(.*)$", l)
            if mo and (opts or qtext):
                opts.append(mo.group(2)); continue
            ml = re.match(r"^\*\*\d+\.\*\*\s*(.*)$", l)
            if ml: qtext.append(ml.group(1)); continue
            qtext.append(l)
        a = KEYMAP[key]
        assert 2 <= len(opts) <= 4 and a < len(opts), (title, qtext, opts, key)
        out.append({"t": strip_md(title), "q": strip_md(" ".join(qtext)), "o": [strip_md(o) for o in opts], "a": a})
    return out


BOLD_START = re.compile(r"^## (Перевір себе|Квіз для самоперевірки)\s*$", re.M)

def parse_bold(region):
    """Формат, де правильний варіант виділено **жирним**; пояснення — у блоці «Відповіді»."""
    expl = {}
    m = re.search(r"^###\s*Відповіді\s*$(.*)", region, re.M | re.S)
    if m:
        for mm in re.finditer(r"^(\d+)\.\s*\*\*[A-Da-dА-Г]\*\*\s*[—-]\s*(.+)$", m.group(1), re.M):
            t = strip_md(mm.group(2)); expl[int(mm.group(1))] = t[:1].upper() + t[1:]
        region = region[:m.start()]
    region = re.sub(r"^\*\*Відповіді:?\*\*.*$", "", region, flags=re.M)
    qs, cur = [], None
    for raw in region.split("\n"):
        l = raw.strip()
        if not l or l.startswith("## "): continue
        mq = re.match(r"^\*\*Питання\s+(\d+)\.\*\*\s*(.+)$", l) or (re.match(r"^(\d+)\.\s+(.+)$", l) if not raw.startswith((" ", "\t")) else None)
        if mq and not re.search(r"\s[b-dB-D]\)\s", l):
            cur = {"n": int(mq.group(1)), "q": mq.group(2), "o": []}; qs.append(cur); continue
        if cur is None: continue
        # варіанти в один рядок: "1. 10% b) 20% c) **70%** d) 50%"
        if re.search(r"\s[b-dB-D]\)\s", l):
            l2 = re.sub(r"^(\d+\.|[a-dA-D]\))\s*", "", l)
            cur["o"].extend(p.strip() for p in re.split(r"\s+[b-dB-D]\)\s+", l2) if p.strip()); continue
        mo = re.match(r"^(?:[-*]\s+)?(\*\*)?([a-dA-DА-Г])[\.\)]\s*(.+?)$", l)
        if mo:
            txt = (mo.group(1) or "") + mo.group(3)
            cur["o"].append(txt); continue
    out = []
    for q in qs:
        opts = q["o"]
        bold = [i for i, o in enumerate(opts) if "**" in o]
        assert len(opts) in (3, 4) and len(bold) == 1, (q, opts)
        out.append({"t": "", "q": strip_md(q["q"]), "o": [strip_md(o.replace("**", "")) for o in opts], "a": bold[0],
                    **({"e": expl[q["n"]]} if q["n"] in expl else {})})
    return out

def split_quiz(md):
    first_ans = ANS.search(md)
    if not first_ans:
        mb = BOLD_START.search(md)
        if not mb: return md, []
        head = re.sub(r"(\n---\s*)+$", "", md[:mb.start()].rstrip())
        return head, parse_bold(md[mb.start():])
    starts = [m.start() for p in QUIZ_START for m in p.finditer(md) if m.start() < first_ans.start()]
    if not starts: return md, []
    st = max(starts)
    # якщо перед цим маркером іде заголовок «Квіз…»/«Тест» — починаємо з нього
    hdr = [m.start() for p in QUIZ_START[:2] for m in p.finditer(md) if m.start() <= st]
    if hdr and st - max(hdr) < 400: st = max(hdr)
    region = md[st:]
    if not ANS.search(region): return md, []
    head = md[:st].rstrip()
    head = re.sub(r"(\n---\s*)+$", "", head)
    return head, parse_quiz(region)

# ───────────────────────── медіа ─────────────────────────
img_counter = {}
def convert_image(src_path, slug):
    os.makedirs(os.path.join(IMG_OUT, slug), exist_ok=True)
    n = img_counter.get(slug, 0) + 1; img_counter[slug] = n
    rel = f"assets/img/{slug}/{n:02d}.webp"
    im = Image.open(src_path)
    im = im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") else im.convert("RGB")
    if im.width > 1800:
        im = im.resize((1800, round(im.height * 1800 / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, rel), "WEBP", quality=82, method=6)
    return rel, im.width, im.height

GENERIC_ALT = re.compile(r"^(image( \d+)?\.png|[0-9a-f-]{20,}\.\w+|)$", re.I)

def media_tokens(md, slug, base_dir, media):
    """Замінює картинки/відео/YouTube на токени-абзаци, повертає md."""
    def img_repl(m):
        alt, path = m.group(1), m.group(2)
        full = os.path.join(base_dir, unquote(path))
        ext = os.path.splitext(full)[1].lower()
        if ext in (".mov", ".mp4"):
            media.append({"type": "video", "src": "assets/video/" + VIDEO_MAP[ext], "alt": ""})
        else:
            if not os.path.exists(full): raise FileNotFoundError(full)
            rel, w, h = convert_image(full, slug)
            media.append({"type": "img", "src": rel, "w": w, "h": h, "alt": "" if GENERIC_ALT.match(alt) else alt})
        return f"\n\n@@M{len(media)-1}@@\n\n"
    md = re.sub(r"!?\[([^\]]*)\]\(((?!https?://)(?:[^()\s]|\([^()]*\))+\.(?:png|jpe?g|gif|webp|mov|mp4))\)", img_repl, md, flags=re.I)

    # окремий рядок з посиланням на YouTube → вбудоване відео
    def yt_repl(m):
        line = m.group(0).strip()
        y = YT.search(line)
        media.append({"type": "yt", "id": y.group(1), "url": re.search(r"https?://\S+?(?=\)|$)", line).group(0)})
        return f"\n@@M{len(media)-1}@@\n"
    md = re.sub(r"^(?:\[https?://[^\]]+\]\()?https?://(?:www\.)?(?:youtu\.be/|youtube\.com/watch\?v=)[^\s)]+\)?\s*$", yt_repl, md, flags=re.M)
    return md

def caption_pass(md, media):
    """Notion дублює підпис до картинки абзацом до й після неї — перетворюємо на figcaption."""
    paras = re.split(r"\n\s*\n", md)
    out, i = [], 0
    while i < len(paras):
        p = paras[i]
        m = re.fullmatch(r"\s*@@M(\d+)@@\s*", p)
        if m and media[int(m.group(1))]["type"] in ("img", "video"):
            k = int(m.group(1)); item = media[k]
            prev = out[-1].strip() if out else ""
            nxt = paras[i + 1].strip() if i + 1 < len(paras) else ""
            plain = lambda s: len(s) < 90 and not s.startswith(("#", ">", "-", "|", "@@", "*")) and "\n" not in s
            cap = None
            if prev and prev == nxt and plain(prev):
                cap = prev; out.pop(); i += 1
            elif item.get("alt") and prev == item["alt"]:
                cap = prev; out.pop()
            elif item.get("alt") and nxt == item["alt"]:
                cap = nxt; i += 1
            elif item.get("alt"):
                cap = item["alt"]
            if cap: item["cap"] = cap
            out.append(p)
        else:
            out.append(p)
        i += 1
    return "\n\n".join(out)

def render_media(item):
    if item["type"] == "img":
        cap = f'<figcaption>{html.escape(item["cap"])}</figcaption>' if item.get("cap") else ""
        alt = html.escape(item.get("cap") or item.get("alt") or "")
        return (f'<figure class="media"><a href="{item["src"]}" target="_blank" rel="noopener" class="zoom">'
                f'<img src="{item["src"]}" alt="{alt}" loading="lazy" width="{item["w"]}" height="{item["h"]}"></a>{cap}</figure>')
    if item["type"] == "video":
        cap = f'<figcaption>{html.escape(item["cap"])}</figcaption>' if item.get("cap") else ""
        return f'<figure class="media"><video src="{item["src"]}" controls preload="metadata" playsinline></video>{cap}</figure>'
    if item["type"] == "yt":
        return (f'<figure class="media yt"><div class="yt-frame"><iframe src="https://www.youtube-nocookie.com/embed/{item["id"]}" '
                f'title="Відео YouTube" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>'
                f'<figcaption><a href="{html.escape(item["url"])}" target="_blank" rel="noopener">Відкрити на YouTube</a></figcaption></figure>')

# ───────────────────────── секція ─────────────────────────
def build_section(slug, prefix):
    path = find_file(prefix)
    md = open(path, encoding="utf-8").read().replace("\r\n", "\n")
    lines = md.split("\n")
    title = lines[0].lstrip("# ").strip()
    body = "\n".join(lines[1:]).lstrip("\n")
    if body.startswith("# "):  # дубль заголовка з Notion
        first, _, rest = body.partition("\n")
        body = rest.lstrip("\n")
    body, quiz = split_quiz(body)
    media = []
    body = media_tokens(body, slug, os.path.dirname(path), media)
    body = caption_pass(body, media)
    # Notion: рядки в цитаті без ">" — ліниве продовження; ок для markdown
    h = markdown.markdown(body, extensions=["tables", "sane_lists", "fenced_code", "nl2br"], output_format="html")
    h = re.sub(r"<p>\s*@@M(\d+)@@\s*</p>", lambda m: render_media(media[int(m.group(1))]), h)
    h = re.sub(r"@@M(\d+)@@", lambda m: render_media(media[int(m.group(1))]), h)
    # чек-листи
    cid = [0]
    def chk(m):
        cid[0] += 1
        return f'<li class="todo"><label><input type="checkbox" data-chk="{slug}-{cid[0]}"><span>{m.group(3).strip()}</span></label></li>'
    h = re.sub(r"<li>(<p>)?\s*\[( |x)\]\s*(.*?)(</p>)?</li>", chk, h, flags=re.S)
    h = re.sub(r'(<ul>)(\s*<li class="todo">)', r'<ul class="todos">\2', h)
    # зовнішні посилання — у новій вкладці
    h = re.sub(r'<a href="(https?://[^"]+)"(?![^>]*target=)', r'<a href="\1" target="_blank" rel="noopener"', h)
    h = re.sub(r"<h1>", "<h2>", h).replace("</h1>", "</h2>")
    # таблиці — у прокрутний контейнер
    h = h.replace("<table>", '<div class="table-wrap"><table>').replace("</table>", "</table></div>")
    return title, h, quiz

def main():
    if os.path.exists(OUT):
        shutil.rmtree(os.path.join(OUT, "assets", "img"), ignore_errors=True)
    os.makedirs(IMG_OUT, exist_ok=True); os.makedirs(VID_OUT, exist_ok=True)
    data = {"sections": {}, "tracks": TRACKS, "groups": {
        "general": "Загальні розділи", "mentor": "Розділи ментора", "tutor": "Розділи тьютора"}}
    for slug, prefix, group, icon, color in SECTIONS:
        title, h, quiz = build_section(slug, prefix)
        title = title.replace("?", "").strip() if title.endswith("?") else title
        data["sections"][slug] = {"title": title, "group": group, "icon": icon, "color": color, "html": h, "quiz": quiz}
        print(f"{slug:18} {len(h):7d} chars  quiz={len(quiz)}  imgs={img_counter.get(slug,0)}")
    js = "window.ONB = " + json.dumps(data, ensure_ascii=False) + ";\n"
    for v in ("lms-tutor.mp4", "salary.mp4"):
        dst = os.path.join(VID_OUT, v)
        if "assets/video/" + v in js: shutil.copy(os.path.join(S, "vid", v), dst)
        elif os.path.exists(dst): os.remove(dst)
    os.makedirs(os.path.join(OUT, "assets", "js"), exist_ok=True)
    open(os.path.join(OUT, "assets", "js", "content.js"), "w", encoding="utf-8").write(js)
    print("content.js", len(js) // 1024, "KB")

if __name__ == "__main__":
    main()
