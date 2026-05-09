# Disseny: Dades centralitzades amb Cloudflare KV

**Data:** 2026-05-10
**Estat:** Aprovat, pendent d'implementació

## Resum

Substituir el model actual (dades hardcodejades a `dades.js`, canvis via commit+redeploy) per un sistema on les dades viuen a **Cloudflare KV** i un familiar de referència les pot editar des d'un formulari dins l'app, sense tocar codi.

## Context i problema actual

- Les dades (`DADES_INICIALS`) viuen a `app/js/dades.js` al repositori privat
- Per canviar un telèfon o una dosi cal fer un commit i esperar el redesplegament (1-2 min)
- L'export/import JSON era l'única manera de compartir canvis entre dispositius
- Tots els familiars veuen les mateixes dades un cop desplegat, però ningú pot editar sense accés al Git

## Solució escollida: Cloudflare KV + Pages Function

### Arquitectura

```
Cloudflare Pages (cuida-avi-joan.pages.dev)
├── app/                    ← estàtic (HTML/CSS/JS), igual que ara
└── functions/
    └── api/
        └── dades.js        ← Pages Function (backend mínim)

Cloudflare KV Namespace: CUIDA_DADES
└── clau "dades"  →  tot el JSON de les dades de l'app
```

### Flux de lectura (tots els dispositius)

1. L'app carrega → `carregarDades()` fa `fetch('/api/dades')`
2. El Worker llegeix KV → retorna el JSON
3. Si KV és buit (primer cop) → el Worker retorna `DADES_INICIALS` del codi
4. Si hi ha error de xarxa → fallback a `DADES_INICIALS` local (offline)

### Flux d'edició (familiar de referència)

1. Obre Config → "Editar dades" → introdueix contrasenya
2. Formulari pre-omplert amb les dades actuals
3. Fa els canvis → prem "Guardar a Cloudflare"
4. App fa POST a `/api/dades` amb `{ password, dades }`
5. Worker valida contrasenya → escriu a KV → retorna `{ ok: true }`
6. App mostra confirmació i recarrega les dades

### Seguretat

- Contrasenya validada al Worker (variable d'entorn `CUIDA_PASSWORD`, mai al codi client)
- KV: lectura pública (GET sense autenticació), escriptura protegida per contrasenya
- Acceptable per a dades de salut familiar no crítiques en un entorn privat

### Latència

- Lectura des de KV: < 100ms (edge Cloudflare)
- Els canvis es veuen a la propera recàrrega de qualsevol dispositiu (~immediat)

---

## Model de dades: canvis

S'afegeixen dues noves claus a `DADES_INICIALS` i `PLANTILLA_BUIDA`:

```js
empresa_cuidadora: {
  nom: '',
  telefon: '',
  responsable: ''
}

cuidadors: [
  { nom: '', telefon: '', horari: '' }
  // ex: { nom: 'Esperança', telefon: '+34 696 830 060', horari: 'dl-ds 9-12h i 16-19h' }
]
```

---

## Seccions editables via formulari

| Secció | Camps |
|--------|-------|
| Pacient | nom, situació, telèfon, nota |
| Empresa cuidadora | nom, telèfon, responsable |
| Cuidadors | llista: nom, telèfon, horari (afegir/eliminar) |
| Contactes mèdics | llista: rol, nom, telèfon, notes (afegir/eliminar) |
| Proveïdors | llista: nom, telèfon, notes (afegir/eliminar) |
| Família | llista: rol, principal, telèfon, notes |
| Medicació | llista: nom, dosi, horari, via, per a què, notes |

### Seccions que NO s'editen via formulari

- Protocols d'urgències (estructura complexa, canvis rars)
- Graella / iCal (canvis rars)
- Voluntats anticipades (canvis rars)

Aquestes continuen editant-se directament a `dades.js` quan calgui.

---

## Graella setmanal: simplificació

La Graella elimina els escenaris A/B (ja no rellevants, pacient a casa). Mostra:

- L'horari de cada cuidador/a de l'empresa (del camp `cuidadors`)
- Les franges sense cobertura (pacient sol) ressaltades visualment

El camp `horari` és text lliure (ex: "dl-ds 9-12h i 16-19h") — el renderitzador el mostra sense analitzar sintàcticament.

---

## Canvis a la secció Config

### Eliminat
- Botó "Importar" (ja no necessari amb KV centralitzat)

### Es queda
- Botó "Exportar" → backup manual en JSON

### Nous apartats (collapsibles com la resta)

**"Editar dades"**
- Formulari d'edició complet (darrere de contrasenya)
- Botó "Guardar a Cloudflare"
- Botó "Cancel·lar"

**"Guia de l'editor"**
- Com editar dades i guardar
- Quan els altres veuen els canvis
- Com fer una còpia de seguretat (export JSON)

**"Configuració inicial (admin)"**
- Guia pas a pas per fer el setup a Cloudflare (vegeu secció següent)

---

## Guia de configuració inicial a Cloudflare (un cop)

### Pas 1: Crear el KV Namespace

1. Ves a [dash.cloudflare.com](https://dash.cloudflare.com)
2. Selecciona el teu compte → **Workers & Pages** → **KV**
3. Crea un nou namespace amb nom: `CUIDA_DADES`
4. Anota l'**ID** del namespace (el necessitaràs al pas 3)

### Pas 2: Afegir la variable de contrasenya

1. Ves a **Workers & Pages** → selecciona el projecte `cuida-avi-joan`
2. **Settings** → **Environment variables**
3. Afegeix una variable de tipus **Secret**:
   - Nom: `CUIDA_PASSWORD`
   - Valor: `peidro` (o la contrasenya que vulguis)
4. Desa els canvis

### Pas 3: Lligar el KV al projecte

1. Al mateix projecte Pages → **Settings** → **Functions**
2. A l'apartat **KV namespace bindings**, afegeix:
   - Variable name: `CUIDA_DADES`
   - KV namespace: selecciona `CUIDA_DADES` (el que has creat al pas 1)
3. Desa els canvis

### Pas 4: Desplegar

```bash
git add -A && git commit -m "afegir cloudflare KV i formulari edició" && git push private main
```

Cloudflare Pages detecta automàticament la carpeta `functions/` i desplega la Function.

### Verificació

Obre `https://cuida-avi-joan.pages.dev/api/dades` al navegador — hauries de veure el JSON de les dades.

---

## Fitxers afectats

| Fitxer | Canvi |
|--------|-------|
| `functions/api/dades.js` | **NOU** — Pages Function (GET/POST) |
| `app/js/dades.js` | Afegir `empresa_cuidadora` i `cuidadors` |
| `app/js/main.js` | `carregarDades()` async amb fetch; formulari edició; nova secció contactes; graella simplificada |
| `app/js/emmagatzematge.js` | Afegir `guardarRemot(dades, password)` |
| `app/index.html` | Nou apartat a Config per al formulari |
| `app/service-worker.js` | Excloure `/api/dades` del cache |

---

## Decisions descartades

- **GitHub API via Worker:** descartada per complexitat (token GitHub, redeploy 2 min)
- **Cloudflare D1:** descartada (overkill per a un blob JSON)
- **Import/export com a solució principal:** descartada (manual, fàcil oblidar)
- **Formulari només local (localStorage):** descartada (no centralitzat)
