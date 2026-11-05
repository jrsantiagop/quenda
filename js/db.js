// ============================================================================
// QUENDA — Capa de datos y autenticación
//
// Funciona en dos modos (detectados automáticamente):
//   - 'firebase': usa Firebase Auth + Firestore (configuración real).
//   - 'demo':     datos de ejemplo guardados solo en este navegador
//                 (localStorage), para probar sin conexión ni cuenta.
//
// TODA la app conversa solo con estas funciones; las páginas nunca tocan
// Firebase directamente. Igual la lógica, cambia solo la capa.
// ============================================================================

import { FIREBASE_CONFIG } from './firebase-config.js';

const apiKey = FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey ? String(FIREBASE_CONFIG.apiKey).trim() : '';
export const MODO = apiKey && !apiKey.startsWith('TU_') ? 'firebase' : 'demo';

/* ------------------------------------------------------------------ */
/* MODO DEMOSTRACIÓN (localStorage)                                    */
/* ------------------------------------------------------------------ */

const CLAVE_DB = 'quenda_demo_db_v1';
const CLAVE_SESION = 'quenda_demo_sesion';
let oyentesAuth = [];

function datosInicialesDemo() {
  return {
    comunidades: [
      { id: 'c1', nombre: 'Residencial Los Álamos', tipoEstructura: 'calles', colorPrimario: '#0e7490', colorAcento: '#f59e0b', activa: true },
      { id: 'c2', nombre: 'Torres Miramar', tipoEstructura: 'torres', colorPrimario: '#4338ca', colorAcento: '#e11d48', activa: true },
    ],
    estructura: {
      c1: [
        { id: 's1', nombre: 'Calle Los Fresnos' },
        { id: 's2', nombre: 'Calle Los Robles' },
      ],
      c2: [
        { id: 't1', nombre: 'Torre A', pisos: 6 },
        { id: 't2', nombre: 'Torre B', pisos: 4 },
      ],
    },
    viviendas: {
      c1: [
        {
          id: 'v1', ubicaId: 's1', numero: '12', tipo: 'propia',
          propietario: { nombre: 'María González', telefono: '+56912345678', correo: 'maria.gonzalez@example.com' },
          inquilino: null,
          integrantes: [
            { nombre: 'Pedro González', relacion: 'Cónyuge' },
            { nombre: 'Lucía González', relacion: 'Hija' },
          ],
          emergencia: { nombre: 'Jorge Herrera', telefono: '+56987654321', tipoSangre: 'O+', relacion: 'Familiar' },
          esColaboradorVecinal: true, oficio: 'Enfermera',
          notaInterna: '', activo: true,
        },
        {
          id: 'v2', ubicaId: 's1', numero: '15', tipo: 'renta',
          propietario: { nombre: 'Inversiones Rojas SpA', telefono: '+56960000001', correo: 'arriendo@rojas.cl' },
          inquilino: { nombre: 'Diego Fuentes', telefono: '+56922223344', correo: 'diego.fuentes@example.com' },
          integrantes: [{ nombre: 'Sofía Muñoz', relacion: 'Cónyuge' }],
          emergencia: { nombre: '', telefono: '', tipoSangre: '', relacion: '' },
          esColaboradorVecinal: false, oficio: '',
          notaInterna: 'Contrato de arriendo vence en marzo 2027.', activo: true,
        },
        {
          id: 'v3', ubicaId: 's2', numero: '77', tipo: 'vacante',
          propietario: { nombre: 'Carlos Soto', telefono: '+56955555555', correo: '' },
          inquilino: null,
          integrantes: [],
          emergencia: { nombre: '', telefono: '', tipoSangre: '', relacion: '' },
          esColaboradorVecinal: false, oficio: '',
          notaInterna: '', activo: true,
        },
      ],
      c2: [
        {
          id: 'v4', ubicaId: 't1', numero: '304', tipo: 'renta',
          propietario: { nombre: 'Inmobiliaria Paz', telefono: '+56960000002', correo: 'rentas@paz.cl' },
          inquilino: { nombre: 'Familia Ríos', telefono: '+56933334455', correo: '' },
          integrantes: [],
          emergencia: { nombre: '', telefono: '', tipoSangre: '', relacion: '' },
          esColaboradorVecinal: false, oficio: '',
          notaInterna: '', activo: true,
        },
        {
          id: 'v5', ubicaId: 't2', numero: '102', tipo: 'propia',
          propietario: { nombre: 'Rosario Pinto', telefono: '+56944445566', correo: '' },
          inquilino: null,
          integrantes: [],
          emergencia: { nombre: '', telefono: '', tipoSangre: '', relacion: '' },
          esColaboradorVecinal: false, oficio: 'Plomero',
          notaInterna: '', activo: true,
        },
      ],
    },
    usuarios: [
      { id: 'u1', correo: 'super@demo.com', clave: '123456', nombre: 'Super Administrador', rol: 'superadmin', comunidadId: '', activo: true },
      { id: 'u2', correo: 'admin@demo.com', clave: '123456', nombre: 'Ana Administradora', rol: 'admin', comunidadId: 'c1', activo: true },
      { id: 'u3', correo: 'vecino@demo.com', clave: '123456', nombre: 'Carlos Vecino', rol: 'residente', comunidadId: 'c1', activo: true },
    ],
  };
}

