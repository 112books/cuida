# Cuida — App PWA per a la coordinació de cures

**Cuida** és una aplicació web progressiva (PWA) de codi obert per coordinar la cura d'una persona dependent en entorn domèstic. Dissenyada per a famílies que combinen cuidadores externes, família i equips mèdics.

Creada per [LinuxBCN](https://linuxbcn.com) a partir d'una necessitat real — [Article del projecte](https://linuxbcn.com/ca/projectes/cuida/)

---

## Funcionalitats

### Informació i coordinació
- **Inici** — Resum del pacient, pastilla d'estat (tot d'acord / cal revisar / crític), widget d'oxigen, recordatori diari de la cuidadora
- **Graella** — Horari setmanal de cuidadores amb colors per rol
- **Contactes** — Equip mèdic, empresa cuidadora, proveïdors i família amb trucada directa i FaceTime
- **Urgències** — Protocols pas a pas per a cada situació crítica, botó directe al 112
- **Medicació** — Resum per àpat (Matí / Migdia / Nit / Puntual) + fitxa completa amb dosi, horari i alertes
- **Config** — Editor complet protegit per contrasenya, export/import JSON

### Diari de seguiment
- Nota diària amb estat (Bé / A vigilar / Urgent) i text lliure
- Constants vitals opcionals: tensió arterial, saturació O₂, pes
- Historial dels últims 90 dies visible per a tota la família
- Invitació a la portada si avui no hi ha nota

### Notificacions push (app tancada)
- Recordatoris automàtics de medicació a les **8h, 13:30h i 21h**
- Cada membre de la família s'subscriu des de la portada amb el seu nom
- Funciona fins i tot amb el mòbil bloquejat (Android + iOS 16.4+ instal·lada)
- Sense serveis de tercers — Cloudflare + GitHub Actions

### Mode Estic Sol
- El pacient activa un temporitzador (1, 2, 3 o 4 hores) quan es queda sol
- Botó gran verd "Estic bé" per confirmar que tot va bé
- Si el temps s'esgota sense confirmació → **notificació SOS** a tota la família
- Comprovació automàtica cada 15 minuts via GitHub Actions

---

## Característiques tècniques

- PWA instal·lable (mobile-first, funciona offline amb service worker)
- Sense dependències externes — HTML, CSS i JS vanilla
- Backend: **Cloudflare Pages Functions + GitHub API** per sincronitzar dades entre dispositius
- Notificacions push: **Web Push API + VAPID** (estàndard W3C, sense Firebase ni serveis externs)
- Cron: **GitHub Actions** per als recordatoris i check del mode Estic Sol
- Seguretat: CSP, HSTS, X-Frame-Options, Referrer-Policy, comparació de contrasenyes en temps constant
- Tipografia IBM Plex Mono (auto-allotjada, sense Google Fonts)

---

## Desplegament (Cloudflare Pages)

### 1. Fork del repositori

### 2. Connecta a Cloudflare Pages

- Dashboard → Workers & Pages → Create → Connect to Git
- Framework: cap · Build command: buit · Build output: `app`

### 3. Configura les dades del pacient

