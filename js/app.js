// ============================================================================
// QUENDA — Orquestador de la aplicación
// Controla: sesión (entrar/salir), menú según rol, enrutado (#/sección),
// tema de la comunidad activa y permisos de cada vista.
// ============================================================================

import { MODO, onAuthChange, getComunidad, logout, cambiarMiClave } from './db.js';
import { estado, suscribir, idComunidadRecordada } from './estado.js';
import { montarLogin } from './auth.js';
import { toast, esc, abrirModal } from './ui.js';
import * as pagComunidades from './paginas/comunidades.js';
import * as pagDirectorio from './paginas/directorio.js';
import * as pagViviendas from './paginas/viviendas.js';
import * as pagEstructura from './paginas/estructura.js';
import * as pagUsuarios from './paginas/usuarios.js';

/* ------------------------------ Rutas ------------------------------ */

const RUTAS = {
  comunidades: { roles: ['superadmin'], render: pagComunidades.render },
  directorio:  { roles: ['superadmin', 'admin', 'residente'], requiereComunidad: true, render: pagDirectorio.render },
  viviendas:   { roles: ['admin', 'superadmin'], requiereComunidad: true, render: pagViviendas.render },
  estructura:  { roles: ['admin', 'superadmin'], requiereComunidad: true, render: pagEstructura.render },
  usuarios:    { roles: ['admin', 'superadmin'], requiereComunidad: true, render: pagUsuarios.render },
};

function rol() {
  return (estado.usuario && estado.usuario.rol) || '';
}

function rutaPorDefecto() {
  if (rol() === 'superadmin' && !estado.comunidad) return '#/comunidades';
  return '#/directorio';
}

