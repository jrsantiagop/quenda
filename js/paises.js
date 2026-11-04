/* ==================================================================== */
/* PAÍSES — códigos telefónicos internacionales para los teléfonos      */
/* México (+52) es el predeterminado y va fijado hasta arriba.          */
/* n = nombre, c = código, d = dígitos que suele usar (null = sin aviso) */
/* ==================================================================== */

export const CODIGO_DEFECTO = '+52';

export const PAISES = [
  { n: 'Afganistán', c: '+93', d: null },
  { n: 'Albania', c: '+355', d: null },
  { n: 'Alemania', c: '+49', d: null },
  { n: 'Andorra', c: '+376', d: null },
  { n: 'Angola', c: '+244', d: null },
  { n: 'Antigua y Barbuda', c: '+1268', d: null },
  { n: 'Arabia Saudita', c: '+966', d: null },
  { n: 'Argelia', c: '+213', d: null },
  { n: 'Argentina', c: '+54', d: 10 },
  { n: 'Armenia', c: '+374', d: null },
  { n: 'Aruba', c: '+297', d: null },
  { n: 'Australia', c: '+61', d: 9 },
  { n: 'Austria', c: '+43', d: null },
  { n: 'Azerbaiyán', c: '+994', d: null },
  { n: 'Bahamas', c: '+1242', d: null },
  { n: 'Bangladés', c: '+880', d: null },
  { n: 'Barbados', c: '+1246', d: null },
  { n: 'Baréin', c: '+973', d: null },
  { n: 'Bélgica', c: '+32', d: null },
  { n: 'Belice', c: '+501', d: null },
  { n: 'Benín', c: '+229', d: null },
  { n: 'Bielorrusia', c: '+375', d: null },
  { n: 'Birmania (Myanmar)', c: '+95', d: null },
  { n: 'Bolivia', c: '+591', d: 8 },
  { n: 'Bosnia y Herzegovina', c: '+387', d: null },
  { n: 'Botsuana', c: '+267', d: null },
  { n: 'Brasil', c: '+55', d: null },
  { n: 'Brunéi', c: '+673', d: null },
  { n: 'Bulgaria', c: '+359', d: null },
  { n: 'Burkina Faso', c: '+226', d: null },
  { n: 'Burundi', c: '+257', d: null },
  { n: 'Bután', c: '+975', d: null },
  { n: 'Cabo Verde', c: '+238', d: null },
  { n: 'Camboya', c: '+855', d: null },
  { n: 'Camerún', c: '+237', d: null },
  { n: 'Canadá', c: '+1', d: 10 },
  { n: 'Catar', c: '+974', d: null },
  { n: 'Chad', c: '+235', d: null },
  { n: 'Chile', c: '+56', d: 9 },
  { n: 'China', c: '+86', d: 11 },
  { n: 'Chipre', c: '+357', d: null },
  { n: 'Colombia', c: '+57', d: 10 },
  { n: 'Comoras', c: '+269', d: null },
  { n: 'Corea del Norte', c: '+850', d: null },
  { n: 'Corea del Sur', c: '+82', d: null },
  { n: 'Costa de Marfil', c: '+225', d: null },
  { n: 'Costa Rica', c: '+506', d: 8 },
  { n: 'Croacia', c: '+385', d: null },
  { n: 'Cuba', c: '+53', d: 8 },
  { n: 'Curazao', c: '+599', d: null },
  { n: 'Dinamarca', c: '+45', d: null },
  { n: 'Dominica', c: '+1767', d: null },
  { n: 'Ecuador', c: '+593', d: 9 },
  { n: 'Egipto', c: '+20', d: null },
  { n: 'El Salvador', c: '+503', d: 8 },
  { n: 'Emiratos Árabes Unidos', c: '+971', d: null },
  { n: 'Eritrea', c: '+291', d: null },
  { n: 'Eslovaquia', c: '+421', d: null },
  { n: 'Eslovenia', c: '+386', d: null },
  { n: 'España', c: '+34', d: 9 },
  { n: 'Estados Unidos', c: '+1', d: 10 },
  { n: 'Estonia', c: '+372', d: null },
  { n: 'Esuatini', c: '+268', d: null },
  { n: 'Etiopía', c: '+251', d: null },
  { n: 'Filipinas', c: '+63', d: null },
  { n: 'Finlandia', c: '+358', d: null },
  { n: 'Fiyi', c: '+679', d: null },
  { n: 'Francia', c: '+33', d: 9 },
  { n: 'Gabón', c: '+241', d: null },
  { n: 'Gambia', c: '+220', d: null },
  { n: 'Georgia', c: '+995', d: null },
  { n: 'Ghana', c: '+233', d: null },
  { n: 'Gibraltar', c: '+350', d: null },
  { n: 'Granada', c: '+1473', d: null },
  { n: 'Grecia', c: '+30', d: null },
  { n: 'Groenlandia', c: '+299', d: null },
  { n: 'Guam', c: '+1671', d: null },
  { n: 'Guatemala', c: '+502', d: 8 },
  { n: 'Guayana Francesa', c: '+594', d: null },
  { n: 'Guinea', c: '+224', d: null },
  { n: 'Guinea-Bisáu', c: '+245', d: null },
  { n: 'Guinea Ecuatorial', c: '+240', d: null },
  { n: 'Guyana', c: '+592', d: null },
  { n: 'Haití', c: '+509', d: null },
  { n: 'Honduras', c: '+504', d: 8 },
  { n: 'Hong Kong', c: '+852', d: null },
  { n: 'Hungría', c: '+36', d: null },
  { n: 'India', c: '+91', d: 10 },
  { n: 'Indonesia', c: '+62', d: null },
  { n: 'Irak', c: '+964', d: null },
  { n: 'Irán', c: '+98', d: null },
  { n: 'Irlanda', c: '+353', d: null },
  { n: 'Islandia', c: '+354', d: null },
  { n: 'Islas Caimán', c: '+1345', d: null },
  { n: 'Islas Marianas del Norte', c: '+1670', d: null },
  { n: 'Islas Marshall', c: '+692', d: null },
  { n: 'Islas Salomón', c: '+677', d: null },
  { n: 'Islas Vírgenes Británicas', c: '+1284', d: null },
  { n: 'Islas Vírgenes de EE. UU.', c: '+1340', d: null },
  { n: 'Israel', c: '+972', d: null },
  { n: 'Italia', c: '+39', d: null },
  { n: 'Jamaica', c: '+1876', d: null },
  { n: 'Japón', c: '+81', d: 10 },
  { n: 'Jordania', c: '+962', d: null },
  { n: 'Kazajistán', c: '+7', d: 10 },
  { n: 'Kenia', c: '+254', d: null },
  { n: 'Kirguistán', c: '+996', d: null },
  { n: 'Kiribati', c: '+686', d: null },
  { n: 'Kuwait', c: '+965', d: null },
  { n: 'Laos', c: '+856', d: null },
  { n: 'Lesoto', c: '+266', d: null },
  { n: 'Letonia', c: '+371', d: null },
  { n: 'Líbano', c: '+961', d: null },
  { n: 'Liberia', c: '+231', d: null },
  { n: 'Libia', c: '+218', d: null },
  { n: 'Liechtenstein', c: '+423', d: null },
  { n: 'Lituania', c: '+370', d: null },
  { n: 'Luxemburgo', c: '+352', d: null },
  { n: 'Madagascar', c: '+261', d: null },
  { n: 'Malasia', c: '+60', d: null },
  { n: 'Malaui', c: '+265', d: null },
  { n: 'Maldivas', c: '+960', d: null },
  { n: 'Malí', c: '+223', d: null },
  { n: 'Malta', c: '+356', d: null },
  { n: 'Marruecos', c: '+212', d: null },
  { n: 'Mauricio', c: '+230', d: null },
  { n: 'Mauritania', c: '+222', d: null },
  { n: 'México', c: '+52', d: 10 },
  { n: 'Micronesia', c: '+691', d: null },
  { n: 'Moldavia', c: '+373', d: null },
  { n: 'Mónaco', c: '+377', d: null },
  { n: 'Mongolia', c: '+976', d: null },
  { n: 'Montenegro', c: '+382', d: null },
  { n: 'Mozambique', c: '+258', d: null },
  { n: 'Namibia', c: '+264', d: null },
  { n: 'Nauru', c: '+674', d: null },
  { n: 'Nepal', c: '+977', d: null },
  { n: 'Nicaragua', c: '+505', d: 8 },
  { n: 'Níger', c: '+227', d: null },
  { n: 'Nigeria', c: '+234', d: null },
  { n: 'Noruega', c: '+47', d: null },
  { n: 'Nueva Zelanda', c: '+64', d: null },
  { n: 'Omán', c: '+968', d: null },
  { n: 'Países Bajos', c: '+31', d: null },
  { n: 'Pakistán', c: '+92', d: null },
  { n: 'Palaos', c: '+680', d: null },
  { n: 'Palestina', c: '+970', d: null },
  { n: 'Panamá', c: '+507', d: 8 },
  { n: 'Papúa Nueva Guinea', c: '+675', d: null },
  { n: 'Paraguay', c: '+595', d: null },
  { n: 'Perú', c: '+51', d: 9 },
  { n: 'Polinesia Francesa', c: '+689', d: null },
  { n: 'Polonia', c: '+48', d: null },
  { n: 'Portugal', c: '+351', d: 9 },
  { n: 'Puerto Rico', c: '+1787', d: 10 },
  { n: 'Reino Unido', c: '+44', d: 10 },
  { n: 'República Centroafricana', c: '+236', d: null },
  { n: 'República Checa', c: '+420', d: null },
  { n: 'República del Congo', c: '+242', d: null },
  { n: 'República Democrática del Congo', c: '+243', d: null },
  { n: 'República Dominicana', c: '+1809', d: 10 },
  { n: 'Ruanda', c: '+250', d: null },
  { n: 'Rumania', c: '+40', d: null },
  { n: 'Rusia', c: '+7', d: 10 },
  { n: 'Samoa', c: '+685', d: null },
  { n: 'Samoa Americana', c: '+1684', d: null },
  { n: 'San Cristóbal y Nieves', c: '+1869', d: null },
  { n: 'San Marino', c: '+378', d: null },
  { n: 'Santa Lucía', c: '+1758', d: null },
  { n: 'Santo Tomé y Príncipe', c: '+239', d: null },
  { n: 'San Vicente y las Granadinas', c: '+1784', d: null },
  { n: 'Senegal', c: '+221', d: null },
  { n: 'Serbia', c: '+381', d: null },
  { n: 'Seychelles', c: '+248', d: null },
  { n: 'Sierra Leona', c: '+232', d: null },
  { n: 'Singapur', c: '+65', d: null },
  { n: 'Siria', c: '+963', d: null },
  { n: 'Somalia', c: '+252', d: null },
  { n: 'Sri Lanka', c: '+94', d: null },
  { n: 'Sudáfrica', c: '+27', d: null },
  { n: 'Sudán', c: '+249', d: null },
  { n: 'Sudán del Sur', c: '+211', d: null },
  { n: 'Suecia', c: '+46', d: null },
  { n: 'Suiza', c: '+41', d: null },
  { n: 'Surinam', c: '+597', d: null },
  { n: 'Tailandia', c: '+66', d: null },
  { n: 'Taiwán', c: '+886', d: null },
  { n: 'Tanzania', c: '+255', d: null },
  { n: 'Tayikistán', c: '+992', d: null },
  { n: 'Timor Oriental', c: '+670', d: null },
  { n: 'Togo', c: '+228', d: null },
  { n: 'Tonga', c: '+676', d: null },
  { n: 'Trinidad y Tobago', c: '+1868', d: null },
  { n: 'Turkmenistán', c: '+993', d: null },
  { n: 'Turquía', c: '+90', d: null },
  { n: 'Tuvalu', c: '+688', d: null },
  { n: 'Ucrania', c: '+380', d: null },
  { n: 'Uganda', c: '+256', d: null },
  { n: 'Uruguay', c: '+598', d: 8 },
  { n: 'Uzbekistán', c: '+998', d: null },
  { n: 'Vanuatu', c: '+678', d: null },
  { n: 'Vaticano', c: '+379', d: null },
  { n: 'Venezuela', c: '+58', d: 10 },
  { n: 'Vietnam', c: '+84', d: null },
  { n: 'Yemen', c: '+967', d: null },
  { n: 'Yibuti', c: '+253', d: null },
  { n: 'Zambia', c: '+260', d: null },
  { n: 'Zimbabue', c: '+263', d: null },
];

