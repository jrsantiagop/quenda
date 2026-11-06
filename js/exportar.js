/* ==================================================================== */
/* EXPORTACIÓN E IMPORTACIÓN — respaldos JSON y directorio en Excel     */
/*                                                                      */
/* El directorio sale como archivo .xlsx real: cada dato en su columna  */
/* y fila correspondientes, sin depender de la configuración regional   */
/* del equipo de quien lo abre. La importación acepta .xlsx y .csv      */
/* con estas mismas columnas (la plantilla las documenta).              */
/* ==================================================================== */

import { partirTelefono, digitosEsperados, CODIGO_DEFECTO } from './paises.js';

/** Descarga un texto como archivo en el navegador. */
export function descargarArchivo(nombre, contenido, tipoMime) {
  const blob = new Blob([contenido], { type: tipoMime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Nombre de archivo seguro: sin tildes, ñ ni espacios. */
export function slug(texto) {
  const s = String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'comunidad';
}

/** Fecha corta para nombres de archivo: 2026-10-28. */
export function fechaCorta() {
  return new Date().toISOString().slice(0, 10);
}

/* ------------------------- Librería de Excel ------------------------ */

const URL_XLSX = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
let promesaXLSX = null;

/** Carga SheetJS solo cuando se va a exportar o importar (queda en caché). */
export function cargarXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (!promesaXLSX) {
    promesaXLSX = new Promise((resolver, rechazar) => {
      const script = document.createElement('script');
      script.src = URL_XLSX;
      script.onload = () => {
        if (window.XLSX) resolver(window.XLSX);
        else { promesaXLSX = null; rechazar(new Error('No se pudo preparar la librería de Excel.')); }
      };
      script.onerror = () => {
        promesaXLSX = null;
        rechazar(new Error('No se pudo descargar la librería de Excel. Revisa tu conexión a internet.'));
      };
      document.head.appendChild(script);
    });
  }
  return promesaXLSX;
}

/* ------------------- Filas del directorio (comunes) ----------------- */

/**
 * Encabezados exactos del directorio. Exportar, la plantilla y la
 * importación usan siempre estas mismas columnas, en este orden.
 */
export const COLUMNAS_DIRECTORIO = [
  'Ubicación', 'Dirección', 'Estado',
  'Propietario', 'Móvil propietario', 'Casa propietario', 'Trabajo propietario', 'Correo propietario', 'Correo 2 propietario', 'Correo 3 propietario',
  'Inquilino', 'Móvil inquilino', 'Casa inquilino', 'Trabajo inquilino', 'Correo inquilino', 'Correo 2 inquilino', 'Correo 3 inquilino',
  'Emergencia', 'Móvil emergencia', 'Casa emergencia', 'Trabajo emergencia', 'Tipo de sangre', 'Relación',
  'Integrantes', 'Integrantes móviles', 'Integrantes correos',
  'Integrantes inquilino', 'Integrantes inquilino móviles', 'Integrantes inquilino correos',
  'Colaborador vecinal', 'Oficio', 'Nota interna',
];

/** Ambiente de una vivienda: texto legible para el Excel. */
function estadoTexto(v) {
  if (v.activo === false) return 'Inactiva';
  if (v.tipo === 'renta') return 'En renta';
  if (v.tipo === 'vacante') return 'Vacante';
  return 'Propia';
}

/** Una fila por vivienda, con cada dato en su columna. */
export function filasDirectorio({ estructura = [], viviendas = [] }) {
  const nombreDe = (id) => (estructura.find((x) => x.id === id) || {}).nombre || '';
  const filas = [COLUMNAS_DIRECTORIO.slice()];
  for (const v of viviendas) {
    const p = v.propietario || {};
    const tP = p.telefonos || {};
    const i = v.inquilino || {};
    const tI = i.telefonos || {};
    const e = v.emergencia || {};
    const tE = e.telefonos || {};
    filas.push([
      nombreDe(v.ubicaId),
      v.numero || '',
      estadoTexto(v),
      p.nombre || '', tP.movil || '', tP.casa || '', tP.trabajo || '', p.correo || '', p.correo2 || '', p.correo3 || '',
      i.nombre || '', tI.movil || '', tI.casa || '', tI.trabajo || '', i.correo || '', i.correo2 || '', i.correo3 || '',
      e.nombre || '', tE.movil || '', tE.casa || '', tE.trabajo || '', e.tipoSangre || '', e.relacion || '',
      (v.integrantes || []).map((x) => (x.nombre || '')).join('; '),
      (v.integrantes || []).map((x) => (x.movil || '')).join('; '),
      (v.integrantes || []).map((x) => (x.correo || '')).join('; '),
      (v.integrantesInquilino || []).map((x) => (x.nombre || '')).join('; '),
      (v.integrantesInquilino || []).map((x) => (x.movil || '')).join('; '),
      (v.integrantesInquilino || []).map((x) => (x.correo || '')).join('; '),
      v.esColaboradorVecinal ? 'Sí' : 'No',
      v.oficio || '',
      v.notaInterna || '',
    ]);
  }
  return filas;
}

/* ------------------------------ Hoja guía --------------------------- */

const GUIA_FILAS = [
  ['Columna', 'Qué va en cada columna'],
  ['Ubicación', 'Nombre de la calle o torre. Debe coincidir con una ya creada en la sección Estructura.'],
  ['Dirección', 'Número de casa o de apartamento. Junto con la Ubicación identifica la vivienda.'],
  ['Estado', 'Propia, En renta, Vacante o Inactiva. Si va vacío se toma como Propia.'],
  ['Propietario', 'Nombre del propietario.'],
  ['Móvil / Casa / Trabajo', 'Los teléfonos de la persona, en orden: Móvil, Casa y Trabajo. Con código de país, ejemplo: +52 55 1234 5678. El primero es el que muestra WhatsApp.'],
  ['Correo 1, 2 y 3', 'La persona principal necesita al menos un correo para poder guardarse. Los tres correos se leen en orden.'],
  ['Inquilino', 'Solo llenar cuando el Estado es «En renta». Nombre y datos de contacto del inquilino.'],
  ['Emergencia', 'Contacto de emergencia opcional: nombre, teléfonos, tipo de sangre y relación.'],
  ['Integrantes', 'Referencias del PROPIETARIO: solo sus nombres, separados por punto y coma. Ej.: Ana Pérez; Luis Pérez.'],
  ['Integrantes móviles', 'Los móviles en el MISMO orden de los nombres. Ej.: +52 55 1111 2222; +52 55 3333 4444.'],
  ['Integrantes correos', 'Los correos en el MISMO orden de los nombres. Ej.: ana@correo.com; luis@correo.com.'],
  ['Integrantes inquilino', 'Igual que Integrantes, pero referencias que dejó EL INQUILINO (solo casas En renta).'],
  ['Integrantes inquilino móviles', 'Los móviles de esas referencias en el mismo orden.'],
  ['Integrantes inquilino correos', 'Los correos de esas referencias en el mismo orden.'],
  ['Colaborador vecinal', 'Escribir Sí o No.'],
  ['Oficio', 'Oficio del propietario o inquilino si colabora con la comunidad (opcional).'],
  ['Nota interna', 'Nota visible solo para administración; no aparece en el directorio de vecinos.'],
  ['', 'No cambies los nombres de las columnas ni borres la fila de encabezados.'],
];

/* --------------------------- Exportación ---------------------------- */

/** Anchos de columna (en caracteres) para que el Excel se lea cómodo. */
const ANCHOS_DIRECTORIO = [18, 14, 10, 24, 18, 18, 18, 30, 30, 30, 24, 18, 18, 18, 30, 30, 30, 24, 18, 18, 18, 10, 16, 30, 28, 30, 30, 28, 30, 12, 24, 44];

/** Arma el libro con hoja de datos + hoja Guía y dispara la descarga. */
async function guardarConGuia(nombreArchivo, filas) {
  const XLSX = await cargarXLSX();
  const libro = XLSX.utils.book_new();

  const hojaDatos = XLSX.utils.aoa_to_sheet(filas);
  hojaDatos['!cols'] = ANCHOS_DIRECTORIO.map((wch) => ({ wch }));
  hojaDatos['!autofilter'] = {
    ref: `A1:${XLSX.utils.encode_col(filas[0].length - 1)}${filas.length}`,
  };
  XLSX.utils.book_append_sheet(libro, hojaDatos, 'Directorio');

  const hojaGuia = XLSX.utils.aoa_to_sheet(GUIA_FILAS);
  hojaGuia['!cols'] = [{ wch: 22 }, { wch: 78 }];
  XLSX.utils.book_append_sheet(libro, hojaGuia, 'Guía');

  XLSX.writeFile(libro, nombreArchivo);
}

/** Descarga el directorio completo de la comunidad como .xlsx. */
export async function descargarExcel({ comunidad = '', estructura = [], viviendas = [] }) {
  await guardarConGuia(
    `directorio-${slug(comunidad)}-${fechaCorta()}.xlsx`,
    filasDirectorio({ estructura, viviendas }),
  );
}

/** Plantilla con encabezados, dos ejemplos y la hoja Guía. */
export async function descargarPlantilla() {
  const ejemplo = [
    ['Calle Principal', '1', 'Propia', 'Pedro Ejemplo', '+52 55 1234 5678', '', '', 'pedro@ejemplo.com', '', '',
      '', '', '', '', '', '', '',
      'Laura Ejemplo', '+52 55 8765 4321', '', '', 'O+', 'Esposa',
      'Sofía Ejemplo; Ana Ejemplo', '+52 55 3344 5566; +52 55 7788 9900', 'sofia@ejemplo.com; ana@ejemplo.com',
      '', '', '',
      'Sí', 'Enfermera', ''],
    ['Calle Principal', '2', 'En renta', 'Marta Dueños', '+52 55 6600 1122', '', '', 'marta@ejemplo.com', '', '',
      'Ana Inquilina', '+52 55 9900 1122', '', '', 'ana@ejemplo.com', 'ana2@ejemplo.com', '',
      'Jorge Ayuda', '+52 55 5566 7788', '', '', 'O+', 'Hijo de la inquilina',
      '', '', '',
      'Referencia Inquilino', '+52 55 2233 4455', 'referencia@ejemplo.com',
      'No', '', ''],
  ];
  await guardarConGuia('plantilla-directorio-quenda.xlsx', [COLUMNAS_DIRECTORIO.slice(), ...ejemplo]);
}

/* --------------------------- Importación ---------------------------- */

const MAPA_COLUMNAS = {
  'ubicacion': 'calle',
  'direccion': 'numero',
  'estado': 'estado',
  'propietario': 'p.nombre',
  'movil propietario': 'p.movil',
  'casa propietario': 'p.casa',
  'trabajo propietario': 'p.trabajo',
  'correo propietario': 'p.correo',
  'correo 2 propietario': 'p.correo2',
  'correo 3 propietario': 'p.correo3',
  'inquilino': 'i.nombre',
  'movil inquilino': 'i.movil',
  'casa inquilino': 'i.casa',
  'trabajo inquilino': 'i.trabajo',
  'correo inquilino': 'i.correo',
  'correo 2 inquilino': 'i.correo2',
  'correo 3 inquilino': 'i.correo3',
  'emergencia': 'e.nombre',
  'movil emergencia': 'e.movil',
  'casa emergencia': 'e.casa',
  'trabajo emergencia': 'e.trabajo',
  'tipo de sangre': 'e.sangre',
  'relacion': 'e.relacion',
  'integrantes': 'integrantes',
  'integrantes moviles': 'integrantesMoviles',
  'integrantes correos': 'integrantesCorreos',
  'integrantes inquilino': 'integrantesInquilino',
  'integrantes inquilino moviles': 'integrantesInquilinoMoviles',
  'integrantes inquilino correos': 'integrantesInquilinoCorreos',
  'colaborador vecinal': 'colaborador',
  'oficio': 'oficio',
  'nota interna': 'nota',
};

/** Minúsculas, sin tildes y con un solo espacio: para comparar textos. */
function igualTxt(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\uFEFF/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Decodifica los bytes de un archivo de texto: los .csv suelen grabarse
 * en UTF-8, pero Excel en Windows a veces los graba en ANSI (Latin-1).
 * Si el texto UTF-8 trae tildes "dobles" (Ã³, Ã©…) es señal de ANSI.
 */
function decodificarTexto(bytes) {
  const utf8 = new TextDecoder('utf-8').decode(bytes);
  if (utf8.includes('Ã') || utf8.includes('\uFFFD')) {
    return new TextDecoder('windows-1252').decode(bytes);
  }
  return utf8;
}

/**
 * Lee un archivo .xlsx o .csv y devuelve los encabezados y las filas
 * (arreglos de celdas) de la primera hoja útil, ignorando la hoja Guía.
 */
export async function leerArchivoImport(archivo) {
  const XLSX = await cargarXLSX();
  const datos = await archivo.arrayBuffer();
  // El .xlsx es un zip (empieza con "PK"); el .csv es texto plano.
  const bytes = new Uint8Array(datos);
  const esZip = bytes.length > 1 && bytes[0] === 0x50 && bytes[1] === 0x4B;
  let libro;
  if (esZip) {
    libro = XLSX.read(datos, { type: 'array' });
  } else {
    const texto = decodificarTexto(bytes);
    libro = XLSX.read(texto, { type: 'string' });
  }
  const nombreHoja = libro.SheetNames.find((n) => !/gu[ií]a/i.test(n)) || libro.SheetNames[0];
  const hoja = libro.Sheets[nombreHoja];
  if (!hoja) throw new Error('El archivo no tiene hojas con datos.');
  const todas = XLSX.utils.sheet_to_json(hoja, { header: 1, raw: false, defval: '' });
  const vacia = (f) => !f.some((c) => String(c || '').trim());
  const primera = todas.findIndex((f) => !vacia(f));
  if (primera < 0) throw new Error('El archivo está vacío.');
  const encabezados = todas[primera].map((c) => String(c == null ? '' : c).trim());
  const filas = todas.slice(primera + 1).filter((f) => !vacia(f));
  if (!filas.length) throw new Error('El archivo no tiene filas de datos debajo de los encabezados.');
  return { encabezados, filas };
}

/**
 * Analiza las filas del archivo contra la comunidad actual.
 * Regresa items con lo que se hará por fila (crear / actualizar / descartar)
 * y un resumen — pensado para la revisión previa, NADA se ha guardado aquí.
 */
export function analizarImportacion({ encabezados = [], filas = [], estructura = [], existentes = [] }) {
  const nombreDe = (id) => (estructura.find((x) => x.id === id) || {}).nombre || '';

  // Columnas reconocidas en el archivo (para avisar si parece otro archivo).
  const reconocidas = encabezados.filter((h) => h && MAPA_COLUMNAS[igualTxt(h)]);

  const items = filas.map((f, idx) => {
    const v = {};
    encabezados.forEach((h, i) => {
      const clave = MAPA_COLUMNAS[igualTxt(h)];
      if (clave) v[clave] = String(f[i] == null ? '' : f[i]).trim();
    });

    const item = {
      fila: idx + 2, // la fila 1 del Excel son los encabezados
      calle: v.calle || '',
      numero: v.numero || '',
      existeId: null,
      datosGuardar: null,
      errores: [],
      avisos: [],
    };

    if (!v.calle) item.errores.push('Falta la Ubicación (nombre de la calle o torre).');
    if (!v.numero) item.errores.push('Falta la Dirección (número de casa o apartamento).');

    // La calle debe existir en la estructura de la comunidad.
    let ubicaId = '';
    if (v.calle) {
      const calle = estructura.find((e) => igualTxt(e.nombre) === igualTxt(v.calle));
      if (calle) ubicaId = calle.id;
      else item.errores.push(`La calle «${v.calle}» no existe en Estructura. Créala primero en esa sección.`);
    }

    // Estado de la vivienda.
    let tipo = 'propia';
    let activo = true;
    const estado = igualTxt(v.estado);
    if (estado === 'renta' || estado === 'en renta') tipo = 'renta';
    else if (estado === 'vacante') tipo = 'vacante';
    else if (estado === 'inactiva') activo = false;
    else if (estado === '' || estado === 'propia' || estado === 'propietario ocupante') tipo = 'propia';
    else item.avisos.push(`Estado «${v.estado}» no reconocido; se toma como Propia.`);

    // Teléfonos: separar el código de país del número local.
    function telefonoDe(texto, etiqueta) {
      const { codigo, numero } = partirTelefono(texto);
      if (!numero) return { valor: '', avisos: [] };
      const avisos = [];
      let cod = codigo;
      if (!cod) { cod = CODIGO_DEFECTO; avisos.push(`${etiqueta}: sin código de país, se asumió ${CODIGO_DEFECTO} (México).`); }
      const esperados = digitosEsperados(cod);
      const digitos = numero.replace(/\D/g, '');
      if (esperados && digitos.length !== esperados) {
        avisos.push(`${etiqueta}: tiene ${digitos.length} dígitos y ${cod} suele usar ${esperados}; revisa el número.`);
      }
      return { valor: `${cod} ${numero}`, avisos };
    }

    function bloquePersona(prefijo, etiquetas) {
      const t = {
        movil: telefonoDe(v[`${prefijo}.movil`] || '', etiquetas.movil),
        casa: telefonoDe(v[`${prefijo}.casa`] || '', etiquetas.casa),
        trabajo: telefonoDe(v[`${prefijo}.trabajo`] || '', etiquetas.trabajo),
      };
      t.movil.avisos.forEach((a) => item.avisos.push(a));
      t.casa.avisos.forEach((a) => item.avisos.push(a));
      t.trabajo.avisos.forEach((a) => item.avisos.push(a));
      const telefonos = { movil: t.movil.valor, casa: t.casa.valor, trabajo: t.trabajo.valor };
      const correos = [v[`${prefijo}.correo`] || '', v[`${prefijo}.correo2`] || '', v[`${prefijo}.correo3`] || ''];
      correos.forEach((c, i) => {
        if (c && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) {
          item.errores.push(`${etiquetas.nombre}: el correo${i ? ` ${i + 1}` : ''} «${c}» no parece válido.`);
        }
      });
      return {
        nombre: v[`${prefijo}.nombre`] || '',
        correo: correos[0], correo2: correos[1], correo3: correos[2], telefonos,
        telefono: telefonos.movil || telefonos.casa || telefonos.trabajo || '',
      };
    }

    const propietario = bloquePersona('p', { nombre: 'el propietario', movil: 'Móvil propietario', casa: 'Casa propietario', trabajo: 'Trabajo propietario' });
    const inquilinoDatos = bloquePersona('i', { nombre: 'el inquilino', movil: 'Móvil inquilino', casa: 'Casa inquilino', trabajo: 'Trabajo inquilino' });
    const emergencia = bloquePersona('e', { nombre: 'la emergencia', movil: 'Móvil emergencia', casa: 'Casa emergencia', trabajo: 'Trabajo emergencia' });
    emergencia.tipoSangre = v['e.sangre'] || '';
    emergencia.relacion = v['e.relacion'] || '';

    // El inquilino solo entra cuando la vivienda está en renta (igual que el formulario).
    let inquilino = null;
    if (tipo === 'renta') {
      const conDatos = inquilinoDatos.nombre || inquilinoDatos.telefono || inquilinoDatos.correo
        || inquilinoDatos.correo2 || inquilinoDatos.correo3;
      if (conDatos) inquilino = inquilinoDatos;
      else item.avisos.push('El estado es En renta pero no hay datos de inquilino.');
    } else if (inquilinoDatos.nombre || inquilinoDatos.telefono || inquilinoDatos.correo
      || inquilinoDatos.correo2 || inquilinoDatos.correo3) {
      item.avisos.push('Los datos de inquilino se ignoraron porque el estado no es En renta.');
    }

    // Regla de guardado (Opción A): la persona principal necesita
    // al menos un teléfono y al menos un correo.
    const principal = (tipo === 'renta' && inquilino && inquilino.nombre) ? inquilino : propietario;
    const etiquetaPrincipal = principal === inquilino ? 'el inquilino' : 'el propietario';
    if (!principal.telefono) item.errores.push(`La persona principal (${etiquetaPrincipal}) necesita al menos un teléfono.`);
    if (!principal.correo && !principal.correo2 && !principal.correo3) {
      item.errores.push(`La persona principal (${etiquetaPrincipal}) necesita al menos un correo.`);
    }

    // Integrantes: tres columnas paralelas (nombres, móviles, correos),
    // cada una separada por punto y coma y alineada por posición.
    const trozos = (texto) => String(texto || '')
      .split(/[;|]/)
      .map((t) => t.trim())
      .filter(Boolean);
    function integrantesDe(nombres, moviles, correos) {
      if (!nombres.length && (moviles.length || correos.length)) {
        item.avisos.push('Hay móviles o correos de integrantes sin nombres; se ignoraron.');
      }
      return nombres.map((nombre, i) => ({
        nombre,
        movil: moviles[i] || '',
        correo: correos[i] || '',
      }));
    }
    const integrantes = integrantesDe(trozos(v.integrantes), trozos(v.integrantesMoviles), trozos(v.integrantesCorreos));
    const integrantesInquilino = integrantesDe(
      trozos(v.integrantesInquilino), trozos(v.integrantesInquilinoMoviles), trozos(v.integrantesInquilinoCorreos));

    const colaboradorTxt = igualTxt(v.colaborador);
    if (colaboradorTxt && colaboradorTxt !== 'si' && colaboradorTxt !== 'no') {
      item.avisos.push(`Colaborador vecinal «${v.colaborador}» no se entendió; se tomó como No.`);
    }

    item.ubicaId = ubicaId;
    item.datosGuardar = item.errores.length ? null : {
      ubicaId,
      numero: item.numero,
      tipo,
      propietario,
      inquilino,
      integrantes,
      integrantesInquilino: tipo === 'renta' ? integrantesInquilino : [],
      emergencia,
      esColaboradorVecinal: colaboradorTxt === 'si',
      oficio: v.oficio || '',
      notaInterna: v.nota || '',
      activo,
    };

    // ¿Corresponde a una vivienda que ya existe? (misma calle y número)
    const existente = existentes.find((x) =>
      igualTxt(nombreDe(x.ubicaId)) === igualTxt(item.calle)
      && String(x.numero || '').trim() === String(item.numero || '').trim());
    if (existente) item.existeId = existente.id;

    return item;
  });

  const resumen = {
    reconocidas,
    nuevas: items.filter((i) => i.datosGuardar && !i.existeId).length,
    actualizan: items.filter((i) => i.datosGuardar && i.existeId).length,
    descartadas: items.filter((i) => !i.datosGuardar).length,
    conAvisos: items.filter((i) => i.avisos.length).length,
  };
  return { items, resumen };
}
