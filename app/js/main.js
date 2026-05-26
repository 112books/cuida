let dadesApp = null;
let perfilActual = 'avi_joan';
let passwordSessio = null;

document.addEventListener('DOMContentLoaded', async () => {
  await carregarDades();
  renderitzarInici();
  renderitzarContactes();
  renderitzarUrgencies();
  renderitzarMedicacio();
  renderitzarGraella();
  renderitzarDiari();
  renderitzarConfiguracio();
  iniciarRecordatoris();
});

function canviarVista(v) {
  document.querySelectorAll('.vista').forEach(x => x.classList.remove('activa'));
  document.getElementById('vista-' + v).classList.add('activa');
  document.querySelectorAll('.tab-nav').forEach(b => b.classList.toggle('actiu', b.dataset.vista === v));
  if (v === 'configuracio') renderitzarConfiguracio();
  if (v === 'diari') renderitzarDiari();
}

async function carregarDades() {
  const remot = await Emmagatzematge.carregarRemot();
  dadesApp = remot ? remot : JSON.parse(JSON.stringify(DADES_INICIALS));
  perfilActual = 'avi_joan';
}

function detectarPerfil(d) {
  if (!d.pacient || !d.pacient.nom) return 'buida';
  if (d.pacient.nom.includes('Joan') && d.pacient.telefon) return 'avi_joan';
  return 'buida';
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function seccioConfigurable(t, c, obert) {
  const attr = obert !== false ? ' open' : '';
  return '<details class="seccio-config"' + attr + '><summary>' + esc(t) + '</summary><div class="contingut-seccio">' + c + '</div></details>';
}

const ICONS = {
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icn-sm"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icn-sm"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icn-sm"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icn-sm"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icn-sm"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icn-sm"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icn-sm"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icn-sm"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>',
};

function netejarTel(t) { return t.replace(/[\s\-]/g, ''); }

function esMobil(tel) {
  const t = netejarTel(tel);
  const local = t.startsWith('+34') ? t.slice(3) : t.startsWith('0034') ? t.slice(4) : t;
  return local.startsWith('6') || local.startsWith('7');
}

function trobarTelefon(nom) {
  const d = dadesApp;
  if (!nom) return null;
  if (nom === 'empresa_cuidadora') {
    const t = d.empresa_cuidadora && d.empresa_cuidadora.telefon;
    return t && !t.includes('PENDENT') ? t : null;
  }
  for (const r of (d.rols_familiars || [])) {
    if (r.principal && r.principal.includes(nom) && r.telefon && !r.telefon.includes('PENDENT')) return r.telefon;
  }
  for (const c of (d.cuidadors || [])) {
    if (c.nom && c.nom.includes(nom) && c.telefon && !c.telefon.includes('PENDENT')) return c.telefon;
  }
  return null;
}

function renderitzarInici() {
  if (!dadesApp) return;
  const p = dadesApp.pacient;
  document.getElementById('nom-pacient').textContent = p.nom;
  document.getElementById('estat-pacient').textContent = p.situacio;
  const tel = p.telefon && !p.telefon.includes('PENDENT') ? netejarTel(p.telefon) : null;
  document.getElementById('tel-pacient').innerHTML = tel ? '<a href="tel:' + tel + '" class="btn-trucar">' + ICONS.phone + ' Trucar al pacient</a>' : '';
  const f = document.getElementById('pacient-foto');
  f.innerHTML = p.foto ? '<img src="' + esc(p.foto) + '" alt="Foto del pacient" class="foto-pacient">' : '<div class="foto-pacient-placeholder">' + ICONS.user + '</div>';
  const critics = [];
  const revisar = [];
  if (!p.nom) critics.push('Dades del pacient buides');
  if (dadesApp.contactes_medics.some(c => !c.nom)) critics.push('Contactes mèdics sense nom');
  else if (dadesApp.contactes_medics.some(c => c.nom.includes('PENDENT'))) revisar.push('Contactes mèdics pendents');
  if (dadesApp.medicacio.some(m => !m.dosi)) critics.push('Medicació sense dosi definida');
  else if (dadesApp.medicacio.some(m => m.dosi.includes('PENDENT'))) revisar.push('Medicació pendent de revisar');
  if (!dadesApp.voluntats_anticipades.existeix || dadesApp.voluntats_anticipades.existeix.includes('PENDENT')) revisar.push('DVA pendent de verificar');
  if (dadesApp.proveidors && dadesApp.proveidors.some(pr => !pr.telefon || pr.telefon.includes('PENDENT'))) revisar.push('Proveïdors pendents de contactar');
  if (dadesApp.empresa_cuidadora && dadesApp.empresa_cuidadora.telefon.includes('PENDENT')) revisar.push('Empresa cuidadora pendent de contactar');
  let pillText, pillClass;
  if (critics.length) { pillText = 'Falta informació important'; pillClass = 'estat-critic'; }
  else if (revisar.length) { pillText = 'Cal revisar'; pillClass = 'estat-revisar'; }
  else { pillText = 'Tot d\'acord'; pillClass = 'estat-ok'; }
  const tots = critics.concat(revisar);
  document.getElementById('estat-general').innerHTML = '<span class="estat-pill ' + pillClass + '">' + pillText + '</span>';
  document.getElementById('llista-avisos').innerHTML = tots.map(a => '<li class="aviso-item">' + a + '</li>').join('');
  document.getElementById('llista-avisos').style.display = tots.length ? '' : 'none';

  const ox = dadesApp.oxigen || {};
  const fluxText = ox.flux !== undefined && ox.flux !== '' ? String(ox.flux) + ' l/min' : 'No especificat';
  const tasques = dadesApp.tasques_cuidadora || [];
  renderitzarWidgetEsticSol();
  renderitzarInvitacioDiari();

  document.getElementById('inici-tasques').innerHTML = tasques.filter(t => t).length
    ? '<div class="targeta"><h3>Recordatori diari cuidadora</h3><ul class="llista-tasques">' +
      tasques.filter(t => t).map(t => '<li class="tasca-item">' + esc(t) + '</li>').join('') +
      '</ul></div>'
    : '';

  document.getElementById('inici-oxigen').innerHTML =
    '<div class="targeta targeta-oxigen">' +
    '<h3>Oxigen continu</h3>' +
    '<p class="oxigen-flux"><strong>Flux:</strong> ' + esc(fluxText) + '</p>' +
    '<div class="oxigen-aviso">Reomplir el contenidor de l\'humidificador amb <strong>AIGUA FILTRADA</strong></div>' +
    (ox.notes ? '<p style="margin-top:.4rem"><small>' + esc(ox.notes) + '</small></p>' : '') +
    '</div>';
}

function renderitzarContactes() {
  if (!dadesApp) return;

  const empresa = dadesApp.empresa_cuidadora || {};
  const tEmp = empresa.telefon && !empresa.telefon.includes('PENDENT');
  const tnEmp = tEmp ? netejarTel(empresa.telefon) : '';
  document.getElementById('llista-empresa-cuidadora').innerHTML = empresa.nom && !empresa.nom.includes('PENDENT')
    ? '<li class="contacte-item"><div class="contacte-info"><strong>' + esc(empresa.nom) + '</strong>' +
      (empresa.responsable ? '<p>' + esc(empresa.responsable) + '</p>' : '') +
      (empresa.telefon ? '<small>' + esc(empresa.telefon) + '</small>' : '') +
      '</div><div>' + (tEmp ? '<div class="btn-grup"><a href="tel:' + tnEmp + '" class="btn-trucar">' + ICONS.phone + '</a>' + (esMobil(empresa.telefon) ? '<a href="facetime:' + tnEmp + '" class="btn-facetime">' + ICONS.video + '</a>' : '') + '</div>' : '') + '</div></li>'
    : '<li style="padding:.5rem;color:#999">Empresa cuidadora pendent. Ves a Config → Editar dades.</li>';

  const cuidadors = dadesApp.cuidadors || [];
  document.getElementById('llista-cuidadors').innerHTML = cuidadors.length && cuidadors.some(c => c.nom)
    ? cuidadors.filter(c => c.nom).map(c => {
        const t = c.telefon && !c.telefon.includes('PENDENT');
        const tn = t ? netejarTel(c.telefon) : '';
        return '<li class="contacte-item"><div class="contacte-info"><strong>' + esc(c.nom) + '</strong>' +
          (c.horari ? '<p>' + esc(c.horari) + '</p>' : '') +
          (c.telefon ? '<small>' + esc(c.telefon) + '</small>' : '') +
          '</div><div>' + (t ? '<div class="btn-grup"><a href="tel:' + tn + '" class="btn-trucar">' + ICONS.phone + '</a>' + (esMobil(c.telefon) ? '<a href="facetime:' + tn + '" class="btn-facetime">' + ICONS.video + '</a>' : '') + '</div>' : '') + '</div></li>';
      }).join('')
    : '<li style="padding:.5rem;color:#999">Cap cuidador configurat. Ves a Config → Editar dades.</li>';

  document.getElementById('llista-contactes-medics').innerHTML = dadesApp.contactes_medics.map(c => {
    const t = c.telefon && !c.telefon.includes('PENDENT');
    const tn = t ? netejarTel(c.telefon) : '';
    return '<li class="contacte-item"><div class="contacte-info"><strong>' + esc(c.rol) + '</strong><p>' + esc(c.nom) + (c.telefon ? ' &mdash; ' + esc(c.telefon) : '') + '</p><small>' + esc(c.notes) + '</small></div><div>' + (t ? '<div class="btn-grup"><a href="tel:' + tn + '" class="btn-trucar">' + ICONS.phone + '</a>' + (esMobil(c.telefon) ? '<a href="facetime:' + tn + '" class="btn-facetime">' + ICONS.video + '</a>' : '') + '</div>' : '<span class="pendent">PENDENT</span>') + '</div></li>';
  }).join('');

  const prov = dadesApp.proveidors || [];
  document.getElementById('llista-proveidors').innerHTML = prov.length
    ? prov.map(p => {
        const t = p.telefon && !p.telefon.includes('PENDENT');
        const tn = t ? netejarTel(p.telefon) : '';
        return '<li class="contacte-item"><div class="contacte-info"><strong>' + esc(p.nom) + '</strong>' + (p.notes ? '<small>' + esc(p.notes) + '</small>' : '') + '</div><div>' + (t ? '<div class="btn-grup"><a href="tel:' + tn + '" class="btn-trucar">' + ICONS.phone + '</a>' + (esMobil(p.telefon) ? '<a href="facetime:' + tn + '" class="btn-facetime">' + ICONS.video + '</a>' : '') + '</div>' : '<span class="pendent">PENDENT</span>') + '</div></li>';
      }).join('')
    : '<li style="padding:.5rem;color:#999">Cap proveïdor configurat</li>';

  document.getElementById('llista-rols-familiars').innerHTML = dadesApp.rols_familiars.map(r => {
    const t = r.telefon && !r.telefon.includes('PENDENT');
    const tn = t ? netejarTel(r.telefon) : '';
    return '<li class="contacte-item"><div class="contacte-info"><strong>' + esc(r.rol) + '</strong><p>' + esc(r.principal) + (r.suplent ? ' (+ ' + esc(r.suplent) + ')' : '') + '</p><small>' + esc(r.notes) + '</small></div><div>' + (t ? '<div class="btn-grup"><a href="tel:' + tn + '" class="btn-trucar">' + ICONS.phone + '</a>' + (esMobil(r.telefon) ? '<a href="facetime:' + tn + '" class="btn-facetime">' + ICONS.video + '</a>' : '') + '</div>' : '') + '</div></li>';
  }).join('');
}

function renderitzarUrgencies() {
  if (!dadesApp) return;
  document.getElementById('contenidor-urgencies').innerHTML = dadesApp.protocols_urgencies.map((p, i) => {
    const cls = p.greu ? 'targeta-urgencia-greu' : 'targeta-urgencia';

    const passos = (p.passos || []).map(pas => {
      let btn = '';
      if (pas.tel) {
        const tn = netejarTel(pas.tel);
        btn = ' <a href="tel:' + tn + '" class="btn-trucar-pas">' + ICONS.phone + ' ' + esc(pas.tel) + '</a>';
      } else if (pas.ref === 'empresa_cuidadora') {
        const ec = dadesApp.empresa_cuidadora;
        if (ec && ec.telefon && !ec.telefon.includes('PENDENT')) {
          const tn = netejarTel(ec.telefon);
          btn = ' <a href="tel:' + tn + '" class="btn-trucar-pas">' + ICONS.phone + ' ' + esc(ec.nom || ec.telefon) + '</a>';
        }
      }
      return '<li>' + esc(pas.text) + btn + '</li>';
    }).join('');

    const responsables = (p.responsables || []).map(nom => {
      const tel = trobarTelefon(nom);
      if (tel) {
        return '<a href="tel:' + netejarTel(tel) + '" class="btn-responsable">' + ICONS.phone + ' ' + esc(nom) + '</a>';
      }
      return '<span class="responsable-nom">' + esc(nom) + '</span>';
    }).join('');

    const boto112 = p.greu ? '<a href="tel:112" class="btn-trucar-emergencia">TRUCAR 112</a>' : '';

    return '<div class="' + cls + '">' +
      '<h3>' + (i + 1) + '. ' + esc(p.situacio) + '</h3>' +
      '<ol class="passos-urgencia">' + passos + '</ol>' +
      (responsables ? '<div class="responsables-urgencia">' + responsables + '</div>' : '') +
      (boto112 ? '<div style="margin-top:.5rem">' + boto112 + '</div>' : '') +
      '</div>';
  }).join('');
}

function renderitzarMedicacio() {
  if (!dadesApp) return;
  const grups = { esmorzar: [], dinar: [], sopar: [], altres: [], continu: [] };
  const etiquetes = { esmorzar: 'Matí', dinar: 'Migdia', sopar: 'Nit', altres: 'Puntual', continu: 'Altres' };
  dadesApp.medicacio.forEach(m => {
    const k = grups[m.moment] ? m.moment : 'altres';
    grups[k].push(m);
  });

  // Grups simplificats (resum per a la cuidadora)
  let html = '';
  for (const key of ['esmorzar', 'dinar', 'sopar', 'altres', 'continu']) {
    if (!grups[key].length) continue;
    html += '<h3 class="grup-medicacio-titol">' + etiquetes[key] + '</h3>';
    html += '<div class="grup-medicacio">';
    html += grups[key].map(m =>
      '<div class="item-medicacio-resum">' +
      '<span class="med-nom-resum">' + esc(m.nom) + '</span>' +
      '<span class="med-dosi-resum">' + esc(m.dosi) +
      (m.via && m.via !== 'Oral' ? ' · ' + esc(m.via) : '') + '</span>' +
      '</div>'
    ).join('');
    html += '</div>';
  }

  // Fitxa completa (tots els detalls)
  html += '<h3 class="grup-medicacio-titol" style="margin-top:1.25rem">Fitxa completa</h3>';
  html += '<div class="grup-medicacio">';
  html += dadesApp.medicacio.map(m =>
    '<div class="item-medicacio"><h3>' + esc(m.nom) + ' <small>' + esc(m.via) + '</small></h3>' +
    '<p><strong>Dosi:</strong> ' + esc(m.dosi) + '</p>' +
    '<p><strong>Horari:</strong> ' + esc(m.horari) + '</p>' +
    '<p><strong>Per a qu&egrave;:</strong> ' + esc(m.per_a_que) + '</p>' +
    (m.notes && m.notes.includes('NOMÉS') ? '<p class="alerta-medicacio">' + esc(m.notes) + '</p>' : '<small>' + esc(m.notes || '') + '</small>') +
    '</div>'
  ).join('');
  html += '</div>';

  document.getElementById('contenidor-medicacio').innerHTML = html;
}

function renderitzarGraella() {
  if (!dadesApp) return;
  document.getElementById('contenidor-graella').innerHTML = Calendari.generarGraellaHTML(dadesApp);
}

function exportarDades() {
  Emmagatzematge.exportar(dadesApp, 'cuida-' + dadesApp.pacient.nom.toLowerCase().replace(/\s/g, '-') + '-' + new Date().toISOString().split('T')[0] + '.json');
}

function importarDades() {
  Emmagatzematge.importar(d => {
    if (confirm('Importar dades de ' + (d.pacient?.nom || 'desconegut') + '?')) {
      dadesApp = d;
      perfilActual = detectarPerfil(d);
      renderitzarInici(); renderitzarContactes(); renderitzarUrgencies(); renderitzarMedicacio(); renderitzarGraella(); renderitzarDiari(); renderitzarConfiguracio();
    }
  });
}

function renderitzarConfiguracio() {
  if (!dadesApp) return;
  let h = '';

  h += seccioConfigurable('Editar dades',
    '<p style="font-size:.85rem;color:#666;margin-bottom:.75rem">Edita contactes, cuidadors, medicació i més. Es necessita la contrasenya de l\'app.</p>' +
    '<button class="btn-primari" onclick="obrirEditor()">' + ICONS.edit + ' Editar dades</button>',
    true
  );

  h += seccioConfigurable('Còpia de seguretat',
    '<p style="font-size:.8rem;color:#999;margin-bottom:.75rem">Descarrega les dades actuals com a fitxer JSON de backup.</p>' +
    '<button class="btn-secundari" onclick="exportarDades()">' + ICONS.download + ' Exportar JSON</button>',
    false
  );

  h += seccioConfigurable('Guia de l\'editor',
    '<div class="guia-item"><strong>Com editar</strong> — Prem "Editar dades", introdueix la contrasenya, modifica els camps i prem "Guardar a Cloudflare".</div>' +
    '<div class="guia-item"><strong>Quan ho veuen els altres</strong> — En la propera recàrrega de la pàgina, tots els dispositius carreguen les dades actualitzades.</div>' +
    '<div class="guia-item"><strong>Backup</strong> — Utilitza "Exportar JSON" per guardar una còpia local. No substitueix el guardat a Cloudflare.</div>' +
    '<div class="guia-item"><strong>Graella</strong> — Els horaris dels cuidadors venen de la secció "Cuidadors" del formulari d\'edició.</div>',
    false
  );

  h += seccioConfigurable('Com funciona Cuida',
    '<div class="guia-item"><strong>Inici</strong> — Resum del pacient, avisos pendents i accions ràpides</div>' +
    '<div class="guia-item"><strong>Graella</strong> — Horari dels cuidadors de l\'empresa</div>' +
    '<div class="guia-item"><strong>Contactes</strong> — Empresa, cuidadors, metges, proveïdors i família amb botons de trucada</div>' +
    '<div class="guia-item"><strong>Urgències</strong> — Protocols pas a pas. Botó vermell truca al 112</div>' +
    '<div class="guia-item"><strong>Medicació</strong> — Llista completa amb dosis, horaris i alertes</div>' +
    '<div class="guia-item"><strong>Diari</strong> — Notes diàries de seguiment amb estat i constants vitals</div>' +
    '<div class="guia-item"><strong>Config</strong> — Editor de dades, backup i guies</div>',
    false
  );

  h += seccioConfigurable('Crèdits',
    '<p style="font-size:.82rem;line-height:1.6;margin-bottom:.5rem"><strong>Cuida Beta 01</strong> — Webapp de coordinació familiar per a malalts a casa. Dissenyada i creada per <a href="https://linuxbcn.com/ca/" target="_blank" style="color:#222">LinuxBCN.cat</a> a partir d\'una necessitat real.</p>' +
    '<p style="font-size:.82rem;line-height:1.6;margin-bottom:.5rem">→ <a href="https://linuxbcn.com/ca/cuida/" target="_blank" style="color:#222">Llegir l\'article complet a linuxbcn.com</a></p>' +
    '<p style="font-size:.82rem;line-height:1.6;margin-bottom:.5rem">El codi és obert (MIT). Per adaptar-la per a la teva família: <a href="https://github.com/112books/cuida" target="_blank" style="color:#222">github.com/112books/cuida</a>. De bon grat t\'ajudem.</p>' +
    '<p style="font-size:.75rem;color:#999">Llicència MIT · 2026 · <a href="https://linuxbcn.com/ca/" target="_blank" style="color:#999">linuxbcn.com</a></p>',
    false
  );

  h += seccioConfigurable('Configuració inicial Cloudflare (admin)',
    '<p style="font-size:.85rem;color:#666;margin-bottom:.75rem">Passos per activar el guardat a Cloudflare (un sol cop, al dashboard):</p>' +
    '<div class="guia-item"><strong>Pas 1 — Crear KV namespace</strong><br>Dashboard → Workers &amp; Pages → KV → Create namespace → Nom: <code>CUIDA_DADES</code></div>' +
    '<div class="guia-item"><strong>Pas 2 — Variable de contrasenya</strong><br>Pages → cuida-avi-joan → Settings → Environment variables → Afegir Secret: <code>CUIDA_PASSWORD</code> = contrasenya</div>' +
    '<div class="guia-item"><strong>Pas 3 — Lligar KV al projecte</strong><br>Pages → Settings → Functions → KV namespace bindings → Variable: <code>CUIDA_DADES</code></div>' +
    '<div class="guia-item"><strong>Pas 4 — Desplegar</strong><br><code>git push private main</code> → Cloudflare redespega automàticament</div>' +
    '<div class="guia-item"><strong>Verificació</strong><br>Obre <code>/api/dades</code> al navegador — hauries de veure JSON</div>',
    false
  );

  document.getElementById('contingut-configuracio').innerHTML = h;
}

// ── Editor de dades ──────────────────────────────────────────────

function obrirEditor() {
  const pw = prompt('Introdueix la contrasenya per editar:');
  if (!pw) return;
  passwordSessio = pw;
  document.getElementById('contingut-configuracio').innerHTML = renderitzarFormulariEdicio();
}

function tancarEditor() {
  passwordSessio = null;
  renderitzarConfiguracio();
}

function renderitzarFormulariEdicio() {
  const d = dadesApp;

  function camp(label, id, val, tipus) {
    return '<div class="camp"><label for="' + id + '">' + esc(label) + '</label><input type="' + (tipus || 'text') + '" id="' + id + '" value="' + esc(val || '') + '"></div>';
  }

  let h = '<div class="formulari-edicio">';

  // Pacient
  h += '<h3 class="form-seccio-titol">Pacient</h3>';
  h += camp('Nom', 'f-pacient-nom', d.pacient.nom);
  h += camp('Situació', 'f-pacient-situacio', d.pacient.situacio);
  h += camp('Telèfon', 'f-pacient-telefon', d.pacient.telefon, 'tel');
  h += '<div class="camp"><label for="f-pacient-nota">Nota</label><textarea id="f-pacient-nota" rows="2">' + esc(d.pacient.nota || '') + '</textarea></div>';

  // Empresa cuidadora
  const emp = d.empresa_cuidadora || {};
  h += '<h3 class="form-seccio-titol">Empresa cuidadora</h3>';
  h += camp('Nom empresa', 'f-emp-nom', emp.nom);
  h += camp('Telèfon empresa', 'f-emp-telefon', emp.telefon, 'tel');
  h += camp('Responsable de contacte', 'f-emp-responsable', emp.responsable);

  // Cuidadors
  h += '<h3 class="form-seccio-titol">Cuidadors</h3>';
  h += '<div id="f-cuidadors">';
  const cuidadors = d.cuidadors && d.cuidadors.length ? d.cuidadors : [{ nom: '', telefon: '', horari: '' }];
  cuidadors.forEach((c, i) => {
    h += itemCuidadorHTML(c, i);
  });
  h += '</div>';
  h += '<button class="btn-secundari btn-afegir" onclick="afegirCuidador()">' + ICONS.plus + ' Afegir cuidador</button>';

  // Contactes mèdics
  h += '<h3 class="form-seccio-titol">Contactes mèdics</h3>';
  h += '<div id="f-contactes">';
  d.contactes_medics.forEach((c, i) => {
    h += itemContacteHTML(c, i);
  });
  h += '</div>';
  h += '<button class="btn-secundari btn-afegir" onclick="afegirContacte()">' + ICONS.plus + ' Afegir contacte</button>';

  // Proveïdors
  h += '<h3 class="form-seccio-titol">Proveïdors</h3>';
  h += '<div id="f-proveidors">';
  (d.proveidors || []).forEach((p, i) => {
    h += itemProveidorHTML(p, i);
  });
  h += '</div>';
  h += '<button class="btn-secundari btn-afegir" onclick="afegirProveidor()">' + ICONS.plus + ' Afegir proveïdor</button>';

  // Família
  h += '<h3 class="form-seccio-titol">Família</h3>';
  h += '<div id="f-familia">';
  d.rols_familiars.forEach((r, i) => {
    h += itemFamiliaHTML(r, i);
  });
  h += '</div>';
  h += '<button class="btn-secundari btn-afegir" onclick="afegirFamilia()">' + ICONS.plus + ' Afegir membre</button>';

  // Medicació
  h += '<h3 class="form-seccio-titol">Medicació</h3>';
  h += '<div id="f-medicacio">';
  d.medicacio.forEach((m, i) => {
    h += itemMedicacioHTML(m, i);
  });
  h += '</div>';
  h += '<button class="btn-secundari btn-afegir" onclick="afegirMedicament()">' + ICONS.plus + ' Afegir medicament</button>';

  // Tasques cuidadora
  h += '<h3 class="form-seccio-titol">Recordatori diari cuidadora</h3>';
  h += '<div id="f-tasques">';
  (d.tasques_cuidadora || []).forEach((t, i) => { h += itemTascaHTML(t, i); });
  h += '</div>';
  h += '<button class="btn-secundari btn-afegir" onclick="afegirTasca()">' + ICONS.plus + ' Afegir tasca</button>';

  // Oxigen
  const ox = d.oxigen || {};
  h += '<h3 class="form-seccio-titol">Oxigen</h3>';
  h += camp('Flux (l/min)', 'f-oxigen-flux', String(ox.flux || ''));
  h += camp('Notes', 'f-oxigen-notes', ox.notes || '');

  // Botons acció
  h += '<div class="form-accions"><button class="btn-primari" onclick="guardarEditor()">Guardar a Cloudflare</button><button class="btn-secundari" onclick="tancarEditor()">Cancel·lar</button></div>';
  h += '<div id="form-missatge" class="form-missatge"></div>';
  h += '</div>';
  return h;
}

function itemCuidadorHTML(c, i) {
  return '<div class="item-llista" id="cuidador-' + i + '">' +
    '<button class="btn-eliminar-item" onclick="eliminarItem(\'f-cuidadors\',\'cuidador-' + i + '\')" title="Eliminar">' + ICONS.trash + '</button>' +
    '<div class="camp"><label>Nom</label><input type="text" class="c-nom" value="' + esc(c.nom || '') + '"></div>' +
    '<div class="camp"><label>Telèfon</label><input type="tel" class="c-tel" value="' + esc(c.telefon || '') + '"></div>' +
    '<div class="camp"><label>Horari (text lliure)</label><input type="text" class="c-horari" value="' + esc(c.horari || '') + '" placeholder="ex: Dl-Ds 9-12h i 16-19h"></div>' +
    '</div>';
}

function itemContacteHTML(c, i) {
  return '<div class="item-llista" id="contacte-' + i + '">' +
    '<button class="btn-eliminar-item" onclick="eliminarItem(\'f-contactes\',\'contacte-' + i + '\')" title="Eliminar">' + ICONS.trash + '</button>' +
    '<div class="camp"><label>Rol</label><input type="text" class="cc-rol" value="' + esc(c.rol || '') + '"></div>' +
    '<div class="camp"><label>Nom</label><input type="text" class="cc-nom" value="' + esc(c.nom || '') + '"></div>' +
    '<div class="camp"><label>Telèfon</label><input type="tel" class="cc-tel" value="' + esc(c.telefon || '') + '"></div>' +
    '<div class="camp"><label>Notes</label><input type="text" class="cc-notes" value="' + esc(c.notes || '') + '"></div>' +
    '</div>';
}

function itemProveidorHTML(p, i) {
  return '<div class="item-llista" id="proveidor-' + i + '">' +
    '<button class="btn-eliminar-item" onclick="eliminarItem(\'f-proveidors\',\'proveidor-' + i + '\')" title="Eliminar">' + ICONS.trash + '</button>' +
    '<div class="camp"><label>Nom</label><input type="text" class="pv-nom" value="' + esc(p.nom || '') + '"></div>' +
    '<div class="camp"><label>Telèfon</label><input type="tel" class="pv-tel" value="' + esc(p.telefon || '') + '"></div>' +
    '<div class="camp"><label>Notes</label><input type="text" class="pv-notes" value="' + esc(p.notes || '') + '"></div>' +
    '</div>';
}

function itemFamiliaHTML(r, i) {
  return '<div class="item-llista" id="familia-' + i + '">' +
    '<button class="btn-eliminar-item" onclick="eliminarItem(\'f-familia\',\'familia-' + i + '\')" title="Eliminar">' + ICONS.trash + '</button>' +
    '<div class="camp"><label>Rol</label><input type="text" class="fm-rol" value="' + esc(r.rol || '') + '"></div>' +
    '<div class="camp"><label>Principal</label><input type="text" class="fm-principal" value="' + esc(r.principal || '') + '"></div>' +
    '<div class="camp"><label>Telèfon</label><input type="tel" class="fm-tel" value="' + esc(r.telefon || '') + '"></div>' +
    '<div class="camp"><label>Notes</label><input type="text" class="fm-notes" value="' + esc(r.notes || '') + '"></div>' +
    '</div>';
}

function itemMedicacioHTML(m, i) {
  return '<div class="item-llista" id="med-' + i + '">' +
    '<button class="btn-eliminar-item" onclick="eliminarItem(\'f-medicacio\',\'med-' + i + '\')" title="Eliminar">' + ICONS.trash + '</button>' +
    '<div class="camp"><label>Nom del medicament</label><input type="text" class="med-nom" value="' + esc(m.nom || '') + '"></div>' +
    '<div class="camp"><label>Dosi</label><input type="text" class="med-dosi" value="' + esc(m.dosi || '') + '"></div>' +
    '<div class="camp"><label>Moment del dia</label><select class="med-moment">' +
    '<option value=""' + (!m.moment ? ' selected' : '') + '>Selecciona...</option>' +
    '<option value="esmorzar"' + (m.moment === 'esmorzar' ? ' selected' : '') + '>Matí</option>' +
    '<option value="dinar"' + (m.moment === 'dinar' ? ' selected' : '') + '>Migdia</option>' +
    '<option value="sopar"' + (m.moment === 'sopar' ? ' selected' : '') + '>Nit</option>' +
    '<option value="altres"' + (m.moment === 'altres' ? ' selected' : '') + '>Puntual</option>' +
    '<option value="continu"' + (m.moment === 'continu' ? ' selected' : '') + '>Continu / 24h</option>' +
    '</select></div>' +
    '<div class="camp"><label>Horari / Pauta</label><input type="text" class="med-horari" value="' + esc(m.horari || '') + '"></div>' +
    '<div class="camp"><label>Via</label><input type="text" class="med-via" value="' + esc(m.via || '') + '"></div>' +
    '<div class="camp"><label>Per a qu&egrave;</label><input type="text" class="med-peraque" value="' + esc(m.per_a_que || '') + '"></div>' +
    '<div class="camp"><label>Notes</label><input type="text" class="med-notes" value="' + esc(m.notes || '') + '"></div>' +
    '</div>';
}

function eliminarItem(contenidorId, itemId) {
  const item = document.getElementById(itemId);
  if (item) item.remove();
}

function afegirCuidador() {
  const cnt = document.getElementById('f-cuidadors');
  const i = cnt.children.length;
  cnt.insertAdjacentHTML('beforeend', itemCuidadorHTML({ nom: '', telefon: '', horari: '' }, i));
}

function afegirContacte() {
  const cnt = document.getElementById('f-contactes');
  const i = cnt.children.length;
  cnt.insertAdjacentHTML('beforeend', itemContacteHTML({ rol: '', nom: '', telefon: '', notes: '' }, i));
}

function afegirProveidor() {
  const cnt = document.getElementById('f-proveidors');
  const i = cnt.children.length;
  cnt.insertAdjacentHTML('beforeend', itemProveidorHTML({ nom: '', telefon: '', notes: '' }, i));
}

function afegirFamilia() {
  const cnt = document.getElementById('f-familia');
  const i = cnt.children.length;
  cnt.insertAdjacentHTML('beforeend', itemFamiliaHTML({ rol: '', principal: '', telefon: '', notes: '' }, i));
}

function itemTascaHTML(t, i) {
  return '<div class="item-llista" id="tasca-' + i + '">' +
    '<button class="btn-eliminar-item" onclick="eliminarItem(\'f-tasques\',\'tasca-' + i + '\')" title="Eliminar">' + ICONS.trash + '</button>' +
    '<div class="camp"><input type="text" class="tasca-text" value="' + esc(t || '') + '" placeholder="Descripció de la tasca"></div>' +
    '</div>';
}

function afegirTasca() {
  const cnt = document.getElementById('f-tasques');
  const i = cnt.children.length;
  cnt.insertAdjacentHTML('beforeend', itemTascaHTML('', i));
}

function afegirMedicament() {
  const cnt = document.getElementById('f-medicacio');
  const i = cnt.children.length;
  cnt.insertAdjacentHTML('beforeend', itemMedicacioHTML({ nom: '', dosi: '', horari: '', via: '', per_a_que: '', notes: '', moment: '' }, i));
}

function recollirDadesFormulari() {
  const get = id => (document.getElementById(id) || {}).value || '';
  const dades = JSON.parse(JSON.stringify(dadesApp));

  dades.pacient.nom = get('f-pacient-nom');
  dades.pacient.situacio = get('f-pacient-situacio');
  dades.pacient.telefon = get('f-pacient-telefon');
  dades.pacient.nota = get('f-pacient-nota');

  dades.empresa_cuidadora = {
    nom: get('f-emp-nom'),
    telefon: get('f-emp-telefon'),
    responsable: get('f-emp-responsable'),
  };

  dades.cuidadors = Array.from(document.querySelectorAll('#f-cuidadors .item-llista')).map(el => ({
    nom: (el.querySelector('.c-nom') || {}).value || '',
    telefon: (el.querySelector('.c-tel') || {}).value || '',
    horari: (el.querySelector('.c-horari') || {}).value || '',
  })).filter(c => c.nom);

  dades.contactes_medics = Array.from(document.querySelectorAll('#f-contactes .item-llista')).map(el => ({
    rol: (el.querySelector('.cc-rol') || {}).value || '',
    nom: (el.querySelector('.cc-nom') || {}).value || '',
    telefon: (el.querySelector('.cc-tel') || {}).value || '',
    notes: (el.querySelector('.cc-notes') || {}).value || '',
    prioritat: 'alta',
  }));

  dades.proveidors = Array.from(document.querySelectorAll('#f-proveidors .item-llista')).map(el => ({
    nom: (el.querySelector('.pv-nom') || {}).value || '',
    telefon: (el.querySelector('.pv-tel') || {}).value || '',
    notes: (el.querySelector('.pv-notes') || {}).value || '',
  }));

  dades.rols_familiars = Array.from(document.querySelectorAll('#f-familia .item-llista')).map(el => ({
    rol: (el.querySelector('.fm-rol') || {}).value || '',
    principal: (el.querySelector('.fm-principal') || {}).value || '',
    suplent: '',
    telefon: (el.querySelector('.fm-tel') || {}).value || '',
    notes: (el.querySelector('.fm-notes') || {}).value || '',
  }));

  dades.medicacio = Array.from(document.querySelectorAll('#f-medicacio .item-llista')).map(el => ({
    nom: (el.querySelector('.med-nom') || {}).value || '',
    dosi: (el.querySelector('.med-dosi') || {}).value || '',
    horari: (el.querySelector('.med-horari') || {}).value || '',
    via: (el.querySelector('.med-via') || {}).value || '',
    per_a_que: (el.querySelector('.med-peraque') || {}).value || '',
    notes: (el.querySelector('.med-notes') || {}).value || '',
    moment: (el.querySelector('.med-moment') || {}).value || '',
  }));

  dades.tasques_cuidadora = Array.from(document.querySelectorAll('#f-tasques .item-llista'))
    .map(el => (el.querySelector('.tasca-text') || {}).value || '')
    .filter(t => t);

  dades.oxigen = {
    flux: get('f-oxigen-flux'),
    notes: get('f-oxigen-notes'),
  };

  return dades;
}

// ── Mode Estic Sol ──────────────────────────────────────────────────────────

let duradaSeleccionada = 2;
let countdownInterval = null;

function renderitzarWidgetEsticSol() {
  const el = document.getElementById('inici-estic-sol');
  if (!el || !dadesApp) return;
  const es = dadesApp.estic_sol || {};

  if (es.alerta) {
    el.innerHTML = '<div class="targeta targeta-sos">' +
      '<h3>⚠️ Alerta enviada a la família</h3>' +
      '<p style="font-size:.82rem;margin:.35rem 0 .75rem">S\'ha notificat a la família. Confirmeu que tot va bé.</p>' +
      '<button class="btn-primari" onclick="tancarAlertaEsticSol()">Tancar alerta — tot bé</button>' +
      '</div>';
    return;
  }

  if (es.actiu && es.fins) {
    const fins = new Date(es.fins);
    const msRestants = fins - Date.now();
    if (msRestants <= 0) {
      el.innerHTML = '<div class="targeta targeta-sos-pendent">' +
        '<h3>⚠️ Timer esgotat</h3>' +
        '<p style="font-size:.82rem;margin:.35rem 0 .75rem">La família serà avisada en el proper cicle de comprovació (màx. 15 min).</p>' +
        '<button class="btn-secundari" onclick="confirmarEsticBe()">Estic bé — cancel·lar alerta</button>' +
        '</div>';
      return;
    }

    const fiHora = fins.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
    el.innerHTML = '<div class="targeta targeta-estic-sol-actiu">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.35rem">' +
      '<h3 style="margin:0">Mode Estic sol actiu</h3>' +
      '<span id="estic-sol-countdown" class="countdown-estic-sol">' + formatarComptador(msRestants) + '</span>' +
      '</div>' +
      '<p style="font-size:.78rem;color:#666;margin-bottom:.75rem">Fins a les ' + fiHora + '. Si no confirmes que estàs bé, s\'avisarà la família.</p>' +
      '<button class="btn-estic-be" onclick="confirmarEsticBe()">✓ &nbsp;Estic bé</button>' +
      '<button class="btn-link-petit" onclick="cancellarEsticSol()">Cancel·lar el mode</button>' +
      '</div>';

    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      const ms = new Date(dadesApp.estic_sol.fins) - Date.now();
      if (ms <= 0) { clearInterval(countdownInterval); countdownInterval = null; renderitzarWidgetEsticSol(); return; }
      const el2 = document.getElementById('estic-sol-countdown');
      if (el2) el2.textContent = formatarComptador(ms);
    }, 30000);
    return;
  }

  el.innerHTML = '<div class="targeta targeta-estic-sol">' +
    '<h3>Mode Estic sol</h3>' +
    '<p style="font-size:.8rem;color:#666;margin:.25rem 0 .6rem">Activa quan el pacient quedi sol. S\'avisa la família si no confirma que està bé a temps.</p>' +
    '<div class="estic-sol-durades">' +
    [1,2,3,4].map(h => '<button class="btn-durada' + (h === duradaSeleccionada ? ' actiu' : '') + '" data-h="' + h + '" onclick="seleccionarDurada(' + h + ')">' + h + 'h</button>').join('') +
    '</div>' +
    '<button class="btn-primari" onclick="activarEsticSol()" style="margin-top:.6rem;width:100%">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icn-sm"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
    ' Activar</button>' +
    '</div>';
}

