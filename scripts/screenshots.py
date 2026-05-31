#!/usr/bin/env python3
"""Captura screenshots amb dades de demo (noms ficticis, sense dades reals)."""
import os
import re
import threading
import http.server
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = Path(__file__).parent.parent
APP  = BASE / 'app'
OUT  = BASE / 'screenshots'
DADES_PATH = APP / 'js' / 'dades.js'

# Dades demo — noms i telèfons ficticis, dades mèdiques genèriques
DEMO_JS = r"""const DADES_INICIALS={
  pacient:{nom:'Antoni Garcia Puig',situacio:'A casa',
    nota:'Insuficiència cardíaca i MPOC. Oxigen continu. Morfina. Equip PADES.',
    telefon:'+34 600 000 000',foto:''},
  contactes_medics:[
    {rol:'Equip PADES',nom:'Eva — Unitat Cronicitat',telefon:'+34 600 111 222',notes:'Referent principal.',prioritat:'alta'},
    {rol:'Metge capçalera',nom:'Dra. Montserrat Roca',telefon:'+34 600 333 444',notes:'Receptes i certificats.',prioritat:'alta'},
    {rol:'Cardiòleg',nom:'Dr. Pau Ferrer — Hospital',telefon:'+34 600 555 666',notes:'Seguiment cardíac.',prioritat:'mitjana'},
    {rol:'Teleassistència',nom:'',telefon:'',notes:'Dispositiu instal·lat. Botó SOS.',prioritat:'alta'}
  ],
  rols_familiars:[
    {rol:'Referent mèdic',principal:'Maria Garcia',suplent:'Pau',telefon:'+34 610 000 001',notes:'Visites i decisions.'},
    {rol:'Coordinadora',principal:'Maria',suplent:'',telefon:'+34 610 000 001',notes:'Punt de referència familiar.'},
    {rol:'Suport logístic',principal:'Pau Garcia',suplent:'',telefon:'+34 620 000 002',notes:'Cotxe i compres.'},
    {rol:'Família',principal:'Rosa Garcia',suplent:'',telefon:'+34 630 000 003',notes:''}
  ],
  medicacio:[
    {nom:'Omeprazol 20mg',dosi:'1 càpsula',horari:'Cada 24h',via:'Oral',per_a_que:'Protecció gàstrica',notes:'',moments:['esmorzar']},
    {nom:'Furosemida 40mg',dosi:'1 comprimit',horari:'Cada 24h',via:'Oral',per_a_que:'Retenció de líquids',notes:'',moments:['esmorzar']},
    {nom:'Atorvastatina 40mg',dosi:'1 comprimit',horari:'Cada 24h',via:'Oral',per_a_que:'Colesterol',notes:'',moments:['sopar']},
    {nom:'Quetiapina 25mg',dosi:'2 comprimits',horari:'Cada 24h',via:'Oral',per_a_que:'Son',notes:'',moments:['sopar']},
    {nom:'MST Continus 10mg',dosi:'1 comprimit',horari:'Cada 12h',via:'Oral',per_a_que:'Dolor crònic (morfina)',notes:'Pauta PADES.',moments:['altres']},
    {nom:'Oramorph',dosi:'Pauta PADES',horari:'Si cal',via:'Oral',per_a_que:'Dolor irruptiu',notes:'Preguntar PADES dosi.',moments:['altres']},
    {nom:'Oxigen continu',dosi:'2 L/min',horari:'24 hores',via:'Ulleres nasals',per_a_que:'Insuficiència respiratòria',notes:'',moments:['continu']}
  ],
  voluntats_anticipades:{existeix:'Sí',on_esta:'Arxiu familiar'},
  protocols_urgencies:[
    {situacio:'URGÈNCIA GREU (aturada, inconsciència)',
     passos:[{text:'Activar teleassistència — prémer la medalla'},{text:'Si no funciona, TRUCAR 112',tel:'112'},{text:'Avisar coordinadora familiar'}],
     responsables:['Maria','Pau'],greu:true},
    {situacio:'Dolor irruptiu',
     passos:[{text:'Administrar Oramorph (pauta PADES)'},{text:'Si no millora, trucar PADES',tel:'+34600111222'}],
     responsables:['Maria','Rosa'],greu:false},
    {situacio:'Problema respiratori (dispnea)',
     passos:[{text:'Atrovent inhalat si cal'},{text:'Verificar flux oxigen (2 L/min)'},{text:'Si no millora, trucar 112',tel:'112'}],
     responsables:['Cuidadora','Maria'],greu:false},
    {situacio:'Oxigen s\'acaba / contenidor buit',
     passos:[{text:'Trucar proveïdor oxigen',tel:'+34900400100'},{text:'Si urgent, trucar PADES',tel:'+34600111222'}],
     responsables:['Maria'],greu:false}
  ],
  pla_avia:{principi:'',contacte:''},
  indicadors_desgast:['Excés de càrrega en cuidadora','Tensió familiar'],
  graella:{fase:'crítica',escenari:'A',cuidadora:'3h matí + 3h tarda (dl-ds)',ical:''},
  proveidors:[
    {nom:'Farmàcia Central',telefon:'+34 600 777 888',notes:''},
    {nom:'Proveïdor oxigen',telefon:'+34 900 400 100',notes:'Oxigen continu.'},
    {nom:'Supermercat',telefon:'+34 600 999 000',notes:'Compra setmanal.'}
  ],
  empresa_cuidadora:{nom:'Cuidadors Associats SL',telefon:'+34 652 000 000',responsable:'Montserrat'},
  cuidadors:[
    {nom:'Yolanda',telefon:'+34 600 100 200',horari:'Dll-Dv 10-13h'},
    {nom:'Carmen',telefon:'+34 600 300 400',horari:'Ds 10-14h'}
  ],
  oxigen:{flux:'2',notes:'Ulleres nasals 24h. Humidificador: reomplir amb AIGUA FILTRADA.'},
  tasques_cuidadora:[
    'Revisar nivell d\'aigua humidificador oxigen',
    'Verificar càrrega bateries màquines',
    'Confirmar medicació del matí presa'
  ],
  diari:[
    {data:'2026-05-30',estat:'revisar',text:'Ha dormit poc. Lleugera dispnea al matí, millora amb oxigen. Pres tota la medicació.',constants:{tensio:'130/80',saturacio:'94',pes:'72.5'}},
    {data:'2026-05-29',estat:'ok',text:'Bon dia en general. Ha menjat bé. Visita PADES sense novetat.',constants:{tensio:'125/78',saturacio:'95',pes:'72.3'}}
  ],
  estic_sol:{actiu:false,fins:null,activat:null,alerta:false}
};"""