function leerDemo() {
  const crudo = localStorage.getItem(CLAVE_DB);
  if (!crudo) {
    const datos = datosInicialesDemo();
    localStorage.setItem(CLAVE_DB, JSON.stringify(datos));
    return datos;
  }
  try { return JSON.parse(crudo); } catch { const d = datosInicialesDemo(); localStorage.setItem(CLAVE_DB, JSON.stringify(d)); return d; }
}

function escribirDemo(datos) {
  localStorage.setItem(CLAVE_DB, JSON.stringify(datos));
}

function nuevoIdDemo() {
  return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function perfilPublico(u) {
  if (!u) return null;
  return { id: u.id, correo: u.correo, nombre: u.nombre, rol: u.rol, comunidadId: u.comunidadId, activo: u.activo };
}

function notificarAuthDemo() {
  const ses = localStorage.getItem(CLAVE_SESION);
  let u = null;
  if (ses) {
    const d = leerDemo();
    u = d.usuarios.find((x) => x.id === ses) || null;
    if (u && u.activo === false) u = null;
  }
  oyentesAuth.forEach((cb) => { try { cb(perfilPublico(u)); } catch (err) { console.error(err); } });
}

/* ------------------------------------------------------------------ */
/* MODO FIREBASE                                                       */
/* ------------------------------------------------------------------ */

let FB = null;

async function initFirebase() {
  if (FB) return FB;
  const [appMod, authMod, fsMod] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'),
  ]);
  const app = appMod.initializeApp(FIREBASE_CONFIG);
  const auth = authMod.getAuth(app);
  // Correos de Firebase (restablecer clave, verificar correo) en español.
  // Firebase ya trae sus plantillas traducidas; la personalización del texto
  // en el Console está bloqueada por un error conocido de Google
  // (EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED, issuetracker 520781452), así que
  // usamos la plantilla oficial en español indicando el idioma del SDK.
  auth.languageCode = 'es';
  // La base de datos del proyecto se creó con ID "default" (no la especial
  // "(default)"), así que hay que indicárselo al SDK. Configurable en
  // firebase-config.js mediante "firestoreDatabaseId".
  const baseId = FIREBASE_CONFIG.firestoreDatabaseId || 'default';
  const fs = fsMod.getFirestore(app, baseId);
  FB = { app, appMod, auth, authMod, fs, fsMod };
  return FB;
}

function mensajeAuth(err) {
  const codigo = err && err.code ? err.code : '';
  if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password', 'auth/invalid-email'].includes(codigo)) {
    return 'Correo o clave incorrectos.';
  }
  if (codigo === 'auth/network-request-failed') return 'Problema de conexión. Revisa tu internet.';
  if (codigo === 'auth/email-already-in-use') return 'Ese correo ya tiene una cuenta registrada.';
  if (codigo === 'auth/weak-password') return 'La clave debe tener al menos 6 caracteres.';
  if (codigo === 'permission-denied') return 'No tienes permisos para esta acción (revisa las reglas de Firestore).';
  return err && err.message ? err.message : 'Error inesperado.';
}

/* ------------------------------------------------------------------ */
/* AUTENTICACIÓN                                                       */
/* ------------------------------------------------------------------ */