function formatarComptador(ms) {
  const totalMins = Math.ceil(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return h > 0 ? h + 'h ' + m + 'min' : m + ' min';
}

function seleccionarDurada(h) {
  duradaSeleccionada = h;
  document.querySelectorAll('.btn-durada').forEach(b => b.classList.toggle('actiu', parseInt(b.dataset.h) === h));
}

async function activarEsticSol() {
  if (!passwordSessio) {
    const pw = prompt('Introdueix la contrasenya per activar:');
    if (!pw) return;
    passwordSessio = pw;
  }
  const ara = new Date();
  const fins = new Date(ara.getTime() + duradaSeleccionada * 3600000);
  const dades = JSON.parse(JSON.stringify(dadesApp));
  dades.estic_sol = { actiu: true, fins: fins.toISOString(), activat: ara.toISOString(), alerta: false };
  const res = await Emmagatzematge.guardarRemot(dades, passwordSessio);
  if (res.ok) { dadesApp = dades; renderitzarWidgetEsticSol(); }
  else { alert('Error: ' + (res.error || 'Error desconegut')); if (res.error && res.error.includes('ontrasenya')) passwordSessio = null; }
}

async function confirmarEsticBe() {
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
  try {
    const r = await fetch('/api/estic-be', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (r.ok) { if (dadesApp.estic_sol) dadesApp.estic_sol = { actiu: false, fins: null, activat: null, alerta: false }; }
  } catch (e) { if (dadesApp.estic_sol) dadesApp.estic_sol = { actiu: false, fins: null, activat: null, alerta: false }; }
  renderitzarWidgetEsticSol();
}

function cancellarEsticSol() { confirmarEsticBe(); }

async function tancarAlertaEsticSol() {
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
  try { await fetch('/api/estic-be', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); } catch (e) {}
  if (dadesApp.estic_sol) dadesApp.estic_sol = { actiu: false, fins: null, activat: null, alerta: false };
  renderitzarWidgetEsticSol();
}

// ── Diari de seguiment ──────────────────────────────────────────────────────

const ESTAT_DIARI = {
  ok: { text: 'Bé', cls: 'estat-ok' },
  revisar: { text: 'A vigilar', cls: 'estat-revisar' },
  critic: { text: 'Urgent', cls: 'estat-critic' },
};

let estatDiariActual = 'ok';
let dataDiariEditant = null;

function formatarDataDiari(dataStr) {
  const d = new Date(dataStr + 'T12:00:00');
  return d.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

function renderitzarDiari() {
  if (!dadesApp) return;
  const diari = (dadesApp.diari || []).sort((a, b) => b.data.localeCompare(a.data));
  const avui = new Date().toISOString().split('T')[0];
  const entradaAvui = diari.find(e => e.data === avui);

  let html = '<div class="targeta">';
  html += '<h3>Avui &mdash; ' + esc(formatarDataDiari(avui)) + '</h3>';
  if (entradaAvui) {
    const ec = ESTAT_DIARI[entradaAvui.estat] || ESTAT_DIARI.ok;
    html += '<span class="estat-pill ' + ec.cls + '">' + ec.text + '</span>';
    if (entradaAvui.text) html += '<p class="entrada-diari-text">' + esc(entradaAvui.text) + '</p>';
    const c = entradaAvui.constants || {};
    if (c.tensio || c.saturacio || c.pes) {
      html += '<div class="entrada-constants">';
      if (c.tensio) html += '<span class="constant-item">TA: ' + esc(c.tensio) + '</span>';
      if (c.saturacio) html += '<span class="constant-item">SpO₂: ' + esc(c.saturacio) + '%</span>';
      if (c.pes) html += '<span class="constant-item">Pes: ' + esc(c.pes) + ' kg</span>';
      html += '</div>';
    }
    html += '<div style="margin-top:.6rem"><button class="btn-secundari" onclick="obrirFormDiari(\'' + avui + '\')">' + ICONS.edit + ' Editar</button></div>';
  } else {
    html += '<p style="font-size:.82rem;color:#999;margin:.35rem 0 .75rem">Cap nota per avui.</p>';
    html += '<button class="btn-primari" onclick="obrirFormDiari(\'' + avui + '\')">+ Afegir nota d\'avui</button>';
  }
  html += '</div>';

  html += '<div id="form-diari" class="targeta" style="display:none">';
  html += '<h3>Nota del dia</h3>';
  html += '<div class="diari-estat-seleccio">';
  for (const [key, val] of Object.entries(ESTAT_DIARI)) {
    html += '<button class="btn-estat-diari" data-estat="' + key + '" onclick="seleccionarEstatDiari(\'' + key + '\')">' + val.text + '</button>';
  }
  html += '</div>';
  html += '<div class="camp"><label>Notes del dia</label><textarea id="diari-text" rows="6" placeholder="Com ha anat el dia? Novetats, símptomes, estat anímic..."></textarea></div>';
  html += '<details style="margin-bottom:.6rem"><summary style="font-size:.78rem;color:#777;cursor:pointer;padding:.3rem 0">Constants (opcional)</summary>';
  html += '<div class="diari-constants-grup" style="margin-top:.4rem">';
  html += '<div class="camp"><label>Tensió arterial</label><input type="text" id="diari-tensio" placeholder="ex: 120/80"></div>';
  html += '<div class="camp"><label>Saturació O₂ (%)</label><input type="number" id="diari-saturacio" min="0" max="100" placeholder="95"></div>';
  html += '<div class="camp"><label>Pes (kg)</label><input type="number" id="diari-pes" step="0.1" min="0" placeholder="65.5"></div>';
  html += '</div></details>';
  html += '<div class="form-accions"><button class="btn-primari" onclick="guardarEntradaDiari()">Guardar</button><button class="btn-secundari" onclick="tancarFormDiari()">Cancel·lar</button></div>';
  html += '<div id="diari-missatge" class="form-missatge"></div>';
  html += '</div>';

  const anteriors = diari.filter(e => e.data !== avui).slice(0, 14);
  if (anteriors.length) {
    html += '<div class="targeta"><h3>Últimes entrades</h3><ul class="llista-entrades-diari">';
    html += anteriors.map(e => {
      const ec = ESTAT_DIARI[e.estat] || ESTAT_DIARI.ok;
      const c = e.constants || {};
      return '<li class="entrada-diari-item">' +
        '<div class="entrada-diari-cap"><span class="entrada-diari-data">' + esc(formatarDataDiari(e.data)) + '</span>' +
        '<span class="estat-pill estat-pill-sm ' + ec.cls + '">' + ec.text + '</span></div>' +
        (e.text ? '<p class="entrada-diari-resum">' + esc(e.text.length > 120 ? e.text.slice(0, 120) + '…' : e.text) + '</p>' : '') +
        (c.tensio || c.saturacio || c.pes ?
          '<div class="entrada-constants">' +
          (c.tensio ? '<span class="constant-item">TA: ' + esc(c.tensio) + '</span>' : '') +
          (c.saturacio ? '<span class="constant-item">SpO₂: ' + esc(c.saturacio) + '%</span>' : '') +
          (c.pes ? '<span class="constant-item">Pes: ' + esc(c.pes) + ' kg</span>' : '') +
          '</div>' : '') +
        '</li>';
    }).join('');
    html += '</ul></div>';
  }

  document.getElementById('contenidor-diari').innerHTML = html;
}

function obrirFormDiari(data) {
  dataDiariEditant = data;
  const entrada = (dadesApp.diari || []).find(e => e.data === data) || { estat: 'ok', text: '', constants: {} };
  estatDiariActual = entrada.estat || 'ok';

  const textEl = document.getElementById('diari-text');
  const tensioEl = document.getElementById('diari-tensio');
  const satEl = document.getElementById('diari-saturacio');
  const pesEl = document.getElementById('diari-pes');
  if (textEl) textEl.value = entrada.text || '';
  const c = entrada.constants || {};
  if (tensioEl) tensioEl.value = c.tensio || '';
  if (satEl) satEl.value = c.saturacio || '';
  if (pesEl) pesEl.value = c.pes || '';

  actualitzarBotonsEstatDiari();
  const formEl = document.getElementById('form-diari');
  if (formEl) { formEl.style.display = ''; formEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  const missEl = document.getElementById('diari-missatge');
  if (missEl) missEl.textContent = '';
}

function seleccionarEstatDiari(estat) {
  estatDiariActual = estat;
  actualitzarBotonsEstatDiari();
}

function actualitzarBotonsEstatDiari() {
  document.querySelectorAll('.btn-estat-diari').forEach(btn => {
    const actiu = btn.dataset.estat === estatDiariActual;
    btn.className = 'btn-estat-diari' + (actiu ? ' actiu ' + (ESTAT_DIARI[btn.dataset.estat] || {}).cls : '');
  });
}

function tancarFormDiari() {
  const formEl = document.getElementById('form-diari');
  if (formEl) formEl.style.display = 'none';
  dataDiariEditant = null;
}

async function guardarEntradaDiari() {
  const missatge = document.getElementById('diari-missatge');
  if (!passwordSessio) {
    const pw = prompt('Introdueix la contrasenya per guardar:');
    if (!pw) return;
    passwordSessio = pw;
  }

  const entrada = {
    data: dataDiariEditant,
    estat: estatDiariActual,
    text: (document.getElementById('diari-text') || {}).value || '',
    constants: {
      tensio: (document.getElementById('diari-tensio') || {}).value || '',
      saturacio: (document.getElementById('diari-saturacio') || {}).value || '',
      pes: (document.getElementById('diari-pes') || {}).value || '',
    },
  };

  const dades = JSON.parse(JSON.stringify(dadesApp));
  dades.diari = dades.diari || [];
  const idx = dades.diari.findIndex(e => e.data === dataDiariEditant);
  if (idx >= 0) dades.diari[idx] = entrada;
  else dades.diari.push(entrada);
  dades.diari = dades.diari.sort((a, b) => b.data.localeCompare(a.data)).slice(0, 90);

  missatge.textContent = 'Guardant...';
  missatge.className = 'form-missatge';
  const res = await Emmagatzematge.guardarRemot(dades, passwordSessio);
  if (res.ok) {
    dadesApp = dades;
    missatge.textContent = '✓ Guardat correctament.';
    missatge.className = 'form-missatge ok';
    setTimeout(() => { tancarFormDiari(); renderitzarDiari(); }, 800);
  } else {
    missatge.textContent = '✗ Error: ' + (res.error || 'Error desconegut');
    missatge.className = 'form-missatge error';
    if (res.error && res.error.includes('ontrasenya')) passwordSessio = null;
  }
}

// ── Recordatoris Web Push ────────────────────────────────────────────────────

const VAPID_PUBLIC_KEY = 'BLOROpMbSeti3rwbsSTNGZUBOzyrUM22ddU7tsRLkbc0Mvbk4oT29JMWA4KGaVP-_NT44puhVsxm8bRwIbn9oDg';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

let subscripcioActual = null;

async function iniciarRecordatoris() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    renderitzarWidgetRecordatoris(null, false);
    return;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    subscripcioActual = await reg.pushManager.getSubscription();
  } catch (e) { subscripcioActual = null; }
  renderitzarWidgetRecordatoris(subscripcioActual, true);
  renderitzarInvitacioDiari();
}

function renderitzarWidgetRecordatoris(sub, suportat) {
  const el = document.getElementById('inici-recordatoris');
  if (!el) return;

  if (!suportat) { el.innerHTML = ''; return; }

  const perm = Notification.permission;

  if (sub) {
    el.innerHTML = '<div class="estat-recordatoris-actiu">' +
      '<p style="font-size:.78rem;color:#1a6630"><strong>Recordatoris actius</strong> — Matí 8h · Migdia 13:30h · Vespre 21h</p>' +
      '<button class="btn-link-petit" onclick="cancellarRecordatoris()">Cancel·lar recordatoris</button></div>';
    return;
  }

  if (perm === 'denied') {
    el.innerHTML = '<div class="targeta widget-recordatoris"><p style="font-size:.78rem;color:#999">Notificacions bloquejades. Activa-les a la configuració del navegador.</p></div>';
    return;
  }

  el.innerHTML = '<div class="targeta widget-recordatoris">' +
    '<h3>Recordatoris de medicació</h3>' +
    '<p style="font-size:.8rem;color:#666;margin:.35rem 0 .65rem">Rep un avís quan toca prendre les pastilles, fins i tot amb la app tancada.</p>' +
    '<div style="display:flex;gap:.4rem;align-items:center;flex-wrap:wrap">' +
    '<input type="text" id="input-nom-push" placeholder="El teu nom" style="padding:.4rem .65rem;border:1px solid #e0e0e0;border-radius:6px;font-size:.82rem;flex:1;min-width:120px">' +
    '<button class="btn-primari" onclick="activarRecordatoris()">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icn-sm"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>' +
    ' Activar</button></div>' +
    '<div id="push-missatge" style="font-size:.75rem;margin-top:.4rem;min-height:.9rem"></div>' +
    '</div>';
}

async function activarRecordatoris() {
  const nom = (document.getElementById('input-nom-push') || {}).value || '';
  if (!nom.trim()) {
    const m = document.getElementById('push-missatge');
    if (m) { m.textContent = 'Introdueix el teu nom primer.'; m.style.color = '#d9534f'; }
    return;
  }

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') {
    renderitzarWidgetRecordatoris(null, true);
    return;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    subscripcioActual = sub;

    await fetch('/api/suscripcions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: nom.trim(), subscription: sub.toJSON() }),
    });

    renderitzarWidgetRecordatoris(sub, true);
  } catch (e) {
    console.error('Error activant push:', e);
    const m = document.getElementById('push-missatge');
    if (m) { m.textContent = 'Error activant. Prova de recarregar la pàgina.'; m.style.color = '#d9534f'; }
  }
}

