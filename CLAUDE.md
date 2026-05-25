# CLAUDE.md — Guia del projecte Cuida

## ESTAT ACTUAL (25 maig 2026) — Beta 1 + millores medicació/oxigen

App PWA per coordinar cura del Joan (cardiorespiratori, oxigen, morfina, PADES).
Backend: **GitHub API** (llegeix/escriu `app/dades.json` al repo privat via Cloudflare Pages Function).

### Repositoris i desplegament

- **Públic**: `112books/cuida` (plantilla buida, indexable)
- **Privat**: `112books/cuida-avi-joan` (dades reals del Joan, en producció)
- **Live**: https://cuida-avi-joan.pages.dev/ (Cloudflare Pages)
- Build output: `app/`, sense build command
- Password client-side (login): valor configurat a `CUIDA_PASSWORD` a Cloudflare Pages Settings
- Desplegament automàtic via `git push private main`
- Remots: `origin` = públic, `private` = privat (Cloudflare)

### Estat dels repos

- **`main` local** = privat amb dades reals del Joan
- **`origin/main`** = plantilla buida per a ús públic (sense dades, sense foto, sense docs interns)
- Per desplegar al públic: crear branca `public`, fer neteja, force push a `origin/main`
- **NO fer `git push origin main` directament** — sobreescriuria amb dades privades

### Flux de dades (GitHub API)

1. `carregarDades()` → async, fa `fetch('/api/dades')` (Cloudflare Pages Function)
2. La Function llegeix `app/dades.json` del repo privat via GitHub API
3. Si error de xarxa → fallback a `DADES_INICIALS` de `dades.js`
4. Edició via formulari a Config → POST a `/api/dades` amb password → Function escriu `app/dades.json` via GitHub API
5. Tots els dispositius veuen els canvis en la propera recàrrega (service worker v6 auto-reload)
6. Export JSON disponible a Config com a backup manual

**IMPORTANT**: Quan l'API fa POST escriu un commit a GitHub. Sempre cal `git pull private main --rebase` abans de `git push private main` per evitar conflictes.

### Backend: Cloudflare Pages Function (GitHub API)

- Fitxer: `functions/api/dades.js` a l'ARREL del repo (Cloudflare el publica com a Pages Function)
- GET → llegeix `app/dades.json` del repo `112books/cuida-avi-joan` via GitHub API
- POST → valida `CUIDA_PASSWORD`, obté SHA actual, escriu nou JSON via GitHub PUT
- Variables d'entorn necessàries a Cloudflare Pages Settings:
  - `GITHUB_TOKEN` — token GitHub amb permisos `repo` (read/write)
  - `CUIDA_PASSWORD` — contrasenya d'escriptura (configurar al dashboard de Cloudflare)

### Model de dades (`app/js/dades.js`)

`DADES_INICIALS` conté:
- `pacient` (nom, situacio, telefon, foto, nota)
- `contactes_medics` (rol, nom, telefon, notes, prioritat)
- `proveidors` (nom, telefon, notes)
- `rols_familiars` (rol, principal, suplent, telefon, notes)
- `medicacio` — array, cada ítem: `{nom, dosi, horari, via, per_a_que, notes, moment}`
  - `moment` values: `'esmorzar'` / `'dinar'` / `'sopar'` / `'altres'` / `'continu'`
  - Grups visualitzats: Matí / Migdia / Nit / Puntual / Altres
- `empresa_cuidadora` (nom, telefon, responsable)
- `cuidadors` (nom, telefon, horari) — array
- `oxigen` (flux, notes) — flux en L/min, notes sobre humidificador
- `tasques_cuidadora` — array de strings (tasques diàries per la cuidadora)
- `voluntats_anticipades`, `protocols_urgencies`, `pla_avia`
- `indicadors_desgast`, `graella` (fase, escenari, cuidadora, ical)

`PLANTILLA_BUIDA` = versió buida per al repositori públic.
Al repo públic: `const DADES_INICIALS = PLANTILLA_BUIDA;`

### Fitxers clau

