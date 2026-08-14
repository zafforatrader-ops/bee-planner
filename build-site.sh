#!/bin/bash
# Assembles a deploy-ready static site in ./site from bee-planner.html + PWA files.
set -e
cd "$(dirname "$0")"
mkdir -p site

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

printf '%s\n' "$HEAD" > site/index.html
cat bee-planner.html >> site/index.html
printf '%s\n' "$FOOT" >> site/index.html

cp manifest.webmanifest sw.js icon.svg site/

# zip for easy drag-and-drop upload (best effort)
if command -v zip >/dev/null 2>&1; then
  (cd site && zip -qr ../bee-site.zip .)
  echo "Zipped -> bee-site.zip"
fi

echo "Built site/ ($(wc -c < site/index.html | tr -d ' ') bytes) with: index.html, manifest.webmanifest, sw.js, icon.svg"
