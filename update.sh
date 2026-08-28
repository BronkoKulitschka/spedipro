#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  update.sh — SpeditionsPro 95
#
#  Nimmt das neueste spedipro-ZIP aus dem Download-Ordner,
#  ersetzt damit den Projektstand und schiebt alles ins Repo.
#
#  Eigene Dateien unter assets/ und eigenes/ überstehen das
#  Update — sie werden zwischengelegt und danach zurückgeholt.
#
#  Aufruf:   ./update.sh
#            ./update.sh "Eigene Commit-Nachricht"
#            ./update.sh --push      nur offene Commits nachschieben
#            ./update.sh --login     Zugangsdaten neu hinterlegen
# ─────────────────────────────────────────────────────────────

REPO="$HOME/spedipro"
BRANCH="main"

# Ordner, deren Inhalt ein Update überlebt
EIGENE_ORDNER=(assets eigenes)

# ── Zugangsdaten dauerhaft merken ────────────────────────────
einrichten_zugang() {
  local helper
  helper=$(git config --global --get credential.helper || true)

  if [ -z "$helper" ]; then
    git config --global credential.helper store
    echo "→ Zugangsdaten werden ab jetzt gespeichert."
    echo "  Beim nächsten Push einmal Benutzername und Token eingeben,"
    echo "  danach nie wieder."
    echo "  Hinweis: Der Token liegt dann im Klartext in ~/.git-credentials."
    echo
  fi
}

if [ "$1" = "--login" ]; then
  rm -f "$HOME/.git-credentials"
  git config --global credential.helper store
  echo "→ Gespeicherte Zugangsdaten gelöscht."
  echo "  Beim nächsten Push werden Benutzername und Token neu abgefragt."
  exit 0
fi

# ── Repo prüfen ──────────────────────────────────────────────
if [ ! -d "$REPO/.git" ]; then
  echo "✗ $REPO ist kein Git-Repository."
  exit 1
fi

cd "$REPO" || exit 1
einrichten_zugang

# ── Offene Commits erkennen ──────────────────────────────────
offene_commits() {
  git rev-list --count "origin/$BRANCH..HEAD" 2>/dev/null || echo 0
}

pushen() {
  echo "→ Push läuft …"
  if git push -u origin "$BRANCH"; then
    echo
    echo "✓ Fertig. Neuer Stand ist im Repo."
    echo "  Seite: https://bronkokulitschka.github.io/spedipro/"
    return 0
  fi

  echo
  echo "✗ Push fehlgeschlagen."
  echo "  Der Commit liegt lokal bereit und geht beim nächsten Lauf mit hoch."
  echo "  Liegt auf GitHub etwas Neueres:  git pull --rebase origin main"
  echo "  Bei falschen Zugangsdaten:       ./update.sh --login"
  echo "  Nur erneut versuchen:            ./update.sh --push"
  return 1
}

git fetch origin "$BRANCH" --quiet 2>/dev/null || true
OFFEN=$(offene_commits)

if [ "$1" = "--push" ]; then
  if [ "$OFFEN" -eq 0 ]; then
    echo "✓ Nichts offen. Alles ist im Repo."
    exit 0
  fi
  echo "→ $OFFEN Commit(s) noch nicht hochgeladen."
  pushen
  exit $?
fi

if [ "$OFFEN" -gt 0 ]; then
  echo "→ Achtung: $OFFEN Commit(s) aus einem früheren Lauf sind noch offen."
  echo "  Sie gehen zusammen mit dem neuen Stand hoch."
  echo
fi

# ── Download-Ordner finden ───────────────────────────────────
KANDIDATEN=(
  "$HOME/storage/downloads"
  "/sdcard/Download"
  "/sdcard/Downloads"
  "/storage/emulated/0/Download"
  "/storage/emulated/0/Downloads"
)

DOWNLOADS=""
for dir in "${KANDIDATEN[@]}"; do
  if [ -d "$dir" ]; then DOWNLOADS="$dir"; break; fi
done

