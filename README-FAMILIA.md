# Cuida — Guia per a la família

Aquesta és l'app de coordinació per a la cura del Joan. Aquí trobaràs com fer servir cada funcionalitat.

**Accés:** https://cuida-avi-joan.pages.dev

---

## Com entrar

Quan obres l'app per primera vegada demana una contrasenya. Pregunta-la a la Mireia o al Joanot.

---

## Pestanyes de l'app

### Inici
La pantalla principal. Mostra:
- **Estat del pacient** — pastilla de color (verd = tot bé, taronja = cal revisar, vermell = falta info important)
- **Mode Estic Sol** — per activar quan el Joan es quedi sol
- **Oxigen** — flux actual i recordatori de l'humidificador
- **Recordatori cuidadora** — tasques diàries que ha de fer
- **Recordatoris actius** — si has activat les notificacions push

### Graella
Horari dels cuidadors de la setmana. Les franges buides indiquen que el Joan pot estar sol.

### Contactes
Tots els telèfons importants: empresa cuidadora, cuidadores, metges, proveïdors i família. Prem la icona del telèfon per trucar directament.

### Urgències
Protocols pas a pas per a cada situació. En cas de parada cardíaca o inconsciència → botó vermell **TRUCAR 112**.

### Medicació
Totes les pastilles del Joan agrupades per moment del dia. Dalt el resum ràpid, baix la fitxa completa amb dosi i notes.

### Diari
Notes del dia sobre com ha anat. **Molt important:** ompli-ho cada dia, encara que sigui breu. El metge i la família ho veuen tot.

### Config
Per editar les dades (requereix contrasenya), exportar còpia de seguretat, i consultar la guia.

---

## Mode Estic Sol

Quan el Joan es quedi sol a casa:

1. A la portada → "Mode Estic sol" → tria quantes hores (1, 2, 3 o 4)
2. Prem **Activar** (requereix contrasenya)
3. Apareix el botó verd gran **"Estic bé ✓"**

**El Joan ha de prémer "Estic bé" abans que s'esgoti el temps.**

Si no prem el botó → al cap de màxim 15 minuts → **tota la família que tingui les notificacions activades rep una alerta al mòbil.**

Per cancel·lar el mode: prem "Estic bé" o "Cancel·lar el mode".

---

## Activar les notificacions push

Per rebre les notificacions de medicació i les alertes d'Estic Sol al teu mòbil:

1. Obre l'app al teu mòbil
2. A la portada → "Recordatoris de medicació" → escriu el teu nom
3. Prem **Activar** → el mòbil demanarà permís → accepta

Des d'aquell moment rebràs:
- **8:00h** — Pastilles del matí
- **13:30h** — Pastilles del migdia
- **21:00h** — Pastilles del vespre
- **Alerta SOS** — si el mode Estic Sol s'esgota sense confirmació

Funciona fins i tot amb la pantalla apagada i l'app tancada.

> **iOS:** Cal tenir l'app instal·lada a la pantalla d'inici (Safari → Compartir → Afegir a la pantalla d'inici). Requereix iOS 16.4 o superior.

Per cancel·lar les notificacions: torna a la portada → "Recordatoris actius" → "Cancel·lar recordatoris".

---

## Diari de seguiment

Cada dia, algú de la família (o el propi Joan) hauria d'escriure una nota breu:

1. Pestanya **Diari** → "Afegir nota d'avui"
2. Tria l'estat: **Bé** / **A vigilar** / **Urgent**
3. Escriu unes línies de com ha anat
4. Opcionalment, registra constants: tensió, saturació O₂, pes
5. Prem **Guardar** (requereix contrasenya)

Les notes les veu tota la família i són útils per als metges.

---

## Editar les dades

Si canvia algun contacte, medicament o horari:

1. Pestanya **Config** → "Editar dades"
2. Introdueix la contrasenya
3. Modifica el que calgui
4. Prem **Guardar a Cloudflare**

Els canvis es propaguen a tots els dispositius en la propera recàrrega.

---

## Còpia de seguretat

Pestanya **Config** → "Còpia de seguretat" → "Exportar JSON"

Guarda el fitxer descarregat en un lloc segur (núvol, mail...). Per restaurar: "Importar" al mateix apartat.

---

*Cuida · Família Martínez-Peidro · Maig 2026*
