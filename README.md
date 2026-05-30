# Cuida — Family Caregiving Coordination PWA

**[English](#english)** · **[Català](#català)**

> Free, open-source PWA to coordinate care for a dependent person at home. No subscriptions. No third-party databases. Your data stays in your own private GitHub repo.

Made by [LinuxBCN](https://linuxbcn.com) from a real need — [Project article](https://linuxbcn.com/ca/projectes/cuida/)

---

## English

### What it does

| Feature | Description |
|---|---|
| **Patient summary** | Status badge (OK / Watch / Critical), oxygen widget, daily caregiver reminders |
| **Contacts** | Medical team, caregivers, providers, family — direct call + FaceTime buttons, printable |
| **Emergency protocols** | Step-by-step guides for each critical situation (pain, dyspnea, empty oxygen, SOS), direct 112/911 button |
| **Medication** | Grouped by meal (Morning / Noon / Evening / As needed) with dose, route and notes, printable |
| **Caregiver schedule** | Weekly grid with color-coded roles |
| **Daily diary** | Notes with status flag, optional vital signs (BP, O₂ sat, weight), 90-day scrollable history |
| **Push notifications** | Medication reminders at configurable times — works with screen locked (Android + iOS 16.4+) |
| **"I'm alone" mode** | Patient activates a 1–4h timer; if not confirmed in time → SOS push to whole family |
| **Config editor** | Password-protected full data editor + JSON export/import for backup |

### Why no backend service?

Everything runs on free-tier infrastructure you control:

- **Cloudflare Pages** — hosts the app and serverless API functions (free tier: 100k req/day)
- **GitHub API** — stores and syncs patient data in your private repo (no database needed)
- **Web Push / VAPID** — W3C standard push notifications without Firebase or any paid service
- **GitHub Actions** — runs the medication reminder cron and the I'm-alone check (free for public + private repos)

### Deploy in 6 steps

**1. Fork this repo and make it private**

Your fork holds your patient's data. Keep it private.

**2. Connect to Cloudflare Pages**

Dashboard → Workers & Pages → Create → Connect to Git
- Framework: none · Build command: *(empty)* · Build output: `app`

**3. Generate VAPID keys** (for push notifications)

```bash
node scripts/generar-claus-vapid.js
```

**4. Set Cloudflare environment variables**

| Variable | Description |
|---|---|
| `GITHUB_TOKEN` | GitHub token with `repo` scope (read + write) on your private fork |
| `CUIDA_PASSWORD` | Password to edit patient data from the app |
| `VAPID_PUBLIC_KEY` | Public VAPID key (from step 3) |
| `VAPID_PRIVATE_KEY` | Private VAPID key in JWK JSON format (from step 3) |
| `VAPID_SUBJECT` | `mailto:your@email.com` |

**5. Set GitHub Actions secret**

Repo → Settings → Secrets → Actions → New repository secret:

| Secret | Value |
|---|---|
| `CUIDA_URL` | `https://your-project.pages.dev` |

**6. Set your cron auth token**

Generate a random token:
```bash
openssl rand -hex 32
```

Put the same value in these three places:
- `.github/workflows/_cron-token.txt`
- `functions/api/notificacions.js` → `const CRON_TOKEN = '...'`
- `functions/api/estic-sol-check.js` → `const CRON_TOKEN = '...'`

Then enable the cron schedule in both `.github/workflows/*.yml` files by adding:
```yaml
on:
  schedule:
    - cron: '0 6 * * *'    # 8:00 local (adjust to UTC offset)
    - cron: '30 11 * * *'  # 13:30 local
    - cron: '0 19 * * *'   # 21:00 local
```

Redeploy → verify `/api/dades` returns JSON → done.

### Project structure

```
app/
├── index.html              # App (7 views, single page)
├── css/estil.css           # Design (grays, mobile-first)
├── css/fonts/              # IBM Plex Mono self-hosted
├── js/
│   ├── dades.js            # Patient data model + empty template
│   ├── main.js             # Logic: render, diary, I'm alone, push
│   ├── calendari.js        # Weekly caregiver grid
│   └── emmagatzematge.js   # Remote sync, JSON export/import
├── service-worker.js       # Offline cache + push handler + SOS notification
└── manifest.json           # PWA manifest

functions/api/
├── dades.js                # GET/POST main data (GitHub API)
├── suscripcions.js         # CRUD push subscriptions
├── notificacions.js        # Send medication push (called by cron)
├── estic-be.js             # Confirm "I'm OK" (no auth needed)
└── estic-sol-check.js      # Check I'm-alone timeout, trigger SOS

.github/workflows/
├── notificacions.yml       # Medication reminder cron (3×/day)
├── estic-sol.yml           # I'm-alone check every 15 min
└── _cron-token.txt         # Auth token — replace with your own value
```

### Privacy & security

- Patient data lives in **your own private GitHub repo** — no third party stores it
- Client-side login + separate API password for writes
- Constant-time password comparison (timing attack resistant)
- Security headers: CSP, HSTS, X-Frame-Options, Referrer-Policy
- `noindex` — the app won't appear in search engines
- Push subscriptions stored in `data/subs.json` (outside the public web directory)

### License

MIT — Free to use, modify and redistribute.  
If you use it for a similar project, we'd love to hear about it: [linuxbcn@gmail.com](mailto:linuxbcn@gmail.com)

---

## Català

**Cuida** és una aplicació web progressiva (PWA) de codi obert per coordinar la cura d'una persona dependent en entorn domèstic. Dissenyada per a famílies que combinen cuidadores externes, família i equips mèdics.

### Funcionalitats

- **Inici** — Resum del pacient, pastilla d'estat (tot d'acord / cal revisar / crític), widget d'oxigen, recordatori diari de la cuidadora
- **Graella** — Horari setmanal de cuidadores amb colors per rol
- **Contactes** — Equip mèdic, empresa cuidadora, proveïdors i família amb trucada directa i FaceTime, imprimible
- **Urgències** — Protocols pas a pas per a cada situació crítica, botó directe al 112
- **Medicació** — Resum per àpat (Matí / Migdia / Nit / Puntual) + fitxa completa, imprimible
- **Diari** — Notes diàries amb estat i constants vitals (TA, saturació, pes), historial 90 dies
- **Notificacions push** — Recordatoris automàtics de medicació, funciona amb mòbil bloquejat (Android + iOS 16.4+)
- **Mode Estic Sol** — Timer 1–4h amb SOS automàtic a tota la família si no hi ha confirmació
- **Config** — Editor complet protegit per contrasenya, export/import JSON

### Desplegament

Segueix els 6 passos de la secció anglesa — les instruccions s'apliquen igual.

### Model de dades (`app/js/dades.js`)

`pacient` · `contactes_medics` · `rols_familiars` · `empresa_cuidadora` · `cuidadors` · `medicacio` (amb `moments` array: esmorzar/dinar/sopar/altres/continu) · `proveidors` · `protocols_urgencies` · `oxigen` · `tasques_cuidadora` · `diari` · `estic_sol` · `voluntats_anticipades` · `graella`

---

*Cuida — Beta 2 · Maig 2026 · [LinuxBCN](https://linuxbcn.com)*
