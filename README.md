# Cuida — App PWA per a la coordinació de cures

**Cuida** és una aplicació web progressiva (PWA) de codi obert per coordinar la cura d'una persona dependent en entorn domèstic. Dissenyada per a famílies que combinen cuidadores externes, família i equips mèdics.

Creada per [LinuxBCN](https://linuxbcn.com) — [Article del projecte](https://linuxbcn.com/ca/projectes/cuida/)

---

## Què fa

- **Inici** — Resum del pacient, estat general (tot d'acord / cal revisar / falta informació), accions ràpides
- **Graella** — Horari setmanal de cuidadores amb colors per rol
- **Contactes** — Equip mèdic, empresa cuidadora, proveïdors i família amb botons de trucada directa i FaceTime
- **Urgències** — Protocols pas a pas per a cada situació crítica, botó directe al 112
- **Medicació** — Llista completa de fàrmacs amb dosi, horari i notes
- **Config** — Editor de totes les dades protegit per contrasenya, export/import JSON

## Característiques tècniques

- PWA instal·lable (mobile-first, funciona offline)
- Sense dependències externes — HTML, CSS i JS vanilla
- Backend opcional: Cloudflare Pages Functions + KV per sincronitzar dades entre dispositius
- Disseny zen en grisos, tipografia IBM Plex Mono al header

---

## Desplegament ràpid (Cloudflare Pages)

### 1. Fes un fork d'aquest repositori

### 2. Connecta'l a Cloudflare Pages

- Dashboard → Workers & Pages → Create → Connect to Git
- Framework: cap (sense build command)
- Build output directory: `app`

### 3. Configura les teves dades

Edita `app/js/dades.js` i omple la plantilla amb les dades del teu cas.  
O usa el formulari integrat a la secció **Config** de l'app un cop desplegada.

### 4. (Opcional) Activa la sincronització KV

Perquè els canvis fets des de l'app es propaguin a tots els dispositius:

1. Cloudflare Dashboard → Workers & Pages → KV → Create namespace → `CUIDA_DADES`
2. Pages → el teu projecte → Settings → Environment variables → Secret: `CUIDA_PASSWORD` = la teva contrasenya
3. Pages → Settings → Functions → KV namespace bindings → Variable: `CUIDA_DADES`
4. Redesplega (git push)

Sense KV, l'app funciona igualment però les dades editades no es sincronitzen entre dispositius.

---

## Estructura

```
app/
├── index.html               # App principal (6 vistes)
├── css/estil.css            # Disseny
├── js/
│   ├── dades.js             # Dades del pacient + plantilla buida
│   ├── main.js              # Lògica principal
│   ├── calendari.js         # Graella setmanal
│   └── emmagatzematge.js    # Export/import JSON
├── functions/api/dades.js   # Backend Cloudflare KV (GET/POST)
├── service-worker.js        # Cache offline
├── manifest.json            # PWA manifest
└── robots.txt
```

## Model de dades

Les dades es defineixen a `app/js/dades.js`. Camps principals:

| Secció | Camps |
|---|---|
| `pacient` | nom, situació, telèfon, foto, nota |
| `contactes_medics` | rol, nom, telèfon, notes, prioritat |
| `rols_familiars` | rol, principal, suplent, telèfon, notes |
| `empresa_cuidadora` | nom, telèfon, responsable |
| `cuidadors` | nom, telèfon, horari (array) |
| `medicacio` | nom, dosi, horari, via, per_a_que, notes (array) |
| `proveidors` | nom, telèfon, notes (array) |
| `protocols_urgencies` | situació, passos, responsables, greu |
| `voluntats_anticipades` | existeix, on_esta |
| `graella` | fase, escenari, cuidadora, ical |

---

## Llicència

MIT — Pots usar, modificar i redistribuir lliurement.  
Si l'uses per a un projecte similar, ens agradaria saber-ho: [linuxbcn@gmail.com](mailto:linuxbcn@gmail.com)

---

*Cuida — Beta 1 · Maig 2026 · [LinuxBCN](https://linuxbcn.com)*