Edita `app/js/dades.js` amb les dades del teu cas (o usa l'editor integrat a Config un cop desplegada).

### 4. Variables d'entorn a Cloudflare Pages

| Variable | Descripció |
|---|---|
| `GITHUB_TOKEN` | Token GitHub amb permís `repo` (read + write) al teu repo privat |
| `CUIDA_PASSWORD` | Contrasenya per editar les dades des de l'app |
| `VAPID_PUBLIC_KEY` | Clau pública VAPID (genera-la amb `node scripts/generar-claus-vapid.js`) |
| `VAPID_PRIVATE_KEY` | Clau privada VAPID en format JWK JSON |
| `VAPID_SUBJECT` | `mailto:el-teu-email@exemple.com` |
| `CRON_SECRET` | Paraula de pas aleatòria per autenticar els crons |

Per generar les claus VAPID: `node scripts/generar-claus-vapid.js`

### 5. Secrets a GitHub Actions

Al teu repo → Settings → Secrets → Actions:

| Secret | Valor |
|---|---|
| `CRON_SECRET` | La mateixa que a Cloudflare |
| `CUIDA_URL` | `https://el-teu-projecte.pages.dev` |

### 6. Redesplega i prova

Puja els canvis, espera el deploy de Cloudflare, i verifica que `/api/dades` retorna JSON.

---

## Estructura del projecte

```
app/
├── index.html                    # App (7 vistes)
├── css/estil.css                 # Disseny (grisos, mobile-first)
├── css/fonts/                    # IBM Plex Mono auto-allotjada
├── js/
│   ├── dades.js                  # Dades del pacient + plantilla buida
│   ├── main.js                   # Lògica: renderitzarX(), diari, estic sol, push
│   ├── calendari.js              # Graella setmanal
│   ├── emmagatzematge.js         # Sync remot, export/import JSON
│   └── traduccions.js            # Textos
├── icones/                       # Icones PWA (192 i 512px)
├── imatges/                      # Foto del pacient
├── service-worker.js             # Cache offline + handler push + notificació SOS
├── manifest.json                 # PWA manifest
└── _headers                      # Capçaleres de seguretat Cloudflare

functions/api/
├── dades.js                      # GET/POST dades principals (GitHub API)
├── suscripcions.js               # CRUD subscripcions push (data/subs.json)
├── notificacions.js              # Envia push de medicació (cridat pel cron)
├── estic-be.js                   # Confirma "estic bé" (sense auth)
└── estic-sol-check.js            # Comprova timeout estic sol, dispara SOS

.github/workflows/
├── notificacions.yml             # Cron 8h, 13:30h, 21h → recordatoris medicació
└── estic-sol.yml                 # Cron cada 15 min → check mode estic sol

scripts/
└── generar-claus-vapid.js        # Generador de claus VAPID (una sola vegada)
```

## Model de dades

Definit a `app/js/dades.js`. Camps principals:

| Secció | Descripció |
|---|---|
| `pacient` | nom, situació, telèfon, foto, nota |
| `contactes_medics` | rol, nom, telèfon, notes, prioritat |
| `rols_familiars` | rol, principal, suplent, telèfon, notes |
| `empresa_cuidadora` | nom, telèfon, responsable |
| `cuidadors` | nom, telèfon, horari (array) |
| `medicacio` | nom, dosi, horari, via, per_a_que, notes, moment (array) |
| `proveidors` | nom, telèfon, notes (array) |
| `protocols_urgencies` | situació, passos, responsables, greu (array) |
| `oxigen` | flux (l/min), notes humidificador |
| `tasques_cuidadora` | llista de recordatoris diaris (array) |
| `diari` | entrades diàries: data, estat, text, constants vitals (array) |
| `estic_sol` | actiu, fins, activat, alerta |
| `voluntats_anticipades` | existeix, on_esta |
| `graella` | fase, escenari, cuidadora, ical |

---

## Seguretat i privacitat

- Les dades del pacient es guarden al **teu propi repo privat de GitHub** — cap empresa externa les té
- Login client-side + contrasenya API separada per a les escriptures
- Comparació de contrasenyes en temps constant (resistència a timing attacks)
- Headers: `noindex`, CSP, HSTS, X-Frame-Options, Referrer-Policy
- Les subscripcions push es guarden a `data/subs.json` (fora del directori públic)

---

## Llicència

MIT — Pots usar, modificar i redistribuir lliurement.
Si l'uses per a un projecte similar, ens agradaria saber-ho: [linuxbcn@gmail.com](mailto:linuxbcn@gmail.com)

---

*Cuida — Beta 2 · Maig 2026 · [LinuxBCN](https://linuxbcn.com)*
