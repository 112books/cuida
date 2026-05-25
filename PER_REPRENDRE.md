# Cuida - Punt de represa (10 maig 2026)

## Estat
Tot el codi està implementat i commitejat. Queda ÚNICAMENT el setup manual a Cloudflare i el push.

## ✅ Fet avui
- Cloudflare KV com a backend centralitzat
- Formulari d'edició a Config (contactes, cuidadors, medicació...)
- Graella simplificada amb horaris dels cuidadors
- Nous camps: empresa_cuidadora, cuidadors
- Service worker v3 (exclou /api/ del cache)

## 🔴 PENDENT — Setup (sense dades bancàries)

### Pas 1 — Crear token de GitHub (5 min)
1. Ves a https://github.com/settings/tokens
2. **Generate new token → Generate new token (classic)**
3. Nom: `cuida-app`
4. Expiració: **No expiration** (o 1 any)
5. Scope: marca **`repo`** (accés complet als repositoris privats)
6. **Generate token** → copia el token (només es veu un cop!)

### Pas 2 — Afegir variables a Cloudflare Pages (gratuït, sense bank)
1. Ves a https://dash.cloudflare.com
2. **Workers & Pages → Pages → cuida-avi-joan**
3. **Settings → Environment variables → Add variable**
4. Afegeix aquestes dues variables (tipus **Secret** les dues):
   - Nom: `GITHUB_TOKEN` · Valor: *el token del Pas 1*
   - Nom: `CUIDA_PASSWORD` · Valor: *la contrasenya de l'app*
5. Aplica a **Production** i **Preview**
6. Desa

### Pas 3 — Desplegar
```bash
cd /Users/joan/Documents/Obsidian/cuida.linuxbcn.cat
git push private main
```

### Pas 4 — Verificació (30-60s després del push)
1. Obre https://cuida-avi-joan.pages.dev/api/dades → ha de mostrar el JSON de les dades
2. Obre l'app → Config → Editar dades → introdueix la contrasenya configurada
3. Modifica alguna cosa → Guardar a Cloudflare → missatge d'èxit
4. Recarrega → el canvi es manté ✓
5. Obre en un altre dispositiu → veu el canvi ✓

## Fitxers clau del codi implementat
- `app/functions/api/dades.js` — backend KV (NOU)
- `app/js/main.js` — formulari edició, carregarDades async
- `app/js/dades.js` — model amb empresa_cuidadora i cuidadors
- `app/js/emmagatzematge.js` — carregarRemot(), guardarRemot()
- `app/js/calendari.js` — graella amb cuidadors (sense escenaris A/B)
- `app/css/estil.css` — estils formulari i graella nous
- `app/service-worker.js` — v3, exclou /api/

## Si alguna cosa falla
```bash
git revert HEAD && git push private main
```
Torna a la versió anterior. KV no s'esborra però l'app deixa d'usar-lo.
