# CLAUDE.md — Guia del projecte Cuida

## ESTAT ACTUAL (10 maig 2026)

App PWA per coordinar cura del Joan (cardiorespiratori, oxigen, morfina, PADES).
Dades centralitzades a GitHub, tots els dispositius veuen el mateix.

### Repositoris i desplegament

- **Public**: `112books/cuida` (plantilla buida, indexable)
- **Privat**: `112books/cuida-avi-joan` (dades reals, noindex)
- **Live**: https://cuida-avi-joan.pages.dev/ (Cloudflare Pages)
- Build output: `app/`, sense build command
- Password client-side: "peidro"
- Desplegament automatic via `git push private main`

### Flux de dades

1. `carregarDades()` → sempre `JSON.parse(JSON.stringify(DADES_INICIALS))` de `dades.js`
2. No es carrega res de LocalStorage a l'inici
3. Export/Import JSON manual disponible a Config per fer còpies
4. Per actualitzar dades: editar `app/js/dades.js`, commit, push → Cloudflare redeploya

### Model de dades (`app/js/dades.js`)

`DADES_INICIALS` conte: pacient (nom, situacio, telefon, foto, nota),
contactes_medics (rol, nom, telefon, notes, prioritat),
proveidors (nom, telefon, notes),
rols_familiars (rol, principal, suplent, telefon, notes),
medicacio (16 farmacs: nom, dosi, horari, via, per_a_que, notes),
voluntats_anticipades, protocols_urgencies, pla_avia,
indicadors_desgast, graella (fase, escenari, cuidadora, ical).

`PLANTILLA_BUIDA` = versio buida per al repositori public.

### Fitxers clau

- `app/js/dades.js` — dades inicials (font de veritat)
- `app/js/main.js` — logica: renderitzarX(), ICONS, carregarDades(), netejarTel()
- `app/js/calendari.js` — graella setmanal (Calendari.generarGraellaHTML)
- `app/js/emmagatzematge.js` — nomes export/import JSON
- `app/index.html` — 6 vistes (Inici, Graella, Contactes, Urgencies, Medicacio, Config)
- `app/css/estil.css` — disseny zen grisos + vermell per emergencies
- `app/service-worker.js` — cache v2, neteja caches velles
- `app/imatges/avi-joan.png` — foto del pacient (URL relativa)
- `app/icones/icon-192.png`, `icon-512.png` — icones PWA placeholder

### Disseny

- Grisos: fons #f5f5f5, targetes #fff, text #1a1a1a, accents #222
- Vermell #d9534f nomes a urgències i alertes
- Header "LinuxBCN — **Cuida**" centrat, sense fons
- Navegacio inferior fixa amb icones SVG inline
- Mobile-first, sense dependencies externes

### Funcionalitats

- Inici: foto pacient, dades, avisos, accions rapides (export/import)
- Graella: escenari A/B amb colors (cuidadora verd, familia lila)
- Contactes: "Cuidadors externs" + "Proveidors" + "Familia", botons tel/facetime per cada numero
- Urgencies: protocols pas a pas, boto vermell truca 112
- Medicacio: 16 farmacs amb dosi, horari, alertes
- Config: perfils (buida/avi_joan), guia, export/import

### PENDENTS

- Telefon cardiòleg i proveidors (farmacia, oxigen, queviures, empresa cuidadores)
- DVA (voluntats anticipades) — verificar si existeix
- Domini `cuida.linuxbcn.cat` a Cloudflare (cal afegir linuxbcn.cat al compte)
- Icones reals (ara placeholders verds)

### Com es treballa

```bash
cd /Users/joan/Documents/Obsidian/cuida.linuxbcn.cat
# Local:
cd app && python3 -m http.server 8080
# Desplegar:
git add -A && git commit -m "missatge" && git push private main
# Remots: origin = public, private = privat (Cloudflare)
```

## PROPOSTES PER AL FUTUR (backend per editar des del mobil)

### Opcio 1: Editar a GitHub directament (ara)
Anar a github.com/112books/cuida-avi-joan → editar `dades.js` (llapis) →
commit → deploy automatic. Funciona des del mobil.
Requereix saber JSON.

### Opcio 2: Cloudflare Function + GitHub API
Afegeix una Cloudflare Function que fa de pont entre l'app i GitHub.
**Setup (un cop):**
1. Crear un Personal Access Token a GitHub Settings → Developer settings
   → Tokens (classic, repositori privat)
2. Afegir el token com a variable secreta a Cloudflare Pages
   (Settings → Environment variables)

**Implementacio:**
- `app/api/guardar.js` (Cloudflare Function) que:
  - Rep POST amb les dades i la contrasenya
  - Valida la contrasenya
  - Fa fetch a GitHub API per actualitzar `dades.js` o un `dades.json`
- Boto "Guardar a GitHub" a Config, protegit amb la contrasenya actual

**Avantatges:** edicio des de l'app al mobil, tots reben les dades
**Inconvenients:** cal token + Function setup, mes complexitat

### Opcio 3: Cloudflare D1 (base de dades)
- Dades a Cloudflare D1 (SQLite serverless)
- CRUD via Cloudflare Functions
- Mes escalable pero mes complex
- No recomanat per aquest projecte (overkill)

### Recomanacio
Comencar amb Opcio 1 (ja funciona).
Si es vol edicio des de l'app, implementar Opcio 2 (1-2 hores).

## NOTES PER A LA IA

- Codi en catala
- Funcions: renderitzarX()
- Sense dependencies externes
- Service worker: cache v2, actualitzar `CACHE` i FILES si s'afegeixen fitxers
- No usar localStorage per dades d'usuari (només export/import)
- `esc()` definida a main.js, NO a calendari.js
- `netejarTel()` treu espais i guions dels telefonos
- Contrasenya "peidro" (canviar si cal)