- `functions/api/dades.js` — Pages Function backend (GET/POST, GitHub API)
- `app/dades.json` — dades persistides (creat/actualitzat per l'API, NOMÉS al repo privat)
- `app/js/dades.js` — `DADES_INICIALS` i `PLANTILLA_BUIDA` (fallback offline)
- `app/js/main.js` — lògica: `renderitzarX()`, formulari edició, `carregarDades()` async
- `app/js/calendari.js` — graella cuidadors
- `app/js/emmagatzematge.js` — export/import JSON + `Emmagatzematge.carregarRemot()`
- `app/index.html` — 6 vistes (Inici, Graella, Contactes, Urgències, Medicació, Config)
- `app/css/estil.css` — disseny zen grisos
- `app/service-worker.js` — cache v6, exclou /api/, auto-reload via postMessage SW_UPDATE
- `app/_headers` — Cloudflare headers: no-cache per SW i index.html, no-store per /api/
- `app/imatges/avi-joan.png` — foto del pacient (TOTS DOS repos, homenatge)
- `app/icones/icon-192.png`, `icon-512.png` — icones PWA (foto avi Joan, tots dos repos)

### Disseny

- Grisos: fons #f5f5f5, targetes #fff, text #1a1a1a, accents #222
- Vermell #d9534f només a urgències i alertes
- Pastilles d'estat: verd `.estat-ok`, taronja `.estat-revisar`, vermell `.estat-critic`
- Header "Cuida per LinuxBCN" centrat, tipografia IBM Plex Mono
- Navegació inferior fixa amb icones SVG inline
- Mobile-first, sense dependències externes

### Funcionalitats (25 maig 2026)

- Inici: foto pacient, pastilla estat (verd/taronja/vermell), widget oxigen (flux + avís humidificador), tasques diàries cuidadora, accions ràpides
- Graella: horari setmanal cuidadors amb colors
- Contactes: empresa, cuidadors, metges, proveïdors, família — botons tel/FaceTime
- Urgències: protocols pas a pas (inclou oxigen buit i màquina avariada), botó vermell truca 112
- Medicació: resum per grups d'àpat (Matí/Migdia/Nit/Puntual/Altres) a dalt, detall complet a sota
- Config: editor de dades (formulari), guia, export/import JSON

### PENDENTS per a properes versions

- Telèfon Teleassistència (editable via formulari a Config)
- DVA (voluntats anticipades) — verificar si existeix document físic
- Domini `cuida.linuxbcn.cat` a Cloudflare (cal afegir linuxbcn.cat al compte)
- Avisos setmanals via WhatsApp/email als cuidadors principals (pendent)
- Impressió optimitzada de contactes i medicació (text gran)

### Com es treballa

```bash
cd /Users/joan/Documents/Obsidian/cuida.linuxbcn.cat
# Local:
cd app && python3 -m http.server 8080
# Desplegar al privat (Cloudflare):
git pull private main --rebase && git add -A && git commit -m "missatge" && git push private main
# Si l'API ha fet un commit entre mig, sempre pull --rebase primer
# Actualitzar repo públic (amb branca de neteja):
git checkout -b public-sync
# ... fer neteja de dades (PLANTILLA_BUIDA, sense avi-joan.png a imatges/) ...
git push origin public-sync:main --force
git checkout main && git branch -D public-sync
```

## NOTES PER A LA IA

- Codi en català
- Funcions: `renderitzarX()`
- Sense dependències externes
- Service worker: **cache v6** — actualitzar `CACHE` i `FILES` si s'afegeixen fitxers nous
- `esc()` definida a `main.js`, NO a `calendari.js`
- `netejarTel()` treu espais i guions dels telèfons
- Contrasenya: login client-side (`index.html`) + `CUIDA_PASSWORD` a Cloudflare (API write) — valor MAI als fitxers de codi
- `carregarDades()` és async — qualsevol cosa que en depengui ha d'esperar `await`
- `Calendari.generarGraellaHTML(dades)` — un sol argument, sense escenari
- `seccioConfigurable(t, c, obert)` — tercer argument booleà per controlar si s'obre per defecte
- Pastilla estat a `#estat-general`, llista detall a `#llista-avisos` (hidden quan tot ok)
- Widget oxigen a `#inici-oxigen`, tasques cuidadora a `#inici-tasques` (a vista-inici)
- Medicació agrupa per `moment`: esmorzar→Matí, dinar→Migdia, sopar→Nit, altres→Puntual, continu→Altres
- `itemTascaHTML(t, i)` genera HTML per a cada tasca de la cuidadora
- `afegirTasca()` afegeix una nova tasca al formulari d'edició
- Backend: `new Function(content + '; return {DADES_INICIALS};')()` per eval segur de dades.js si cal
