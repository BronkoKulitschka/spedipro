#!/usr/bin/env bash
# Setzt eine neue Versionsnummer in src/version.js und index.html.
#   ./bump-version.sh 0.5.1

set -e
NEW="$1"
[ -z "$NEW" ] && { echo "Aufruf: ./bump-version.sh 0.5.1"; exit 1; }

TODAY=$(date +%Y-%m-%d)

sed -i "s/export const VERSION = '.*'/export const VERSION = '$NEW'/" src/version.js
sed -i "s/export const BUILD   = '.*'/export const BUILD   = '$TODAY'/" src/version.js
sed -i "s/?v=[0-9.]*\"/?v=$NEW\"/g" index.html

echo "✓ Version $NEW, Stand $TODAY"
grep -E "VERSION|BUILD" src/version.js
