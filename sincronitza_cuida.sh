#!/bin/bash
# Cuida - Sincronització GitHub (repo PRIVAT)
set -e
echo "💚 Cuida - Sincronització GitHub (privat)"
command -v git >/dev/null || { echo "❌ Git no instal·lat"; exit 1; }
[ ! -d .git ] && { echo "❌ No és un repo git"; exit 1; }

git status --short
MISSATGE="Actualització Cuida - $(date '+%Y-%m-%d %H:%M')"

# Estageja només fitxers ja seguits (exclou nous fitxers no revisats)
git add --update
git commit -m "$MISSATGE" 2>/dev/null && echo "✅ Commit" || echo "Sense canvis"

# Push al repo PRIVAT (Cloudflare), mai a origin (repo públic)
git pull private main --rebase 2>/dev/null || true
git push private main 2>/dev/null && echo "✅ Sincronitzat a privat!" || echo "⚠️ No s'ha pogut fer push"
