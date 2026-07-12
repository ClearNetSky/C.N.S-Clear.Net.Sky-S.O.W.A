#!/usr/bin/env python3
# ============================================================
# tools/check_site.py — static site health check (used by CI).
#
#     python tools/check_site.py
#
# Verifies:
#   1. every HTML file has balanced tags;
#   2. every local src/href resolves to an existing file;
#   3. every page contains the build markers (header/footer/seo).
# Exits non-zero on any failure.
# ============================================================

import glob
import io
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

VOID = {"img", "br", "hr", "meta", "link", "input", "source", "area",
        "base", "col", "embed", "track", "wbr"}


class BalanceChecker(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.errors = [], []

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()
        elif tag in self.stack:
            while self.stack and self.stack[-1] != tag:
                self.errors.append(f"unclosed <{self.stack.pop()}>")
            self.stack.pop()
        else:
            self.errors.append(f"stray </{tag}>")


def main():
    failures = 0
    pages = ["index.html", "404.html"] + sorted(glob.glob("pages/*/*.html"))
    marked = ["index.html"] + sorted(glob.glob("pages/*/*.html"))

    # 1. tag balance
    for f in pages:
        p = BalanceChecker()
        p.feed(io.open(f, encoding="utf-8").read())
        for t in p.stack:
            p.errors.append(f"unclosed <{t}>")
        if p.errors:
            failures += 1
            print(f"FAIL {f}: {p.errors[:5]}")

    # 2. local links resolve
    for f in pages:
        s = io.open(f, encoding="utf-8").read()
        base = os.path.dirname(f)
        for m in re.findall(r'(?:src|href)="([^"#][^"]*)"', s):
            if m.startswith(("http", "mailto:", "tel:", "data:", "#", "/")):
                continue
            target = os.path.normpath(os.path.join(base, m.split("?")[0]))
            if not os.path.exists(target):
                failures += 1
                print(f"FAIL {f}: broken link -> {m}")

    # 3. build markers present
    for f in marked:
        s = io.open(f, encoding="utf-8").read()
        for marker in ("build:seo", "build:header", "build:footer"):
            if marker not in s:
                failures += 1
                print(f"FAIL {f}: missing {marker} marker")

    if failures:
        print(f"\n{failures} problem(s) found.")
        sys.exit(1)
    print(f"checked {len(pages)} pages — all OK")


if __name__ == "__main__":
    main()
