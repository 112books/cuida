# CLAUDE.md — Guia del projecte Cuida

## ESTAT ACTUAL (10 maig 2026) — Beta 1 tancada ✓

App PWA per coordinar cura del Joan (cardiorespiratori, oxigen, morfina, PADES).
**Beta 1 tancada i etiquetada `v1.0-beta` als dos repos. Cloudflare KV pendent de setup.**

### Repositoris i desplegament

- **Públic**: `112books/cuida` (plantilla buida, indexable, `v1.0-beta`)
- **Privat**: `112books/cuida-avi-joan` (dades reals del Joan, `v1.0-beta`)
- **Live**: https://cuida-avi-joan.pages.dev/ (Cloudflare Pages)
- Build output: `app/`, sense build command
- Password client-side (login): "peidro" — també és `CUIDA_PASSWORD` al KV
- Desplegament automàtic via `git push private main`
- Remots: `origin` = públic, `private` = privat (Cloudflare)

### Estat dels repos

- **`main` local** = privat amb dades reals del Joan
- **`origin/main`** = plantilla buida per a ús públic (sense dades, sense foto, sense docs interns)
- Per desplegar al públic: crear branca `public-beta1`, fer neteja, force push a `origin/main`
- **NO fer `git push origin main` directament** — sobreescriuria amb dades privades

### Flux de dades (amb KV actiu)

1. `carregarDades()` → async, fa `fetch('/api/dades')` (Cloudflare KV via Pages Function)
2. Si KV buit o error de xarxa → fallback a `DADES_INICIALS` de `dades.js`
3. Edició via formulari a Config → POST a `/api/dades` amb password → escriu KV
4. Tots els dispositius veuen els canvis en la propera recàrrega
5. Export JSON disponible a Config com a backup manual

### Backend: Cloudflare Pages Function

- Fitxer: `app/functions/api/dades.js` (GET llegeix KV, POST valida password i escriu KV)
- KV namespace: `CUIDA_DADES` (clau única "dades" → JSON complet)
- Variable d'entorn: `CUIDA_PASSWORD` (Secret a Cloudflare Pages Settings)
- **IMPORTANT:** com que el publish dir és `app/`, les functions van a `app/functions/`, NO a l'arrel del repo

### Setup Cloudflare KV (PENDENT — 5-10 min)

1. Dashboard → Workers & Pages → KV → Create namespace → Nom: `CUIDA_DADES`
2. Pages → cuida-avi-joan → Settings → Environment variables → Secret: `CUIDA_PASSWORD` = "peidro"
3. Pages → Settings → Functions → KV namespace bindings → Variable: `CUIDA_DADES`
4. `git push private main` → redesplegament automàtic
5. Verificació: obrir `/api/dades` al navegador — hauries de veure JSON

### Model de dades (`app/js/dades.js`)

`DADES_INICIALS` conté: pacient (nom, situacio, telefon, foto, nota),
contactes_medics (rol, nom, telefon, notes, prioritat),
proveidors (nom, telefon, notes),
rols_familiars (rol, principal, suplent, telefon, notes),
medicacio (17 fàrmacs: nom, dosi, horari, via, per_a_que, notes),
empresa_cuidadora (nom, telefon, responsable),
cuidadors (nom, telefon, horari) — array,
voluntats_anticipades, protocols_urgencies, pla_avia,
indicadors_desgast, graella (fase, escenari, cuidadora, ical).

`PLANTILLA_BUIDA` = versió buida per al repositori públic.
Al repo públic: `const DADES_INICIALS = PLANTILLA_BUIDA;`

### Fitxers clau

- `app/functions/api/dades.js` — Pages Function backend KV (GET/POST)
- `app/js/dades.js` — dades inicials i fallback offline
- `app/js/main.js` — lògica: renderitzarX(), formulari edició, carregarDades() async
- `app/js/calendari.js` — graella cuidadors
- `app/js/emmagatzematge.js` — export/import JSON
- `app/index.html` — 6 vistes (Inici, Graella, Contactes, Urgències, Medicació, Config)
- `app/css/estil.css` — disseny zen grisos
- `app/service-worker.js` — cache v3, exclou /api/
- `app/imatges/avi-joan.png` — foto del pacient (NOMÉS al repo privat)

### Disseny

- Grisos: fons #f5f5f5, targetes #fff, text #1a1a1a, accents #222
- Vermell #d9534f només a urgències i alertes
- Pastilles d'estat: verd `.estat-ok`, taronja `.estat-revisar`, vermell `.estat-critic`
- Header "LinuxBCN — **Cuida**" centrat, tipografia IBM Plex Mono
- Navegació inferior fixa amb icones SVG inline
- Mobile-first, sense dependències externes

### Funcionalitats (Beta 1)

- Inici: foto pacient, pastilla estat (verd/taronja/vermell), accions ràpides
- Graella: horari setmanal cuidadors amb colors
- Contactes: empresa, cuidadors, metges, proveïdors, família — botons tel/FaceTime
- Urgències: protocols pas a pas, botó vermell truca 112
- Medicació: 17 fàrmacs amb dosi, horari, alertes
- Config: editor de dades (formulari), guia, export/import JSON, guia Cloudflare

### PENDENTS per a properes versions

- **Setup Cloudflare KV** (5-10 min al dashboard, veure passos amunt)
- Telèfon Teleassistència (editable via formulari a Config)
- DVA (voluntats anticipades) — verificar si existeix document físic
- Domini `cuida.linuxbcn.cat` a Cloudflare (cal afegir linuxbcn.cat al compte)
- Icones PWA reals (ara placeholders)

### Com es treballa

```bash
cd /Users/joan/Documents/Obsidian/cuida.linuxbcn.cat
# Local:
cd app && python3 -m http.server 8080
# Desplegar al privat (Cloudflare):
git add -A && git commit -m "missatge" && git push private main
# Actualitzar repo públic (amb branca de neteja):
git checkout -b public-beta1
# ... fer neteja de dades ...
git push origin public-beta1:main --force
git checkout main && git branch -D public-beta1
```

## NOTES PER A LA IA

- Codi en català
- Funcions: `renderitzarX()`
- Sense dependències externes
- Service worker: cache v3 — actualitzar `CACHE_NOM` i `FILES` si s'afegeixen fitxers nous
- No usar localStorage — les dades van a Cloudflare KV via `/api/dades`
- `esc()` definida a `main.js`, NO a `calendari.js`
- `netejarTel()` treu espais i guions dels telèfons
- Contrasenya "peidro": login client-side (`index.html`) + `CUIDA_PASSWORD` a Cloudflare (KV write)
- `carregarDades()` és async — qualsevol cosa que en depengui ha d'esperar `await`
- `Calendari.generarGraellaHTML(dades)` — un sol argument, sense escenari
- `seccioConfigurable(t, c, obert)` — tercer argument booleà per controlar si s'obre per defecte
- Pastilla estat a `#estat-general`, llista detall a `#llista-avisos` (hidden quan tot ok)
