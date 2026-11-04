// ============================================================================
// QUENDA — Panel de comunidades (solo superadministrador)
// Crear/editar comunidades y entrar a administrar una de ellas.
// ============================================================================

import { listComunidades, saveComunidad, listViviendas, listUsuarios, listEstructura, exportarTodo } from '../db.js';
import { elegirComunidad } from '../estado.js';
import { esc, toast, abrirModal } from '../ui.js';
import { descargarArchivo, fechaCorta } from '../exportar.js';

export async function render(cont, ctx) {
  const [comunidades, usuarios] = await Promise.all([listComunidades(), listUsuarios()]);

  const stats = {};
  await Promise.all(comunidades.map(async (c) => {
    const [viviendas, estructura] = await Promise.all([listViviendas(c.id), listEstructura(c.id)]);
    stats[c.id] = {
      viviendas: viviendas.filter((v) => v.activo !== false).length,
      cuentas: usuarios.filter((u) => u.comunidadId === c.id && u.activo !== false).length,
      unidades: estructura.length,
    };
  }));

  const tipoTexto = (t) => (t === 'torres' ? 'Torres / Edificios' : 'Calles con casas');

  cont.innerHTML = `
    <div class="cabecera-pagina">
      <div>
        <h1 class="titulo-pagina">Comunidades</h1>
        <p class="subtitulo">Todas las urbanizaciones registradas en QUENDA.</p>
      </div>
      <div class="cabecera-acciones">
        <button class="boton" id="btn-respaldo-total" title="Descarga TODAS las comunidades en un solo archivo JSON">🗄️ Respaldo total</button>
        <button class="boton boton-primario" id="btn-nueva-com">+ Nueva comunidad</button>
      </div>
    </div>
    <div class="lista-tarjetas" id="tarjetas-comunidades"></div>`;

  const tarjetas = cont.querySelector('#tarjetas-comunidades');
  if (!comunidades.length) {
    tarjetas.innerHTML = '<div class="vacio">Aún no hay comunidades. Crea la primera con el botón «Nueva comunidad».</div>';
  }

  comunidades.forEach((c) => {
    const s = stats[c.id] || { viviendas: 0, cuentas: 0, unidades: 0 };
    const articulo = document.createElement('article');
    articulo.className = 'tarjeta-comunidad';
    articulo.innerHTML = `
      <header class="tc-cab">
        <div>
          <h2 class="tc-nombre">${esc(c.nombre)}</h2>
          <span class="tc-tipo">${tipoTexto(c.tipoEstructura)}</span>
        </div>
        <span class="badge ${c.activa ? 'badge-ok' : 'badge-gris'}">${c.activa ? 'Activa' : 'Inactiva'}</span>
      </header>
      <div class="tc-stats">
        <span class="stat"><strong>${s.unidades}</strong>${c.tipoEstructura === 'torres' ? ' torres' : ' calles'}</span>
        <span class="stat"><strong>${s.viviendas}</strong> viviendas</span>
        <span class="stat"><strong>${s.cuentas}</strong> cuentas</span>
      </div>
      <div class="tc-acciones">
        <button class="boton boton-primario" data-accion="administrar">Administrar</button>
        <button class="boton" data-accion="editar">Editar</button>
      </div>`;

    articulo.querySelector('[data-accion="administrar"]').addEventListener('click', () => administrar(c));
    articulo.querySelector('[data-accion="editar"]').addEventListener('click', () => formulario(c, cont, ctx));
    tarjetas.appendChild(articulo);
  });

  cont.querySelector('#btn-nueva-com').addEventListener('click', () => formulario(null, cont, ctx));

  cont.querySelector('#btn-respaldo-total').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      const respaldo = await exportarTodo();
      descargarArchivo(
        `respaldo-total-quenda-${fechaCorta()}.json`,
        JSON.stringify(respaldo, null, 2),
        'application/json;charset=utf-8',
      );
      toast(`Respaldo total descargado (${respaldo.comunidades.length} comunidades)`, 'ok');
    } catch (err) {
      toast('No se pudo generar el respaldo: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}

/** Pone la comunidad como activa y navega al directorio (o a estructura si está vacía). */
async function administrar(comunidad) {
  const estructura = await listEstructura(comunidad.id);
  await elegirComunidad(comunidad);
  if (!estructura.length) {
    toast('Configura primero las calles o torres.', 'info');
    location.hash = '#/estructura';
  } else {
    location.hash = '#/directorio';
  }
}

function formulario(comunidad = null, cont, ctx) {
  const c = comunidad || {};
  const contenido = document.createElement('div');
  contenido.className = 'form-grid';
  contenido.innerHTML = `
    <div class="campo campo-ancho">
      <label>Nombre de la comunidad</label>
      <input id="f-com-nombre" value="${esc(c.nombre || '')}" placeholder="Ej: Residencial Los Álamos" required>
    </div>
    <div class="campo">
      <label>Organización</label>
      <select id="f-com-tipo">
        <option value="calles" ${c.tipoEstructura !== 'torres' ? 'selected' : ''}>Calles con casas</option>
        <option value="torres" ${c.tipoEstructura === 'torres' ? 'selected' : ''}>Torres / Edificios</option>
      </select>
    </div>
    <div class="campo">
      <label>Color principal</label>
      <input type="color" id="f-com-primario" value="${esc(c.colorPrimario || '#b34a2b')}">
    </div>
    <div class="campo">
      <label>Color de acento</label>
      <input type="color" id="f-com-acento" value="${esc(c.colorAcento || '#e08a2e')}">
    </div>
    <div class="campo campo-ancho">
      <label>Logo del residencial (URL de imagen, opcional)</label>
      <input id="f-com-logo" value="${esc(c.logoUrl || '')}" placeholder="https://mi-sitio.cl/logo.png">
      <small class="texto-suave">Sube la imagen a tu hosting (o usa cualquier enlace https) y pega aquí la dirección. Se ve en el menú y en el directorio.</small>
    </div>
    <div class="campo campo-ancho">
      <label class="label-check">
        <input type="checkbox" id="f-com-activa" ${c.activa !== false ? 'checked' : ''}>
        Comunidad activa (los administradores pueden entrar)
      </label>
    </div>`;

  const { pie, cerrar } = abrirModal({ titulo: comunidad ? 'Editar comunidad' : 'Nueva comunidad', contenido });

  const btnCancelar = document.createElement('button');
  btnCancelar.className = 'boton';
  btnCancelar.type = 'button';
  btnCancelar.textContent = 'Cancelar';
  btnCancelar.addEventListener('click', cerrar);

  const btnGuardar = document.createElement('button');
  btnGuardar.className = 'boton boton-primario';
  btnGuardar.type = 'button';
  btnGuardar.textContent = 'Guardar';
  btnGuardar.addEventListener('click', async () => {
    const nombre = contenido.querySelector('#f-com-nombre').value.trim();
    if (!nombre) { toast('Ingresa el nombre de la comunidad.', 'error'); return; }
    const datos = {
      nombre,
      tipoEstructura: contenido.querySelector('#f-com-tipo').value,
      colorPrimario: contenido.querySelector('#f-com-primario').value,
      colorAcento: contenido.querySelector('#f-com-acento').value,
      logoUrl: contenido.querySelector('#f-com-logo').value.trim(),
      activa: contenido.querySelector('#f-com-activa').checked,
    };
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando…';
    try {
      await saveComunidad(datos, c.id || null);
      cerrar();
      toast('Comunidad guardada.');
      render(cont, ctx);
    } catch (err) {
      toast(err.message || 'No se pudo guardar.', 'error');
      btnGuardar.disabled = false;
      btnGuardar.textContent = 'Guardar';
    }
  });

  pie.append(btnCancelar, btnGuardar);
}
