# Novetats Cuida — Beta 2 (Maig 2026)

Contingut preparat per afegir a https://linuxbcn.com/ca/projectes/cuida/

---

## Què hi ha de nou a la Beta 2

Des de la Beta 1, l'app ha crescut amb tres funcionalitats noves pensades des de la necessitat real del dia a dia de cuidar el Joan:

### Diari de seguiment diari

Cada membre de la família (o el propi pacient) pot escriure una nota breu del dia directament des de l'app. L'entrada inclou un estat visual (Bé / A vigilar / Urgent), text lliure i opcionalment les constants vitals del dia: tensió arterial, saturació d'oxigen i pes.

Les notes es guarden de forma compartida — tothom les pot llegir en qualsevol moment, i serveixen com a registre per als metges. L'app guarda els últims 90 dies d'entrades. Si algú obre l'app i avui no hi ha nota, la portada ho recorda.

### Recordatoris de pastilles (notificacions push)

L'app ara pot enviar una notificació al mòbil quan toca prendre les pastilles: a les 8h del matí, a les 13:30h i a les 21h del vespre. La notificació arriba fins i tot amb la pantalla apagada i l'app tancada.

Cada membre de la família s'apunta des de la portada: escriu el seu nom i prem "Activar". Des d'aquell moment rep els avisos al seu mòbil.

El sistema funciona completament sense serveis externs com Firebase o Twilio. Usa l'estàndard Web Push (W3C) amb claus VAPID pròpies i un cron de GitHub Actions per disparar les notificacions a l'hora exacta.

### Mode "Estic Sol"

Pensada específicament per al Joan, que és lúcid però pot quedar sol a casa durant hores. Quan s'activa el mode, apareix un temporitzador (de 1 a 4 hores) i un botó verd gran: **"Estic bé ✓"**.

Si el Joan (o la cuidadora) no prem el botó abans que s'esgoti el temps, l'app avisa automàticament a tota la família que té les notificacions activades. L'alerta arriba com a notificació push d'alta prioritat, amb vibració llarga, i es queda visible fins que algú la tanca.

El sistema comprova l'estat cada 15 minuts via GitHub Actions. No depèn que cap dispositiu estigui encès ni connectat.

---

## Millores tècniques i de seguretat

- **Seguretat auditada** — L'app va passar per una auditoria de seguretat completa (5 dimensions en paral·lel): autenticació, gestió de dades sensibles, capçaleres HTTP, CORS i control d'accés.
- **Fonts auto-allotjades** — IBM Plex Mono s'inclou al propi projecte. Cap petició a Google Fonts, cap traçabilitat externa.
- **Comparació de contrasenyes en temps constant** — resistència a timing attacks.
- **Impressió optimitzada** — Les pàgines de contactes i medicació es poden imprimir en format llegible per tenir en paper a casa.
- **Icona PWA** — La foto del Joan Martínez de jove, coloritzada, com a icona de l'app instal·lada.

---

## L'arquitectura en una frase

Una PWA de HTML/CSS/JS vanilla, desplegada a Cloudflare Pages, que guarda les dades al teu propi repositori privat de GitHub via API, sense cap base de dades, sense cap servidor propi, i amb notificacions push que funcionen sense Firebase ni cap servei de pagament.

---

## Properes funcionalitats previstes

- **Seguiment de constants** — gràfics de tensió, saturació i pes al llarg del temps
- **Informe setmanal** — resum exportable per portar al metge
- **Botó SOS familiar** — un sol tap per alertar els familiars per ordre de rang
- **Recordatoris al WhatsApp** — integració amb l'API oficial de Meta (en avaluació)

---

*Cuida és codi obert (MIT). El codi públic (sense dades personals) és a github.com/112books/cuida.*
