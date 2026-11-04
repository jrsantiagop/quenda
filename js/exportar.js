/* ==================================================================== */
/* EXPORTACIÓN — respaldos y directorio en CSV                          */
/* ==================================================================== */

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

/** Convierte filas (arreglos de celdas) en CSV con ; y comillas (Excel en español). */
export function aCSV(filas) {
  return filas
    .map((f) => f.map((c) => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(';'))
    .join('\r\n');
}

/**
 * Directorio completo de una comunidad en CSV (para Excel).
 * datos: { estructura, viviendas } — una fila por vivienda.
 */
export function directorioCSV({ estructura = [], viviendas = [] }) {
  const nombreDe = (id) => {
    const e = estructura.find((x) => x.id === id);
    return e ? e.nombre : '';
  };
  const filas = [[
    'Ubicación', 'Dirección', 'Estado',
    'Propietario', 'Móvil propietario', 'Casa propietario', 'Trabajo propietario', 'Correo propietario', 'Correo 2 propietario',
    'Inquilino', 'Móvil inquilino', 'Casa inquilino', 'Trabajo inquilino', 'Correo inquilino', 'Correo 2 inquilino',
    'Emergencia', 'Móvil emergencia', 'Casa emergencia', 'Trabajo emergencia', 'Tipo de sangre', 'Relación',
    'Integrantes', 'Colaborador vecinal', 'Oficio', 'Nota interna',
  ]];
  for (const v of viviendas) {
    const p = v.propietario || {};
    const tP = p.telefonos || {};
    const i = v.inquilino || {};
    const tI = i.telefonos || {};
    const e = v.emergencia || {};
    const tE = e.telefonos || {};
    const estado = v.activo === false
      ? 'Inactiva'
      : v.tipo === 'renta' ? 'En renta' : v.tipo === 'vacante' ? 'Vacante' : 'Propia';
    filas.push([
      nombreDe(v.ubicaId),
      v.numero || '',
      estado,
      p.nombre || '', tP.movil || '', tP.casa || '', tP.trabajo || '', p.correo || '', p.correo2 || '',
      i.nombre || '', tI.movil || '', tI.casa || '', tI.trabajo || '', i.correo || '', i.correo2 || '',
      e.nombre || '', tE.movil || '', tE.casa || '', tE.trabajo || '', e.tipoSangre || '', e.relacion || '',
      (v.integrantes || []).map((x) => (x.relacion ? `${x.nombre} (${x.relacion})` : x.nombre)).join('; '),
      v.esColaboradorVecinal ? 'Sí' : 'No',
      v.oficio || '',
      v.notaInterna || '',
    ]);
  }
  return aCSV(filas);
}