function nombreDeRuta(hash) {
  return String(hash || '').replace(/^#\/?/, '').split('?')[0];
}

/* ------------------------------ Tema ------------------------------ */

function aplicarTema(comunidad) {
  const r = document.documentElement.style;
  r.setProperty('--primario', (comunidad && comunidad.colorPrimario) || '#b34a2b');
  r.setProperty('--acento', (comunidad && comunidad.colorAcento) || '#e08a2e');
}

/* ------------------------------ Menú ------------------------------ */

function construirMenu() {
  const nav = document.getElementById('menu-links');
  const items = [];

  if (rol() === 'superadmin') {
    items.push(['comunidades', '🏘️ Comunidades']);
    if (estado.comunidad) {
      items.push(
        ['directorio', '📖 Directorio'],
        ['viviendas', '🏠 Viviendas'],
        ['estructura', '🛣️ Estructura'],
        ['usuarios', '👥 Usuarios'],
      );
    }
  } else if (rol() === 'admin') {
    items.push(
      ['directorio', '📖 Directorio'],
      ['viviendas', '🏠 Viviendas'],
      ['estructura', '🛣️ Estructura'],
      ['usuarios', '👥 Usuarios'],
    );
  } else {
    items.push(['directorio', '📖 Directorio']);
  }

  nav.innerHTML = '';
  items.forEach(([ruta, texto]) => {
    const a = document.createElement('a');
    a.href = `#/${ruta}`;
    a.dataset.ruta = ruta;
    a.className = 'link-menu';
    a.textContent = texto;
    nav.appendChild(a);
  });

  const chip = document.getElementById('menu-comunidad');
  if (estado.comunidad && estado.comunidad.logoUrl) {
    chip.innerHTML = `<img class="logo-comunidad" src="${esc(estado.comunidad.logoUrl)}" alt="">
      <span>${esc(estado.comunidad.nombre)}</span>`;
  } else {
    chip.textContent = estado.comunidad ? estado.comunidad.nombre : 'Sin comunidad seleccionada';
  }

  const info = document.getElementById('usuario-info');
  const u = estado.usuario;
  info.innerHTML = `
    <strong>${esc(u.nombre || u.correo || '')}</strong>
    <span class="rol-usuario">${rol() === 'superadmin' ? 'Superadmin' : rol() === 'admin' ? 'Administración' : 'Residente'}</span>
    <span class="correo-usuario">${esc(u.correo || '')}</span>`;
}

function marcarNav(nombre) {
  document.querySelectorAll('#menu-links .link-menu').forEach((a) => {
    a.classList.toggle('activo', a.dataset.ruta === nombre);
  });
}

/* ------------------------------ Sesión ------------------------------ */

async function renderApp() {
  const pantallaLogin = document.getElementById('pantalla-login');
  const shell = document.getElementById('app-shell');
  document.getElementById('banner-demo').classList.toggle('oculto', MODO !== 'demo');

  if (!estado.usuario) {
    shell.classList.add('oculto');
    pantallaLogin.classList.remove('oculto');
    return;
  }
  pantallaLogin.classList.add('oculto');
  shell.classList.remove('oculto');
  construirMenu();
  await renderRuta();
}

/* ----------------------------- Enrutado ----------------------------- */

// Evita la condición de carrera entre renders: si llega una nueva solicitud
// mientras otra está en curso, la última manda y se ejecuta al terminar.
let renderEnCurso = null;
let renderPendiente = false;

async function renderRuta() {
  if (renderEnCurso) { renderPendiente = true; return; }
  renderPendiente = false;

  renderEnCurso = (async () => {
    if (!estado.usuario) return;
    const contenido = document.getElementById('contenido');

    let nombre = nombreDeRuta(location.hash);
    if (!RUTAS[nombre]) {
      nombre = nombreDeRuta(rutaPorDefecto()) || 'directorio';
      if (location.hash !== `#/${nombre}`) location.hash = `#/${nombre}`;
    }
    const ruta = RUTAS[nombre];

    if (!ruta.roles.includes(rol())) {
      toast('No tienes permiso para entrar a esta sección.', 'error');
      const def = nombreDeRuta(rutaPorDefecto());
      if (nombre !== def) {
        location.hash = `#/${def}`;
        return;
      }
    }

    if (ruta.requiereComunidad) {
      if (!estado.comunidad) {
        contenido.innerHTML = rol() === 'superadmin'
          ? `<div class="aviso-centro">
               <h2>Elige una comunidad</h2>
               <p>Entra a <strong>Comunidades</strong> y pulsa «Administrar» en una de ellas.</p>
               <a class="boton boton-primario" href="#/comunidades">Ir a Comunidades</a>
             </div>`
          : `<div class="aviso-centro">
               <h2>Sin comunidad asignada</h2>
               <p>Tu cuenta no tiene una comunidad configurada. Contacta al superadministrador.</p>
             </div>`;
        marcarNav(nombre);
        return;
      }
      if (!estado.comunidad.activa && rol() !== 'superadmin') {
        contenido.innerHTML = `<div class="aviso-centro">
          <h2>Comunidad desactivada</h2>
          <p>La administración desactivó esta comunidad temporalmente. Contacta al superadministrador.</p>
        </div>`;
        marcarNav(nombre);
        return;
      }
    }

    marcarNav(nombre);
    contenido.innerHTML = '<div class="cargando">Cargando…</div>';
    try {
      await ruta.render(contenido, { usuario: estado.usuario, comunidad: estado.comunidad });
    } catch (err) {
      console.error('Error al renderizar la vista:', err);
      contenido.innerHTML = `<div class="aviso-centro">
        <h2>Algo salió mal</h2>
        <p>${esc(err.message || 'Error inesperado.')}</p>
      </div>`;
    }
  })();

  try {
    await renderEnCurso;
  } finally {
    renderEnCurso = null;
    if (renderPendiente) renderRuta();
  }
}

/* ------------------------------ Inicio ------------------------------ */

async function iniciar() {
  montarLogin();

  suscribir(() => { renderApp(); });

  await onAuthChange(async (usuario) => {
    estado.usuario = usuario;
    if (usuario) {
      const id = usuario.rol === 'superadmin' ? idComunidadRecordada() : (usuario.comunidadId || '');
      let comunidad = null;
      if (id) comunidad = await getComunidad(id);
      if (id && !comunidad) localStorage.removeItem('quenda_com_activa');
      estado.comunidad = comunidad;
    } else {
      estado.comunidad = null;
    }
    aplicarTema(estado.comunidad);
    await renderApp();
  });

  window.addEventListener('hashchange', () => renderRuta());

  document.getElementById('btn-salir').addEventListener('click', async () => {
    try {
      await logout();
    } catch (err) {
      toast('No se pudo cerrar la sesión.', 'error');
    }
  });

  document.getElementById('btn-mi-clave').addEventListener('click', () => abrirCambiarClave());
}

/* ---------------- Reestablecer mi clave de acceso ---------------- */

function abrirCambiarClave() {
  const contenido = document.createElement('div');
  contenido.className = 'form-grid';
  contenido.innerHTML = `
    <div class="campo campo-ancho">
      <label>Clave actual</label>
      <input id="fmc-actual" type="password" autocomplete="current-password" placeholder="••••••••">
    </div>
    <div class="campo">
      <label>Clave nueva (mínimo 6)</label>
      <input id="fmc-nueva" type="password" autocomplete="new-password" placeholder="••••••••">
    </div>
    <div class="campo">
      <label>Repite la clave nueva</label>
      <input id="fmc-repite" type="password" autocomplete="new-password" placeholder="••••••••">
    </div>
    <p class="texto-suave campo-ancho">Al cambiarla, el navegador te ofrecerá actualizar la contraseña guardada — acéptalo para que el autocompletado siga funcionando.</p>`;

  const { pie, cerrar } = abrirModal({ titulo: 'Reestablecer mi clave de acceso', contenido, ancho: 440 });

  const btnCancelar = document.createElement('button');
  btnCancelar.type = 'button';
  btnCancelar.className = 'boton';
  btnCancelar.textContent = 'Cancelar';
  btnCancelar.addEventListener('click', cerrar);

  const btnGuardar = document.createElement('button');
  btnGuardar.type = 'button';
  btnGuardar.className = 'boton boton-primario';
  btnGuardar.textContent = 'Guardar clave nueva';
  btnGuardar.addEventListener('click', async () => {
    const actual = contenido.querySelector('#fmc-actual').value;
    const nueva = contenido.querySelector('#fmc-nueva').value;
    const repite = contenido.querySelector('#fmc-repite').value;
    if (!actual || !nueva || !repite) {
      toast('Completa los tres campos.', 'error');
      return;
    }
    if (nueva !== repite) {
      toast('La clave nueva y su repetición no coinciden.', 'error');
      contenido.querySelector('#fmc-repite').focus();
      return;
    }
    btnGuardar.disabled = true;
    try {
      await cambiarMiClave(actual, nueva);
      cerrar();
      toast('Clave actualizada. Úsala la próxima vez que entres.');
    } catch (err) {
      toast(err.message || 'No se pudo cambiar la clave.', 'error');
    } finally {
      btnGuardar.disabled = false;
    }
  });

  pie.append(btnCancelar, btnGuardar);
  contenido.querySelector('#fmc-actual').focus();
}

iniciar();
