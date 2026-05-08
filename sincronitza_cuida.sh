#!/bin/bash
# Cuida - Sincronització GitHub
set -e
REPO="https://github.com/LinuxBCN/cuida.git"
echo "💚 Cuida - Sincronització GitHub"
command -v git >/dev/null || { echo "❌ Git no instal·lat"; exit 1; }
[ ! -d .git ] && { git init; git branch -M main; git remote add origin "$REPO" 2>/dev/null || git remote set-url origin "$REPO"; echo "Repo inicialitzat"; }
git status --short
MISSATGE="Actualització Cuida - $(date '+%Y-%m-%d %H:%M')"
git add .
git commit -m "$MISSATGE" 2>/dev/null && echo "✅ Commit" || echo "Sense canvis"
git push -u origin main 2>/dev/null && echo "✅ Sincronitzat!" || echo "⚠️ No s'ha pogut fer push"
