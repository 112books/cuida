# Cuida - Punt de represa (10 maig 2026)

## Estat
Tot el codi està implementat i commitejat. Queda ÚNICAMENT el setup manual a Cloudflare i el push.

## ✅ Fet avui
- Cloudflare KV com a backend centralitzat
- Formulari d'edició a Config (contactes, cuidadors, medicació...)
- Graella simplificada amb horaris dels cuidadors
- Nous camps: empresa_cuidadora, cuidadors
- Service worker v3 (exclou /api/ del cache)

## 🔴 PENDENT — Setup manual a Cloudflare (5-10 min)

### Pas 1 — Crear KV namespace
1. Ves a https://dash.cloudflare.com
2. **Workers & Pages → KV → Create namespace**
3. Nom: `CUIDA_DADES`
4. Guarda l'ID (el necessitaràs al Pas 3)

### Pas 2 — Variable de contrasenya
1. **Workers & Pages → Pages → cuida-avi-joan**
2. **Settings → Environment variables → Add variable**
3. Tipus: **Secret** (important!)
4. Nom: `CUIDA_PASSWORD`
5. Valor: `peidro`
6. Aplica a **Production** i **Preview**

### Pas 3 — Lligar KV al projecte
1. Al mateix projecte Pages → **Settings → Functions**
2. A **KV namespace bindings** → **Add binding**
3. Variable name: `CUIDA_DADES`
4. KV namespace: selecciona `CUIDA_DADES` (creat al Pas 1)
5. Desa

### Pas 4 — Desplegar
```bash
cd /Users/joan/Documents/Obsidian/cuida.linuxbcn.cat
git push private main
```

### Pas 5 — Verificació (30-60s després del push)
1. Obre https://cuida-avi-joan.pages.dev/api/dades → ha de mostrar `{"buit":true}`
2. Obre l'app → Config → Editar dades → contrasenya "peidro"
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
