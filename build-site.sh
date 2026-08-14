#!/bin/bash
# Assembles the deployable static site into ./docs (served by GitHub Pages)
# from bee-planner.html + the PWA files.
set -e
cd "$(dirname "$0")"
OUT=docs
mkdir -p "$OUT"

HEAD='<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon.svg">
</head>
<body>'

FOOT='<script>if("serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){});});}</script>
</body>
</html>'

printf '%s\n' "$HEAD" > "$OUT/index.html"
cat bee-planner.html >> "$OUT/index.html"
printf '%s\n' "$FOOT" >> "$OUT/index.html"

cp manifest.webmanifest sw.js icon.svg "$OUT"/
touch "$OUT/.nojekyll"   # tell GitHub Pages to serve files as-is (no Jekyll)

if command -v zip >/dev/null 2>&1; then
  (cd "$OUT" && zip -qr ../bee-site.zip .)
fi

echo "Built $OUT/ ($(wc -c < "$OUT/index.html" | tr -d ' ') bytes) -> served at GitHub Pages"
