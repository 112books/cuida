# CLAUDE.md — Guia del projecte Cuida

## ESTAT ACTUAL (26 maig 2026) — Beta 2

App PWA per coordinar cura del Joan (cardiorespiratori, oxigen, morfina, PADES).
Backend: **GitHub API** (llegeix/escriu `app/dades.json` al repo privat via Cloudflare Pages Functions).

### Repositoris i desplegament

- **Públic**: `112books/cuida` (plantilla buida, indexable)
- **Privat**: `112books/cuida-avi-joan` (dades reals del Joan, en producció)
- **Live**: https://cuida-avi-joan.pages.dev/ (Cloudflare Pages)
- Build output: `app/`, sense build command
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
5. Tots els dispositius veuen els canvis en la propera recàrrega (service worker v8 auto-reload)
6. Export JSON disponible a Config com a backup manual

**IMPORTANT**: Quan l'API fa POST escriu un commit a GitHub. Sempre cal `git pull private main --rebase` abans de `git push private main` per evitar conflictes.

### Variables d'entorn — Cloudflare Pages Settings

| Variable | Descripció |
|---|---|
| `GITHUB_TOKEN` | Token GitHub amb permisos `repo` (read/write) |
| `CUIDA_PASSWORD` | Contrasenya d'escriptura des de l'app |
| `VAPID_PUBLIC_KEY` | Clau pública VAPID per a Web Push |
| `VAPID_PRIVATE_KEY` | Clau privada VAPID (JSON JWK) |
| `VAPID_SUBJECT` | `mailto:linuxbcn@gmail.com` |
| `CRON_SECRET` | Paraula de pas per autenticar els crons de GitHub Actions |

### Secrets — GitHub Actions (repo privat)

| Secret | Valor |
|---|---|
| `CRON_SECRET` | Igual que a Cloudflare |
| `CUIDA_URL` | `https://cuida-avi-joan.pages.dev` |

### Backend: Pages Functions (GitHub API)

Totes a `functions/api/`:

| Fitxer | Mètodes | Descripció |
|---|---|---|
| `dades.js` | GET, POST | Llegeix/escriu `app/dades.json` (requereix `CUIDA_PASSWORD` per POST) |
| `suscripcions.js` | GET, POST, DELETE | CRUD subscripcions push a `data/subs.json` |
| `notificacions.js` | POST | Envia push de medicació a tots els subscriptors (requereix `CRON_SECRET`) |
| `estic-be.js` | GET, POST | GET retorna estat estic_sol; POST confirma "estic bé" (sense auth) |
| `estic-sol-check.js` | POST | Comprova si el timer ha expirat, dispara SOS push (requereix `CRON_SECRET`) |

### Crons — GitHub Actions

| Fitxer | Horaris | Funció |
|---|---|---|
| `.github/workflows/notificacions.yml` | 8h, 13:30h, 21h | Recordatoris de medicació |
| `.github/workflows/estic-sol.yml` | cada 15 min | Check mode Estic Sol |

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
- `diari` — array d'entrades: `{data, estat, text, constants: {tensio, saturacio, pes}}`
  - `estat` values: `'ok'` / `'revisar'` / `'critic'`
  - Màxim 90 entrades (les més recents)
- `estic_sol` — `{actiu, fins, activat, alerta}` — mode "estic sol" amb timer i flag SOS
- `voluntats_anticipades`, `protocols_urgencies`, `pla_avia`
- `indicadors_desgast`, `graella` (fase, escenari, cuidadora, ical)

`PLANTILLA_BUIDA` = versió buida per al repositori públic.
Al repo públic: `const DADES_INICIALS = PLANTILLA_BUIDA;`

### Fitxers clau

- `functions/api/dades.js` — Pages Function backend principal (GET/POST)
- `functions/api/suscripcions.js` — subscripcions push (CRUD, `data/subs.json`)
- `functions/api/notificacions.js` — envia Web Push de medicació (cron)
- `functions/api/estic-be.js` — confirma "estic bé" (POST sense auth)
- `functions/api/estic-sol-check.js` — comprova timeout estic sol, SOS push (cron)
- `app/dades.json` — dades persistides (GITIGNORED, NOMÉS al repo privat)
- `data/subs.json` — subscripcions push (GITIGNORED, NOMÉS al repo privat)
- `app/js/dades.js` — `DADES_INICIALS` i `PLANTILLA_BUIDA` (fallback offline)
- `app/js/main.js` — lògica: `renderitzarX()`, diari, estic sol, push, formulari edició
- `app/js/calendari.js` — graella cuidadors
- `app/js/emmagatzematge.js` — export/import JSON + `Emmagatzematge.carregarRemot()`
- `app/index.html` — 7 vistes (Inici, Graella, Contactes, Urgències, Medicació, Diari, Config)
- `app/css/estil.css` — disseny zen grisos + styles diari + estic sol + push widget
- `app/service-worker.js` — cache v8, push handler (SOS + medicació + diari), notificationclick
- `app/_headers` — capçaleres de seguretat Cloudflare
- `app/css/fonts/ibm-plex-mono-400.woff2` — font auto-allotjada (sense Google Fonts)
- `app/imatges/avi-joan.png` — foto del pacient
- `app/icones/icon-192.png`, `icon-512.png` — icones PWA (foto avi Joan)
- `scripts/generar-claus-vapid.js` — generador de claus VAPID (una sola vegada)
- `.github/workflows/notificacions.yml` — cron medicació
- `.github/workflows/estic-sol.yml` — cron estic sol (cada 15 min)
- `README-FAMILIA.md` — guia d'ús per a la família (repo privat)