async function cancellarRecordatoris() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch('/api/suscripcions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    subscripcioActual = null;
    renderitzarWidgetRecordatoris(null, true);
  } catch (e) { console.error('Error cancel·lant push:', e); }
}

function renderitzarInvitacioDiari() {
  const el = document.getElementById('inici-diari-avui');
  if (!el || !dadesApp) return;
  const avui = new Date().toISOString().split('T')[0];
  const teDiari = (dadesApp.diari || []).some(e => e.data === avui);
  if (teDiari) { el.innerHTML = ''; return; }
  el.innerHTML = '<div class="targeta invitacio-diari">' +
    '<p style="font-size:.82rem;color:#555;margin-bottom:.5rem">Ningú ha escrit la nota del diari d\'avui.</p>' +
    '<button class="btn-secundari" onclick="canviarVista(\'diari\')">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icn-sm"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>' +
    ' Afegir nota d\'avui</button></div>';
}

async function guardarEditor() {
  const missatge = document.getElementById('form-missatge');
  missatge.textContent = 'Guardant...';
  missatge.className = 'form-missatge';

  const dades = recollirDadesFormulari();
  const res = await Emmagatzematge.guardarRemot(dades, passwordSessio);

  if (res.ok) {
    dadesApp = dades;
    missatge.textContent = '✓ Guardat correctament. Tots els dispositius veuran els canvis en la propera recàrrega.';
    missatge.className = 'form-missatge ok';
    renderitzarInici();
    renderitzarContactes();
    renderitzarUrgencies();
    renderitzarMedicacio();
    renderitzarGraella();
  } else {
    missatge.textContent = '✗ Error: ' + (res.error || 'Error desconegut');
    missatge.className = 'form-missatge error';
    if (res.error && res.error.includes('ontrasenya')) passwordSessio = null;
  }
}