# ── Patch temporal dades.js ────────────────────────────────────────────────
original = DADES_PATH.read_text()
patched = re.sub(
    r'^const DADES_INICIALS=\{.*?\};',
    DEMO_JS,
    original, flags=re.MULTILINE | re.DOTALL
)
assert patched != original, 'ERROR: patch no ha funcionat'
DADES_PATH.write_text(patched)
print('dades.js patchejat (dades demo)')

try:
    # ── Servidor local ─────────────────────────────────────────────────────
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(APP), **kwargs)
        def do_GET(self):
            if self.path.startswith('/api/'):
                self.send_response(500); self.end_headers()
                return
            super().do_GET()
        def log_message(self, *args): pass

    server = http.server.HTTPServer(('localhost', 0), Handler)
    port = server.server_address[1]
    t = threading.Thread(target=server.serve_forever)
    t.daemon = True
    t.start()
    print(f'Servidor a http://localhost:{port}')

    # ── Playwright ─────────────────────────────────────────────────────────
    views = [
        ('inici',       '01-inici'),
        ('medicacio',   '02-medicacio'),
        ('urgencies',   '03-urgencies'),
        ('contactes',   '04-contactes'),
        ('diari',       '05-diari'),
        ('graella',     '06-graella'),
    ]

    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(
            viewport={'width': 390, 'height': 844},
            device_scale_factor=2,
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
            locale='ca-ES',
        )
        page = ctx.new_page()
        page.goto(f'http://localhost:{port}/')
        page.wait_for_selector('#pantalla-login', timeout=5000)
        page.evaluate("document.getElementById('pantalla-login').style.display='none'")
        time.sleep(2.2)

        for vista_id, name in views:
            if vista_id != 'inici':
                page.evaluate(f"canviarVista('{vista_id}')")
                page.wait_for_selector(f'#vista-{vista_id}.activa', timeout=3000)
                time.sleep(0.8)

            out_path = OUT / f'{name}.png'
            page.screenshot(path=str(out_path), full_page=False)
            print(f'Capturada: {name}.png')

        browser.close()
    server.shutdown()

finally:
    DADES_PATH.write_text(original)
    print('dades.js restaurat')

print(f'\nFet! Screenshots a: {OUT}')
