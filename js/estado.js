// ============================================================================
// QUENDA — Estado compartido de la aplicación
// Guarda el usuario en sesión y la comunidad activa, e informa a la interfaz
// cuando cambian (patrón de suscripción simple).
// ============================================================================

export const estado = {
  usuario: null,     // { id/uid, correo, nombre, rol, comunidadId, activo }
  comunidad: null,   // objeto de la comunidad activa (o null para superadmin sin selección)
};

const oyentes = [];

/** Registra una función que se ejecuta cada vez que cambia el estado. */
export function suscribir(fn) {
  oyentes.push(fn);
}

/** Ejecuta todos los oyentes registrados. */
export function notificarCambios() {
  oyentes.forEach((fn) => {
    try { fn(); } catch (err) { console.error('Error en oyente de estado:', err); }
  });
}

/** Fija la comunidad activa (objeto completo o null) y avisa al resto de la app. */
export async function elegirComunidad(comunidad) {
  estado.comunidad = comunidad || null;
  if (comunidad && comunidad.id) {
    localStorage.setItem('quenda_com_activa', comunidad.id);
  } else {
    localStorage.removeItem('quenda_com_activa');
  }
  notificarCambios();
}

/** Id de la última comunidad activa (para recuperar sesión del superadmin). */
export function idComunidadRecordada() {
  return localStorage.getItem('quenda_com_activa') || '';
}
