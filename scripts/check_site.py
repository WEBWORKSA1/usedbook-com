"""Post-build quality report for UsedBook.com.

Checks the built _site for: build success, AdSense code and the mandatory
contact bar on every page, page titles/descriptions/H1s, broken internal
links, required root files, and any exposed e-mail address.
"""
import pathlib
import re
import sys
from urllib.parse import urlparse, unquote

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "_site"
ADS = 'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6620975821265271'
BAR = 'Contact, if you are interested in this website/domain name/Sponsorship/Advertisement/Partnership'
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z0-9.-]*[A-Za-z]{2,}")
HREF_RE = re.compile(r'(?:href|src)="([^"#]+)')
issues, notes = [], []


def tail(path, n=60):
    p = ROOT / path
    return "\n".join(p.read_text(errors="replace").splitlines()[-n:]) if p.exists() else "(missing)"


build_log = tail("build.log")
if "BUILD_FAILED" in build_log or not SITE.exists():
    print("RESULT: BUILD FAILED\n")
    print("---- build.log (tail) ----")
    print(build_log)
    sys.exit(0)

html = sorted(SITE.rglob("*.html"))
for f in html:
    rel = "/" + str(f.relative_to(SITE))
    t = f.read_text(errors="replace")
    if rel != "/404.html" and ADS not in t:
        issues.append(f"AdSense code missing: {rel}")
    if BAR not in t:
        issues.append(f"Contact bar missing: {rel}")
    if "<title>" not in t:
        issues.append(f"No <title>: {rel}")
    if 'name="description"' not in t:
        issues.append(f"No meta description: {rel}")
    if "<h1" not in t:
        issues.append(f"No <h1>: {rel}")
    if "{{" in t or "{%" in t:
        issues.append(f"Unrendered Liquid: {rel}")
    for url in HREF_RE.findall(t):
        if url.startswith(("http:", "https:", "mailto:", "tel:", "data:", "//", "javascript:")):
            continue
        path = unquote(urlparse(url).path)
        if not path.startswith("/"):
            continue
        target = SITE / path.lstrip("/")
        ok = target.is_file() or (target / "index.html").is_file() or target.with_suffix(".html").is_file()
        if not ok:
            issues.append(f"Broken link {url} on {rel}")

for f in SITE.rglob("*"):
    if f.is_file() and f.suffix in {".html", ".js", ".css", ".xml", ".txt", ".json", ".webmanifest"}:
        for m in set(EMAIL_RE.findall(f.read_text(errors="replace"))):
            if m.endswith((".png", ".jpg", ".svg", ".js", ".css")) or "@media" in m or "@supports" in m:
                continue
            issues.append(f"E-mail-like string exposed in /{f.relative_to(SITE)}: {m[:3]}***")

for req in ["ads.txt", "robots.txt", "CNAME", "sitemap.xml", "feed.xml", "404.html", "site.webmanifest"]:
    if not (SITE / req).exists():
        issues.append(f"Missing root file: {req}")
if (SITE / "ads.txt").exists() and "pub-6620975821265271" not in (SITE / "ads.txt").read_text():
    issues.append("ads.txt does not contain the publisher id")

guides = list((SITE / "guides").glob("*/index.html"))
notes.append(f"HTML pages: {len(html)}  |  Guide pages: {len(guides)}")
print("RESULT:", "PASS" if not issues else f"{len(issues)} ISSUE(S)")
print("\n".join(notes))
for i in sorted(set(issues))[:300]:
    print(" -", i)
print("\n---- JS syntax ----")
print(tail("js.log", 20))
print("\n---- build.log (tail) ----")
print(tail("build.log", 25))