export async function login(correo, clave) {
  correo = String(correo || '').trim();
  if (MODO === 'demo') {
    const d = leerDemo();
    const u = d.usuarios.find((x) => x.correo.toLowerCase() === correo.toLowerCase() && x.clave === clave);
    if (!u) throw new Error('Correo o clave incorrectos.');
    if (u.activo === false) throw new Error('Tu cuenta está desactivada. Contacta a la administración.');
    localStorage.setItem(CLAVE_SESION, u.id);
    notificarAuthDemo();
    return perfilPublico(u);
  }

  const { auth, authMod, fs, fsMod } = await initFirebase();
  let cred;
  try {
    cred = await authMod.signInWithEmailAndPassword(auth, correo, clave);
  } catch (err) {
    throw new Error(mensajeAuth(err));
  }
  const snap = await fsMod.getDoc(fsMod.doc(fs, 'usuarios', cred.user.uid));
  if (!snap.exists()) {
    await authMod.signOut(auth);
    throw new Error('La cuenta no tiene perfil asignado en QUENDA. Contacta al superadministrador.');
  }
  return { uid: cred.user.uid, correo: cred.user.email, ...snap.data() };
}

export async function logout() {
  if (MODO === 'demo') {
    localStorage.removeItem(CLAVE_SESION);
    notificarAuthDemo();
    return;
  }
  const { auth, authMod } = await initFirebase();
  await authMod.signOut(auth);
}

/**
 * Registra un oyente del estado de sesión. cb(usuario | null).
 * Es asíncrona porque en modo firebase descarga los módulos del CDN.
 */
export async function onAuthChange(cb) {
  if (MODO === 'demo') {
    oyentesAuth.push(cb);
    notificarAuthDemo();
    return;
  }
  const { auth, authMod, fs, fsMod } = await initFirebase();
  authMod.onAuthStateChanged(auth, async (cred) => {
    if (!cred) { cb(null); return; }
    const snap = await fsMod.getDoc(fsMod.doc(fs, 'usuarios', cred.uid));
    if (!snap.exists()) { cb(null); return; }
    cb({ uid: cred.uid, correo: cred.email, ...snap.data() });
  });
}

/* ------------------------------------------------------------------ */
/* COMUNIDADES                                                         */
/* ------------------------------------------------------------------ */

