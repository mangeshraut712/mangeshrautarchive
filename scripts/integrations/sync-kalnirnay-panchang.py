"""Refresh the public Panchang from Kalnirnay's official homepage; never infer values."""
import json
import re
import sys
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from urllib.parse import urlencode
from zoneinfo import ZoneInfo

SOURCE = "https://www.kalnirnay.com/"
OUTPUT = Path(__file__).resolve().parents[2] / "src/assets/data/kalnirnay-panchang.json"


class TextParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.hidden = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.hidden += 1

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.hidden = max(0, self.hidden - 1)

    def handle_data(self, data):
        if not self.hidden and data.strip():
            self.parts.append(data.strip())


def parse_panchang(html):
    parser = TextParser()
    parser.feed(html)
    text = "\n".join(parser.parts)
    start = text.index("Today's Panchang")
    section = text[start:]
    match = re.search(r"\b([A-Z][a-z]+ \d{1,2}, \d{4})\n([^\n]+)\nNakshatra", section)
    if not match:
        raise ValueError("Official Panchang date and tithi were not found")
    date = datetime.strptime(match[1], "%B %d, %Y").date().isoformat()
    values = {}
    for label, key in [("Nakshatra", "nakshatra"), ("Yog", "yog"), ("Karan", "karan"),
                       ("Sunrise", "sunrise"), ("Sunset", "sunset")]:
        value = re.search(r"\b" + label + r"\s*:\s*\n([^\n]+)", section[match.start():])
        if not value:
            raise ValueError(f"Official {label} was not found")
        values[key] = value[1].strip()
    for key in ("sunrise", "sunset"):
        datetime.strptime(values[key], "%I:%M %p")
    return {"source": SOURCE, "date": date, "tithi": match[2].strip(), **values}


def main():
    now = datetime.now(ZoneInfo("Asia/Kolkata"))
    # A dated cache key and no-cache request avoid reusing yesterday's CDN response.
    url = SOURCE + "?" + urlencode({"panchang_refresh": now.strftime("%Y-%m-%d-%H")})
    request = Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "text/html",
                                   "Cache-Control": "no-cache", "Pragma": "no-cache"})
    with urlopen(request, timeout=30) as response:
        html = response.read(2_000_000).decode("utf-8")
    data = parse_panchang(html)
    today = now.date().isoformat()
    if data["date"] != today:
        print(f"::warning::Kalnirnay currently publishes {data['date']}; no replacement for {today}.")
        return
    serialized = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if not OUTPUT.exists() or OUTPUT.read_text() != serialized:
        OUTPUT.write_text(serialized)
    print(f"Verified official Panchang for {data['date']}.")


if __name__ == "__main__":
    try:
        main()
    except HTTPError as error:
        if error.code in (403, 429):
            print(f"::warning::Kalnirnay declined this runner (HTTP {error.code}); "
                  "snapshot unchanged. The frontend hides stale values and links to the official source.")
        else:
            print(f"Panchang refresh failed: {error}", file=sys.stderr)
            sys.exit(1)
    except (OSError, ValueError) as error:
        print(f"Panchang refresh failed: {error}", file=sys.stderr)
        sys.exit(1)
