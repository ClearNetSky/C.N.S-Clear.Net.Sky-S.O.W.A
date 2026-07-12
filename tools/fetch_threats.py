#!/usr/bin/env python3
# ============================================================
# tools/fetch_threats.py — refreshes data/threats.json from the
# CISA Known Exploited Vulnerabilities (KEV) catalogue.
#
#     python tools/fetch_threats.py
#
# The site loads data/threats.json at runtime (js/threats.js) and
# shows these entries at the top of the Threat Database. A GitHub
# Actions cron job (.github/workflows/update-threats.yml) runs this
# daily so the data stays fresh without any client-side API calls
# (no CORS, no API keys in the browser).
#
# Source: https://www.cisa.gov/known-exploited-vulnerabilities-catalog
# The KEV catalogue is public U.S. government data.
# ============================================================

import io
import json
import os
import urllib.request
from datetime import date, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FEED = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
OUT = os.path.join(ROOT, "data", "threats.json")
LIMIT = 12  # newest N entries shown on the site


def fetch():
    req = urllib.request.Request(FEED, headers={"User-Agent": "CNS-SOWA-site/0.3 (+https://github.com/ClearNetSky)"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def main():
    kev = fetch()
    today = date.today()
    vulns = sorted(kev["vulnerabilities"], key=lambda v: v["dateAdded"], reverse=True)[:LIMIT]

    items = []
    for v in vulns:
        added = datetime.strptime(v["dateAdded"], "%Y-%m-%d").date()
        ransomware = str(v.get("knownRansomwareCampaignUse", "")).lower() == "known"
        product = f'{v.get("vendorProject", "").strip()} {v.get("product", "").strip()}'.strip()
        items.append({
            "name": v["cveID"],
            "cat": "vulnerability",
            "type": {
                "en": f"Exploited vulnerability · {product}",
                "ru": f"Эксплуатируемая уязвимость · {product}",
            },
            "sev": "critical" if ransomware else "high",
            "days": max((today - added).days, 0),
            "active": True,
            "desc": (v.get("shortDescription") or "").strip()[:220],
        })

    payload = {
        "source": "CISA Known Exploited Vulnerabilities Catalog",
        "sourceUrl": "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
        "updated": today.isoformat(),
        "items": items,
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    io.open(OUT, "w", encoding="utf-8", newline="\n").write(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    )
    print(f"wrote {os.path.relpath(OUT, ROOT)} with {len(items)} entries (updated {today})")


if __name__ == "__main__":
    main()
