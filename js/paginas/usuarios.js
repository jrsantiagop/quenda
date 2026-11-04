// ============================================================================
// QUENDA — Usuarios y cuentas (administración)
// El administrador crea cuentas para su comunidad (residentes);
// el superadministrador también puede crear administradores.
// Ambos pueden EDITAR las cuentas con el lápiz ✏️ (el admin solo de su
// comunidad y únicamente el nombre; rol y comunidad solo los cambia el
// superadmin — lo fuerza también las reglas de Firestore).
// ============================================================================

import { listUsuarios, saveUsuario, updateUsuario, setUsuarioActivo, deleteUsuarioDoc, listComunidades } from '../db.js';
import { esc, toast, abrirModal, confirmar } from '../ui.js';

export async function render(cont, ctx) {
  const esSuper = ctx.usuario.rol === 'superadmin';
  const comunidadId = ctx.comunidad ? ctx.comunidad.id : '';

  const [usuarios, comunidades] = await Promise.all([
    listUsuarios(),
    esSuper ? listComunidades() : Promise.resolve([ctx.comunidad]),
  ]);
  const nombreComunidad = (id) => (comunidades.find((c) => c.id === id) || {}).nombre || '—';

  // Admin ve solo su comunidad; el superadmin ve todas.
  const visibles = esSuper ? usuarios : usuarios.filter((u) => u.comunidadId === comunidadId);

  cont.innerHTML = `
    <div class="cabecera-pagina">
      <div>
        <h1 class="titulo-pagina">Usuarios · ${esc(ctx.comunidad ? ctx.comunidad.nombre : 'Todas')}</h1>
        <p class="subtitulo">${visibles.length} cuentas. ${esSuper ? 'Puedes crear administradores y residentes.' : 'Crea cuentas de administración o residentes para tu comunidad.'}</p>
      </div>
      <button class="boton boton-primario" id="btn-nueva-cuenta">+ Nueva cuenta</button>
    </div>
    <div class="lista-filas" id="lista-usuarios"></div>`;

  const lista = cont.querySelector('#lista-usuarios');
  if (!visibles.length) {
    lista.innerHTML = '<div class="vacio">No hay cuentas todavía. Crea la primera con «Nueva cuenta».</div>';
  }

  const etiquetaRol = { superadmin: 'Superadmin', admin: 'Administración', residente: 'Residente' };

  visibles.forEach((u) => {
    const activo = u.activo !== false;
    const fila = document.createElement('div');
    fila.className = 'fila';
    fila.innerHTML = `
      <div class="fila-principal">
        <strong>${esc(u.nombre || '—')}</strong>
        <span class="badge ${u.rol === 'admin' ? 'badge-aviso' : u.rol === 'residente' ? 'badge-ok' : 'badge-gris'}">${etiquetaRol[u.rol] || u.rol}</span>
        <span class="fila-secundaria">${esc(u.correo || '')}</span>
        ${esSuper ? `<span class="fila-secundaria">🏘️ ${esc(nombreComunidad(u.comunidadId))}</span>` : ''}
      </div>
      <div class="fila-acciones">
        <span class="badge ${activo ? 'badge-ok' : 'badge-gris'}">${activo ? 'Activa' : 'Desactivada'}</span>
        <button class="boton boton-mini" data-accion="editar" title="Editar cuenta">✏️</button>
        <button class="boton boton-mini" data-accion="alternar">${activo ? 'Desactivar' : 'Activar'}</button>
        ${esSuper ? '<button class="boton boton-mini boton-peligro" data-accion="eliminar" title="Eliminar cuenta">🗑️</button>' : ''}
      </div>`;
    fila.querySelector('[data-accion="editar"]').addEventListener('click', () =>
      formulario({ datos: u, esSuper, comunidadId, comunidades, cont, ctx }));
    fila.querySelector('[data-accion="alternar"]').addEventListener('click', async () => {
      try {
        await setUsuarioActivo(u.id, !activo);
        toast(activo ? 'Cuenta desactivada.' : 'Cuenta activada.');
        render(cont, ctx);
      } catch (err) {
        toast(err.message || 'No se pudo cambiar el estado.', 'error');
      }
    });
    const btnEliminar = fila.querySelector('[data-accion="eliminar"]');
    if (btnEliminar) {
      // Solo superadmin: quita el perfil de Firestore. Nota: la cuenta de
      // acceso (Authentication) debe gestionarse aparte desde la consola.
      btnEliminar.addEventListener('click', async () => {
        const ok = await confirmar(
          `¿Eliminar la cuenta de ${u.nombre || u.correo}? No podrá volver a ingresar con ese correo.`,
          { titulo: 'Eliminar cuenta', textoSi: 'Eliminar', textoNo: 'Cancelar' },
        );
        if (!ok) return;
        try {
          await deleteUsuarioDoc(u.id);
          toast('Cuenta eliminada.');
          render(cont, ctx);
        } catch (err) {
          toast(err.message || 'No se pudo eliminar.', 'error');
        }
      });
    }
    lista.appendChild(fila);
  });

  cont.querySelector('#btn-nueva-cuenta').addEventListener('click', () =>
    formulario({ datos: null, esSuper, comunidadId, comunidades, cont, ctx }));
}