if [ -z "$DOWNLOADS" ]; then
  echo "✗ Kein Download-Ordner gefunden."
  echo "  Einmal 'termux-setup-storage' ausführen und bestätigen."
  [ "$OFFEN" -gt 0 ] && pushen
  exit 1
fi

# ── Neuestes ZIP finden ──────────────────────────────────────
ZIP=$(ls -t "$DOWNLOADS"/spedipro*.zip 2>/dev/null | head -1 || true)

if [ -z "$ZIP" ]; then
  echo "✗ Kein spedipro-ZIP in $DOWNLOADS gefunden."
  if [ "$OFFEN" -gt 0 ]; then
    echo "  Es werden nur die offenen Commits hochgeladen."
    echo
    pushen
    exit $?
  fi
  exit 1
fi

echo "→ Download-Ordner: $DOWNLOADS"
echo "→ Archiv: $(basename "$ZIP") vom $(date -r "$ZIP" '+%d.%m.%Y %H:%M')"
echo

# ── Eigene Dateien zwischenlegen ─────────────────────────────
SICHER=$(mktemp -d)
GESICHERT=0

for ordner in "${EIGENE_ORDNER[@]}"; do
  [ -d "$ordner" ] || continue
  [ -n "$(ls -A "$ordner" 2>/dev/null)" ] || continue

  mkdir -p "$SICHER/$ordner"
  cp -r "$ordner/." "$SICHER/$ordner/" 2>/dev/null || true
  ANZ=$(find "$SICHER/$ordner" -type f 2>/dev/null | wc -l)
  GESICHERT=$((GESICHERT + ANZ))
done

[ "$GESICHERT" -gt 0 ] && echo "→ $GESICHERT eigene Datei(en) zwischengelegt"

# ── Alten Stand ersetzen ─────────────────────────────────────
echo "→ Alten Stand entfernen (.git bleibt)"
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

echo "→ Archiv entpacken"
cd "$HOME" || exit 1
if ! unzip -oq "$ZIP"; then
  echo "✗ Archiv ließ sich nicht entpacken."
  cd "$REPO" && git checkout -- . 2>/dev/null
  rm -rf "$SICHER"
  exit 1
fi

cd "$REPO" || exit 1

if [ ! -f "index.html" ]; then
  echo "✗ Nach dem Entpacken fehlt index.html."
  echo "  Alter Stand wird wiederhergestellt."
  git checkout -- . 2>/dev/null
  rm -rf "$SICHER"
  exit 1
fi

# ── Eigene Dateien zurückholen ───────────────────────────────
# Was das Archiv selbst mitbringt, bleibt unangetastet — es ist
# die neuere Fassung.
if [ "$GESICHERT" -gt 0 ]; then
  for ordner in "${EIGENE_ORDNER[@]}"; do
    [ -d "$SICHER/$ordner" ] || continue
    mkdir -p "$ordner"

    while IFS= read -r datei; do
      rel="${datei#$SICHER/$ordner/}"
      if [ ! -e "$ordner/$rel" ]; then
        mkdir -p "$ordner/$(dirname "$rel")"
        cp "$datei" "$ordner/$rel"
        echo "  bewahrt: $ordner/$rel"
      fi
    done < <(find "$SICHER/$ordner" -type f)
  done
fi
rm -rf "$SICHER"

# ── Änderungen zeigen ────────────────────────────────────────
git add -A
echo
echo "→ Geänderte Dateien:"
git status --short
echo

if git diff --cached --quiet; then
  echo "→ Keine Dateiänderungen."
  if [ "$OFFEN" -gt 0 ]; then
    pushen
    exit $?
  fi
  echo "✓ Alles aktuell. Nichts zu tun."
  exit 0
fi

# ── Commit und Push ──────────────────────────────────────────
VERSION=$(grep -oP "VERSION = '\K[^']+" src/version.js 2>/dev/null || echo "")
STANDARD="Update vom $(date '+%d.%m.%Y %H:%M')"
[ -n "$VERSION" ] && STANDARD="Version $VERSION"

MSG="${1:-$STANDARD}"
git commit -q -m "$MSG"
echo "→ Commit: $MSG"

pushen