### Disseny

- Grisos: fons #f5f5f5, targetes #fff, text #1a1a1a, accents #222
- Vermell #d9534f a urgències, alertes i SOS
- Taronja #e67e22 per al mode Estic Sol actiu
- Verd #1a6630 per a "Estic bé" i recordatoris actius
- Pastilles d'estat: verd `.estat-ok`, taronja `.estat-revisar`, vermell `.estat-critic`
- Header "Cuida per LinuxBCN" centrat, tipografia IBM Plex Mono (auto-allotjada)
- Navegació inferior fixa amb 7 icones SVG inline (font reduïda a .55rem)
- Mobile-first, sense dependències externes

### Funcionalitats (26 maig 2026) — Beta 2

- **Inici**: foto pacient, pastilla estat, widget Estic Sol, widget oxigen, tasques cuidadora, widget recordatoris push, invitació diari, accions ràpides
- **Graella**: horari setmanal cuidadors amb colors
- **Contactes**: empresa, cuidadors, metges, proveïdors, família — botons tel/FaceTime + impressió
- **Urgències**: protocols pas a pas (inclou oxigen buit i màquina avariada), botó 112
- **Medicació**: resum per grups d'àpat + detall complet + impressió
- **Diari**: notes diàries amb estat, constants vitals, historial 90 dies
- **Config**: editor dades, guia, export/import JSON

### Web Push — arquitectura

- Claus VAPID generades amb `scripts/generar-claus-vapid.js` (una sola vegada)
- `VAPID_PUBLIC_KEY` a Cloudflare env vars I a la constant `VAPID_PUBLIC_KEY` de `main.js`
- `VAPID_PRIVATE_KEY` (JWK JSON) NOMÉS a Cloudflare env vars
- Subscripcions guardades a `data/subs.json` via GitHub API (fora del directori públic)
- El service worker rep el push, fa fetch de `/api/dades`, mostra notificació adequada:
  - `estic_sol.alerta` → notificació SOS (requireInteraction, vibració)
  - Hora matí/migdia/nit → pastilles corresponents
  - Matí sense diari → invitació a escriure nota
- `estic-be.js` POST no requereix auth (baixa sensibilitat: només pot dir "estic bé")

### PENDENTS per a properes versions

- Configuració dels horaris de notificació (ara fixos: 8h, 13:30h, 21h)
- Seguiment de constants amb gràfics (tensió, saturació, pes al llarg del temps)
- Informe setmanal exportable per al metge
- Botó SOS familiar (alerta per rang: Mireia → Isabel → Roger)
- Domini `cuida.linuxbcn.cat` a Cloudflare (cal afegir linuxbcn.cat al compte)
- Telèfon Teleassistència editable via formulari

### Com es treballa

```bash
cd /Users/joan/Documents/Obsidian/cuida.linuxbcn.cat
# Servidor local:
cd app && python3 -m http.server 8080
# Desplegar al privat (Cloudflare):
git pull private main --rebase && git add -A && git commit -m "missatge" && git push private main
# Si l'API ha fet un commit entre mig, sempre pull --rebase primer
# Actualitzar repo públic (amb branca de neteja):
git checkout -b public-sync
# ... neteja: PLANTILLA_BUIDA a dades.js, REPO='112books/cuida' a functions, esborrar README-FAMILIA.md, NOVETATS-ARTICLE.md ...
git push origin public-sync:main --force
git checkout main && git branch -D public-sync
```

## NOTES PER A LA IA

- Codi en català
- Funcions: `renderitzarX()`
- Sense dependències externes
- Service worker: **cache v8** — actualitzar `CACHE` i `FILES` si s'afegeixen fitxers nous
- `esc()` definida a `main.js`, NO a `calendari.js`
- `netejarTel()` treu espais i guions dels telèfons
- Contrasenya: login client-side (`index.html`) + `CUIDA_PASSWORD` a Cloudflare (API write) — valor MAI als fitxers de codi
- `carregarDades()` és async — qualsevol cosa que en depengui ha d'esperar `await`
- `Calendari.generarGraellaHTML(dades)` — un sol argument, sense escenari
- `seccioConfigurable(t, c, obert)` — tercer argument booleà per controlar si s'obre per defecte
- DOM inici: `#estat-general` (pastilla), `#llista-avisos`, `#inici-estic-sol`, `#inici-oxigen`, `#inici-tasques`, `#inici-recordatoris`, `#inici-diari-avui`
- Medicació agrupa per `moment`: esmorzar→Matí, dinar→Migdia, sopar→Nit, altres→Puntual, continu→Altres
- Diari: `ESTAT_DIARI` = `{ok, revisar, critic}`, màx 90 entrades, `dataDiariEditant` + `estatDiariActual` com a estat global
- Estic Sol: `duradaSeleccionada` (1-4h), `countdownInterval` per al comptador, `confirmarEsticBe()` no requereix password
- Push: `VAPID_PUBLIC_KEY` constant a main.js, `urlBase64ToUint8Array()` per convertir, `subscripcioActual` com a estat global
- `itemTascaHTML(t, i)`, `afegirTasca()` per al formulari de tasques
- Al repo públic: eliminar `README-FAMILIA.md` i `NOVETATS-ARTICLE.md` del sync
