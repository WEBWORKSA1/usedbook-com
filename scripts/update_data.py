"""Refresh auto-updated data for UsedBook.com (run weekly by GitHub Actions).

Fetches Open Library's weekly trending works and writes _data/trending.json,
then stamps _data/updated.yml. Keeps the previous data if the fetch fails.
"""
import datetime
import json
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
UA = "UsedBookDataUpdater/1.0 (+https://usedbook.com/contact/)"
NOW = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)


def trending():
    data = get_json("https://openlibrary.org/trending/weekly.json?limit=40")
    works = []
    for w in data.get("works", []):
        if not w.get("title") or not w.get("cover_i") or not w.get("key"):
            continue
        works.append({
            "key": w["key"],
            "title": w["title"],
            "author_name": (w.get("author_name") or [])[:2],
            "first_publish_year": w.get("first_publish_year"),
            "cover_i": w["cover_i"],
            "edition_count": w.get("edition_count"),
        })
        if len(works) >= 12:
            break
    return works


def main():
    out = ROOT / "_data" / "trending.json"
    try:
        works = trending()
        if works:
            out.write_text(json.dumps({"updated": NOW, "source": "Open Library weekly trending", "works": works}, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
            print(f"Trending updated: {len(works)} works")
        else:
            print("Trending returned no usable works; keeping previous data")
    except Exception as exc:  # network or parse problems should not fail the build
        print("Trending fetch failed:", exc)
    (ROOT / "_data" / "updated.yml").write_text(f'last_auto_update: "{NOW}"\n', encoding="utf-8")


if __name__ == "__main__":
    main()
