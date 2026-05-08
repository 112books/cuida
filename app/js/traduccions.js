const IDIOMA='ca';
const TRADUCCIONS={ca:{titol:'Cuida',inici:'Inici',graella:'Graella',contactes:'Contactes',urgencies:'Urgències',medicacio:'Medicació'},en:{titol:'Cuida',inici:'Home',graella:'Schedule',contactes:'Contacts',urgencies:'Emergencies',medicacio:'Medication'}};
function trad(c){return TRADUCCIONS[IDIOMA]?.[c]||c}