function formulario({ datos, esSuper, comunidadId, comunidades, cont, ctx }) {
  const u = datos || {};
  const esEdicion = !!datos;
  // El perfil en sesión trae `uid` (no `id`); el doc de Firestore usa el uid como id.
  const esMiCuenta = esEdicion && u.id === (ctx.usuario.uid || ctx.usuario.id);
  const etiquetaRol = { superadmin: 'Superadmin', admin: 'Administración', residente: 'Residente' };

  const contenido = document.createElement('div');
  contenido.className = 'form-grid';

  // El superadmin puede crear admins y residentes de cualquier comunidad;
  // un administrador puede crear admins y residentes SOLO de la suya.
  const rolesPermitidos = esSuper
    ? [{ v: 'residente', t: 'Residente (solo consulta)' }, { v: 'admin', t: 'Administración (gestiona una comunidad)' }]
    : [{ v: 'residente', t: 'Residente (solo consulta)' }, { v: 'admin', t: 'Administración (gestiona esta comunidad)' }];

  // En edición, si la cuenta tiene un rol fuera de la lista (superadmin
  // editado por otro superadmin), se incluye tal cual para no perderlo.
  const rolesLista = esEdicion && u.rol && !rolesPermitidos.some((r) => r.v === u.rol)
    ? [{ v: u.rol, t: etiquetaRol[u.rol] || u.rol }, ...rolesPermitidos]
    : rolesPermitidos;

  contenido.innerHTML = `
    <div class="campo campo-ancho">
      <label>Nombre completo</label>
      <input id="fu-nombre" placeholder="Ej: Pedro Ramírez" value="${esc(u.nombre || '')}">
    </div>
    <div class="campo campo-ancho">
      <label>Correo electrónico (será su usuario)</label>
      <input id="fu-correo" type="email" placeholder="vecino@correo.com" value="${esc(u.correo || '')}" ${esEdicion ? 'disabled' : ''}>
      ${esEdicion ? '<small class="texto-suave">El correo es la cuenta de acceso: no se puede cambiar aquí.</small>' : ''}
    </div>
    ${esEdicion ? `
    <div class="campo campo-ancho">
      <label>Clave de acceso</label>
      <input value="••••••••" disabled>
      <small class="texto-suave">Si se le olvidó a la persona, se restablece desde Firebase Console → Authentication.</small>
    </div>` : `
    <div class="campo campo-ancho">
      <label>Clave temporal (mínimo 6 caracteres)</label>
      <input id="fu-clave" type="text" placeholder="Ej: quenda2026" autocomplete="off">
      <small class="texto-suave">Entrégasela al usuario para su primer ingreso; podrá cambiarla desde «🔑 Reestablecer mi clave de acceso».</small>
    </div>`}
    <div class="campo">
      <label>Rol</label>
      <select id="fu-rol" ${esEdicion && (!esSuper || esMiCuenta) ? 'disabled' : ''}>
        ${rolesLista.map((r) => `<option value="${r.v}" ${u.rol === r.v ? 'selected' : ''}>${r.t}</option>`).join('')}
      </select>
      ${esEdicion && !esSuper ? '<small class="texto-suave">Solo el superadministrador puede cambiar el rol.</small>' : ''}
      ${esEdicion && esMiCuenta ? '<small class="texto-suave">No puedes cambiar tu propio rol.</small>' : ''}
    </div>
    <div class="campo">
      <label>Comunidad</label>
      ${esSuper
        ? `${esEdicion && esMiCuenta
          ? `<input value="${esc(u.comunidadId ? ((comunidades.find((c) => c.id === u.comunidadId) || {}).nombre || u.comunidadId) : 'Todas las comunidades')}" disabled><small class="texto-suave">No puedes cambiar tu propia comunidad.</small>`
          : `<select id="fu-comunidad">
              ${comunidades.map((c) => `<option value="${esc(c.id)}" ${u.comunidadId === c.id ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('')}
            </select>`
      }`
        : `<input value="${esc(ctx.comunidad.nombre)}" disabled><input type="hidden" id="fu-comunidad" value="${esc(comunidadId)}">`}
    </div>`;

  const { pie, cerrar } = abrirModal({ titulo: esEdicion ? `Editar cuenta` : 'Nueva cuenta', contenido, ancho: 480 });

  const btnCancelar = document.createElement('button');
  btnCancelar.type = 'button';
  btnCancelar.className = 'boton';
  btnCancelar.textContent = 'Cancelar';
  btnCancelar.addEventListener('click', cerrar);

  const btnGuardar = document.createElement('button');
  btnGuardar.type = 'button';
  btnGuardar.className = 'boton boton-primario';
  btnGuardar.textContent = esEdicion ? 'Guardar cambios' : 'Crear cuenta';
  btnGuardar.addEventListener('click', async () => {
    const valor = (id) => contenido.querySelector(id).value.trim();
    try {
      if (esEdicion) {
        const cambios = { nombre: valor('#fu-nombre') };
        // El rol y la comunidad solo los cambia el superadmin (y nunca su
        // propia cuenta); las reglas de Firestore lo bloquean igual.
        if (esSuper && !esMiCuenta) {
          cambios.rol = contenido.querySelector('#fu-rol').value;
          cambios.comunidadId = contenido.querySelector('#fu-comunidad').value;
        }
        await updateUsuario(u.id, cambios);
        cerrar();
        toast('Cambios guardados.');
        render(cont, ctx);
      } else {
        await saveUsuario({
          nombre: valor('#fu-nombre'),
          correo: valor('#fu-correo'),
          clave: contenido.querySelector('#fu-clave').value,
          rol: contenido.querySelector('#fu-rol').value,
          comunidadId: contenido.querySelector('#fu-comunidad').value,
        });
        cerrar();
        toast('Cuenta creada. Entrégale el correo y la clave temporal al usuario.');
        render(cont, ctx);
      }
    } catch (err) {
      toast(err.message || 'No se pudo guardar la cuenta.', 'error');
    }
  });

  pie.append(btnCancelar, btnGuardar);
}