export async function listComunidades() {
  if (MODO === 'demo') {
    return leerDemo().comunidades.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }
  const { fs, fsMod } = await initFirebase();
  const snap = await fsMod.getDocs(fsMod.collection(fs, 'comunidades'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'));
}

export async function getComunidad(id) {
  if (!id) return null;
  if (MODO === 'demo') return leerDemo().comunidades.find((c) => c.id === id) || null;
  const { fs, fsMod } = await initFirebase();
  const snap = await fsMod.getDoc(fsMod.doc(fs, 'comunidades', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Crea (id = null) o actualiza una comunidad. Devuelve el id. */
export async function saveComunidad(datos, id = null) {
  if (MODO === 'demo') {
    const d = leerDemo();
    if (id) {
      const i = d.comunidades.findIndex((c) => c.id === id);
      if (i >= 0) d.comunidades[i] = { ...d.comunidades[i], ...datos };
      escribirDemo(d);
      return id;
    }
    const nuevo = { id: nuevoIdDemo(), ...datos };
    d.comunidades.push(nuevo);
    escribirDemo(d);
    return nuevo.id;
  }
  const { fs, fsMod } = await initFirebase();
  if (id) {
    await fsMod.setDoc(fsMod.doc(fs, 'comunidades', id), datos, { merge: true });
    return id;
  }
  const ref = await fsMod.addDoc(fsMod.collection(fs, 'comunidades'), datos);
  return ref.id;
}

/* ------------------------------------------------------------------ */
/* ESTRUCTURA (calles o torres)                                        */
/* ------------------------------------------------------------------ */

export async function listEstructura(comunidadId) {
  if (MODO === 'demo') {
    return (leerDemo().estructura[comunidadId] || [])
      .slice()
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }
  const { fs, fsMod } = await initFirebase();
  const snap = await fsMod.getDocs(fsMod.collection(fs, 'comunidades', comunidadId, 'estructura'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'));
}

export async function saveEstructuraItem(comunidadId, datos, id = null) {
  if (MODO === 'demo') {
    const d = leerDemo();
    if (!d.estructura[comunidadId]) d.estructura[comunidadId] = [];
    if (id) {
      const i = d.estructura[comunidadId].findIndex((e) => e.id === id);
      if (i >= 0) d.estructura[comunidadId][i] = { ...d.estructura[comunidadId][i], ...datos };
      escribirDemo(d);
      return id;
    }
    const nuevo = { id: nuevoIdDemo(), ...datos };
    d.estructura[comunidadId].push(nuevo);
    escribirDemo(d);
    return nuevo.id;
  }
  const { fs, fsMod } = await initFirebase();
  const col = fsMod.collection(fs, 'comunidades', comunidadId, 'estructura');
  if (id) {
    await fsMod.setDoc(fsMod.doc(col, id), datos, { merge: true });
    return id;
  }
  const ref = await fsMod.addDoc(col, datos);
  return ref.id;
}

export async function deleteEstructuraItem(comunidadId, id) {
  if (MODO === 'demo') {
    const d = leerDemo();
    d.estructura[comunidadId] = (d.estructura[comunidadId] || []).filter((e) => e.id !== id);
    escribirDemo(d);
    return;
  }
  const { fs, fsMod } = await initFirebase();
  await fsMod.deleteDoc(fsMod.doc(fs, 'comunidades', comunidadId, 'estructura', id));
}

/* ------------------------------------------------------------------ */
/* VIVIENDAS                                                           */
/* ------------------------------------------------------------------ */

export async function listViviendas(comunidadId) {
  if (MODO === 'demo') {
    return (leerDemo().viviendas[comunidadId] || []).slice();
  }
  const { fs, fsMod } = await initFirebase();
  const snap = await fsMod.getDocs(fsMod.collection(fs, 'comunidades', comunidadId, 'viviendas'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function saveVivienda(comunidadId, datos, id = null) {
  if (MODO === 'demo') {
    const d = leerDemo();
    if (!d.viviendas[comunidadId]) d.viviendas[comunidadId] = [];
    if (id) {
      const i = d.viviendas[comunidadId].findIndex((v) => v.id === id);
      if (i >= 0) d.viviendas[comunidadId][i] = { ...d.viviendas[comunidadId][i], ...datos };
      escribirDemo(d);
      return id;
    }
    const nuevo = { id: nuevoIdDemo(), ...datos };
    d.viviendas[comunidadId].push(nuevo);
    escribirDemo(d);
    return nuevo.id;
  }
  const { fs, fsMod } = await initFirebase();
  const col = fsMod.collection(fs, 'comunidades', comunidadId, 'viviendas');
  if (id) {
    await fsMod.setDoc(fsMod.doc(col, id), datos, { merge: true });
    return id;
  }
  const ref = await fsMod.addDoc(col, datos);
  return ref.id;
}

export async function deleteVivienda(comunidadId, id) {
  if (MODO === 'demo') {
    const d = leerDemo();
    d.viviendas[comunidadId] = (d.viviendas[comunidadId] || []).filter((v) => v.id !== id);
    escribirDemo(d);
    return;
  }
  const { fs, fsMod } = await initFirebase();
  await fsMod.deleteDoc(fsMod.doc(fs, 'comunidades', comunidadId, 'viviendas', id));
}

/** Rellena campos faltantes de una vivienda para que la interfaz nunca se quede sin datos. */
export function viviendaNormalizada(v) {
  // Una persona admite hasta 3 teléfonos: casa, trabajo y móvil.
  // Compatibilidad: si el registro antiguo trae solo "telefono", pasa a móvil.
  function persona(p) {
    const base = { nombre: '', correo: '', correo2: '', ...(p || {}) };
    const t = base.telefonos || {};
    const telefonos = {
      casa: String(t.casa || '').trim(),
      trabajo: String(t.trabajo || '').trim(),
      movil: String(t.movil || '').trim(),
    };
    if (!telefonos.casa && !telefonos.trabajo && !telefonos.movil && base.telefono) {
      telefonos.movil = String(base.telefono).trim();
    }
    const telefono = telefonos.movil || telefonos.casa || telefonos.trabajo || '';
    return { nombre: '', telefono: '', correo: '', ...base, telefonos, telefono };
  }

  const emergencia = persona(v.emergencia);
  emergencia.tipoSangre = (v.emergencia && v.emergencia.tipoSangre) || '';
  emergencia.relacion = (v.emergencia && v.emergencia.relacion) || '';

  return {
    id: v.id || null,
    ubicaId: v.ubicaId || '',
    numero: v.numero || '',
    tipo: ['propia', 'renta', 'vacante'].includes(v.tipo) ? v.tipo : 'propia',
    propietario: persona(v.propietario),
    inquilino: v.inquilino ? persona(v.inquilino) : null,
    integrantes: Array.isArray(v.integrantes) ? v.integrantes : [],
    integrantesInquilino: Array.isArray(v.integrantesInquilino) ? v.integrantesInquilino : [],
    emergencia,
    esColaboradorVecinal: !!v.esColaboradorVecinal,
    oficio: v.oficio || '',
    notaInterna: v.notaInterna || '',
    activo: v.activo !== false,
  };
}

/* ------------------------------------------------------------------ */
/* USUARIOS (cuentas)                                                  */
/* ------------------------------------------------------------------ */

export async function listUsuarios() {
  if (MODO === 'demo') {
    return leerDemo().usuarios.map(perfilPublico);
  }
  const { fs, fsMod } = await initFirebase();
  const snap = await fsMod.getDocs(fsMod.collection(fs, 'usuarios'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Crea una cuenta. datos: { correo, clave (temporal), nombre, rol, comunidadId }.
 * En modo firebase crea el usuario en Authentication con una app secundaria
 * (para no perder la sesión propia) y guarda el perfil en Firestore.
 */
export async function saveUsuario({ correo, clave, nombre, rol, comunidadId }) {
  correo = String(correo || '').trim();
  clave = String(clave || '');
  nombre = String(nombre || '').trim();
  if (!correo || !clave || !nombre) throw new Error('Completa correo, clave y nombre.');
  if (clave.length < 6) throw new Error('La clave temporal debe tener al menos 6 caracteres.');
  if (!['superadmin', 'admin', 'residente'].includes(rol)) throw new Error('Rol inválido.');

  if (MODO === 'demo') {
    const d = leerDemo();
    if (d.usuarios.some((u) => u.correo.toLowerCase() === correo.toLowerCase())) {
      throw new Error('Ese correo ya tiene una cuenta registrada.');
    }
    d.usuarios.push({ id: nuevoIdDemo(), correo, clave, nombre, rol, comunidadId: comunidadId || '', activo: true });
    escribirDemo(d);
    return;
  }

  const { appMod, authMod, fs, fsMod, auth } = await initFirebase();
  const authSec = authMod.getAuth(appMod.initializeApp(FIREBASE_CONFIG, 'quenda-secundaria'));
  try {
    const cred = await authMod.createUserWithEmailAndPassword(authSec, correo, clave);
    await fsMod.setDoc(fsMod.doc(fs, 'usuarios', cred.user.uid), {
      correo, nombre, rol, comunidadId: comunidadId || '', activo: true, creadoEn: Date.now(),
    });
    const uid = cred.user.uid;
    await authMod.signOut(authSec);
    return uid;
  } catch (err) {
    throw new Error(mensajeAuth(err));
  } finally {
    try { await appMod.deleteApp(appMod.getApp('quenda-secundaria')); } catch { /* ya borrada */ }
  }
}

export async function setUsuarioActivo(id, activo) {
  if (MODO === 'demo') {
    const d = leerDemo();
    const u = d.usuarios.find((x) => x.id === id);
    if (u) u.activo = !!activo;
    escribirDemo(d);
    return;
  }
  const { fs, fsMod } = await initFirebase();
  await fsMod.updateDoc(fsMod.doc(fs, 'usuarios', id), { activo: !!activo });
}

/**
 * Edita el perfil de una cuenta. El correo y la clave de acceso NO se pueden
 * cambiar desde la app (son la cuenta de Firebase Authentication); aquí solo
 * se actualiza el perfil de Firestore. El rol y la comunidad solo los cambia
 * el superadmin (las reglas de Firestore lo fuerzan igual para el admin).
 * datos: { nombre?, rol?, comunidadId? }
 */
export async function updateUsuario(id, datos) {
  const cambios = {};
  if (datos.nombre !== undefined) cambios.nombre = String(datos.nombre).trim();
  if (datos.rol !== undefined) {
    if (!['superadmin', 'admin', 'residente'].includes(datos.rol)) throw new Error('Rol inválido.');
    cambios.rol = datos.rol;
  }
  if (datos.comunidadId !== undefined) cambios.comunidadId = datos.comunidadId || '';
  if (!Object.keys(cambios).length) return;

  if (MODO === 'demo') {
    const d = leerDemo();
    const u = d.usuarios.find((x) => x.id === id);
    if (!u) throw new Error('Cuenta no encontrada.');
    Object.assign(u, cambios);
    escribirDemo(d);
    return;
  }
  const { fs, fsMod } = await initFirebase();
  await fsMod.updateDoc(fsMod.doc(fs, 'usuarios', id), cambios);
}

/**
 * Envía el correo de restablecimiento de clave (para quien NO puede entrar).
 * Firebase manda un enlace al correo; desde ahí la persona crea su clave nueva.
 */
export async function restablecerClave(correo) {
  correo = String(correo || '').trim();
  if (!correo) throw new Error('Escribe tu correo para enviarte el enlace.');
  if (MODO === 'demo') throw new Error('En modo demostración no hay correos reales.');
  const { auth, authMod } = await initFirebase();
  try {
    await authMod.sendPasswordResetEmail(auth, correo);
  } catch (err) {
    const codigo = err && err.code;
    if (codigo === 'auth/user-not-found') throw new Error('Ese correo no tiene cuenta en QUENDA. Revisa cómo lo escribiste.');
    if (codigo === 'auth/invalid-email') throw new Error('El correo no tiene un formato válido.');
    if (codigo === 'auth/too-many-requests') throw new Error('Demasiados intentos. Espera un momento y vuelve a intentarlo.');
    throw new Error(mensajeAuth(err) || 'No se pudo enviar el correo.');
  }
}

/**
 * Cambia la clave de la PROPIA cuenta (cualquier rol). Firebase exige
 * re-autenticar con la clave actual antes de aceptar la nueva.
 */
export async function cambiarMiClave(actual, nueva) {
  actual = String(actual || '');
  nueva = String(nueva || '');
  if (!actual || !nueva) throw new Error('Escribe la clave actual y la clave nueva.');
  if (nueva.length < 6) throw new Error('La clave nueva debe tener al menos 6 caracteres.');
  if (actual === nueva) throw new Error('La clave nueva debe ser distinta de la actual.');

  if (MODO === 'demo') {
    const d = leerDemo();
    const ses = localStorage.getItem(CLAVE_SESION);
    const u = d.usuarios.find((x) => x.id === ses);
    if (!u || u.clave !== actual) throw new Error('La clave actual no es correcta.');
    u.clave = nueva;
    escribirDemo(d);
    return;
  }

  const { auth, authMod } = await initFirebase();
  const usuario = auth.currentUser;
  if (!usuario) throw new Error('No hay sesión activa.');
  try {
    const credencial = authMod.EmailAuthProvider.credential(usuario.email, actual);
    await authMod.reauthenticateWithCredential(usuario, credencial);
  } catch (err) {
    throw new Error('La clave actual no es correcta.');
  }
  try {
    await authMod.updatePassword(usuario, nueva);
  } catch (err) {
    throw new Error(mensajeAuth(err) || 'No se pudo cambiar la clave.');
  }
}

/** Elimina el perfil de una cuenta (solo superadmin; reglas lo permiten). */
export async function deleteUsuarioDoc(id) {
  if (MODO === 'demo') {
    const d = leerDemo();
    d.usuarios = d.usuarios.filter((x) => x.id !== id);
    escribirDemo(d);
    return;
  }
  const { fs, fsMod } = await initFirebase();
  await fsMod.deleteDoc(fsMod.doc(fs, 'usuarios', id));
}

/* ------------------------------------------------------------------ */
/* EXPORTACIÓN (respaldos)                                             */
/* ------------------------------------------------------------------ */

/**
 * Reúne todos los datos de una comunidad para respaldo o exportación:
 * comunidad + estructura + viviendas (normalizadas) + cuentas de esa comunidad.
 * Las claves no se incluyen (Firebase Auth no las expone, y no deben viajar).
 */
export async function exportarComunidad(comunidadId) {
  const [comunidad, estructura, viviendas, todosUsuarios] = await Promise.all([
    getComunidad(comunidadId),
    listEstructura(comunidadId),
    listViviendas(comunidadId),
    listUsuarios(),
  ]);
  return {
    app: 'QUENDA',
    tipo: 'respaldo-comunidad',
    version: 1,
    exportado: new Date().toISOString(),
    comunidad,
    estructura,
    viviendas: viviendas.map((v) => viviendaNormalizada(v)),
    usuarios: todosUsuarios.filter((u) => u.comunidadId === comunidadId),
  };
}

/** Respaldo total: todas las comunidades en un solo archivo (superadministrador). */
export async function exportarTodo() {
  const comunidades = await listComunidades();
  const bloques = [];
  for (const c of comunidades) {
    bloques.push(await exportarComunidad(c.id));
  }
  return {
    app: 'QUENDA',
    tipo: 'respaldo-total',
    version: 1,
    exportado: new Date().toISOString(),
    comunidades: bloques,
  };
}