/** País que usa un código (útil para el aviso de dígitos). */
export function paisDe(codigo) {
  return PAISES.find((p) => p.c === codigo) || null;
}

/** Dígitos que suele usar el país (null si no hay dato). */
export function digitosEsperados(codigo) {
  const p = paisDe(codigo);
  return p ? p.d : null;
}

/**
 * Separa un teléfono guardado en { codigo, numero }.
 * "+52 55 1234 5678" -> { codigo: '+52', numero: '55 1234 5678' }.
 * Valores sin "+" regresan con codigo vacío (selector en "sin código").
 */
const CODIGOS_ORDENADOS = PAISES.map((p) => p.c).sort((a, b) => b.length - a.length);

export function partirTelefono(valor) {
  const v = String(valor || '').trim();
  if (!v) return { codigo: CODIGO_DEFECTO, numero: '' };
  if (!v.startsWith('+')) return { codigo: '', numero: v };
  const codigo = CODIGOS_ORDENADOS.find((c) => v.startsWith(c));
  if (!codigo) return { codigo: '', numero: v };
  return { codigo, numero: v.slice(codigo.length).trim() };
}

/**
 * Opciones para el <select> de país:
 * México fijado arriba, luego los más comunes y después todos en orden.
 */
const CODIGOS_COMUNES = ['+1', '+57', '+54', '+56', '+51', '+593', '+55', '+34', '+58', '+591', '+598', '+595',
  '+502', '+504', '+503', '+505', '+506', '+507', '+53', '+1809'];

export function htmlOpcionesPais(seleccion = CODIGO_DEFECTO) {
  const opcion = (p) => `<option value="${p.c}" ${p.c === seleccion ? 'selected' : ''}>${p.c} ${p.n}</option>`;
  let html = '';
  if (seleccion === '') {
    html += '<option value="" selected>(sin código)</option>';
  }
  html += opcion(paisDe(CODIGO_DEFECTO));
  const comunes = PAISES.filter((p) => p.c !== CODIGO_DEFECTO && CODIGOS_COMUNES.includes(p.c))
    .sort((a, b) => a.n.localeCompare(b.n, 'es'));
  const resto = PAISES.filter((p) => p.c !== CODIGO_DEFECTO && !CODIGOS_COMUNES.includes(p.c))
    .sort((a, b) => a.n.localeCompare(b.n, 'es'));
  html += '<optgroup label="Los más comunes">' + comunes.map(opcion).join('') + '</optgroup>';
  html += '<optgroup label="Todos los países">' + resto.map(opcion).join('') + '</optgroup>';
  return html;
}
