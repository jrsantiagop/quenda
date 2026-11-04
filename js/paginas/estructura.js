// ============================================================================
// QUENDA — Estructura de la comunidad (solo administración)
// Gestiona las calles o torres según el tipo configurado de la comunidad.
// ============================================================================

import { listEstructura, saveEstructuraItem, deleteEstructuraItem, listViviendas } from '../db.js';
import { esc, toast, abrirModal, confirmar } from '../ui.js';

export async function render(cont, ctx) {
  const com = ctx.comunidad;
  const esTorre = com.tipoEstructura === 'torres';
  const palabra = esTorre ? 'torre' : 'calle';
  const palabraPlural = esTorre ? 'torres' : 'calles';

  const [estructura, viviendasRaw] = await Promise.all([
    listEstructura(com.id),
    listViviendas(com.id),
  ]);

  const conteo = {};
  viviendasRaw.forEach((v) => {
    if (v.ubicaId && v.activo !== false) conteo[v.ubicaId] = (conteo[v.ubicaId] || 0) + 1;
  });

  cont.innerHTML = `
    <div class="cabecera-pagina">
      <div>
        <h1 class="titulo-pagina">Estructura · ${esc(com.nombre)}</h1>
        <p class="subtitulo">${estructura.length} ${palabraPlural} configuradas. Son los sectores que ordenan el directorio.</p>
      </div>
      <button class="boton boton-primario" id="btn-agregar-unidad">+ Agregar ${palabra}</button>
    </div>
    <div class="lista-filas" id="lista-estructura"></div>`;

  const lista = cont.querySelector('#lista-estructura');
  if (!estructura.length) {
    lista.innerHTML = `<div class="vacio">Aún no hay ${palabraPlural}. Agrega la primera para poder registrar viviendas.</div>`;
  }

  estructura.forEach((e) => {
    const n = conteo[e.id] || 0;
    const fila = document.createElement('div');
    fila.className = 'fila';
    fila.innerHTML = `
      <div class="fila-principal">
        <strong>${esc(e.nombre)}</strong>${esTorre && e.pisos ? `<span class="fila-secundaria">${esc(e.pisos)} pisos</span>` : ''}
        <span class="fila-secundaria">${n} ${n === 1 ? 'vivienda' : 'viviendas'}</span>
      </div>
      <div class="fila-acciones">
        <button class="boton boton-mini" data-accion="editar" title="Editar">✏️</button>
        <button class="boton boton-mini boton-peligro" data-accion="eliminar" title="Eliminar">🗑️</button>
      </div>`;
    fila.querySelector('[data-accion="editar"]').addEventListener('click', () => formulario(e, { com, esTorre, cont, ctx }));
    fila.querySelector('[data-accion="eliminar"]').addEventListener('click', async () => {
      if (n > 0) {
        toast(`No se puede eliminar: hay ${n} viviendas en «${e.nombre}». Mueve o elimina esas viviendas primero.`, 'error');
        return;
      }
      const ok = await confirmar(`¿Eliminar «${e.nombre}»?`, {
        titulo: `Eliminar ${palabra}`, textoSi: 'Eliminar', textoNo: 'Cancelar',
      });
      if (!ok) return;
      try {
        await deleteEstructuraItem(com.id, e.id);
        toast('Eliminada.');
        render(cont, ctx);
      } catch (err) {
        toast(err.message || 'No se pudo eliminar.', 'error');
      }
    });
    lista.appendChild(fila);
  });

  cont.querySelector('#btn-agregar-unidad').addEventListener('click', () => formulario(null, { com, esTorre, cont, ctx }));
}

function formulario(unidad, { com, esTorre, cont, ctx }) {
  const contenido = document.createElement('div');
  contenido.className = 'form-grid';
  contenido.innerHTML = `
    <div class="campo campo-ancho">
      <label>Nombre de la ${esTorre ? 'torre' : 'calle'}</label>
      <input id="fe-nombre" value="${esc(unidad ? unidad.nombre : '')}"
        placeholder="${esTorre ? 'Ej: Torre A' : 'Ej: Calle Los Fresnos'}">
    </div>
    ${esTorre ? `
    <div class="campo campo-ancho">
      <label>Cantidad de pisos (opcional)</label>
      <input id="fe-pisos" type="number" min="1" value="${esc(unidad && unidad.pisos ? unidad.pisos : '')}" placeholder="Ej: 6">
    </div>` : ''}`;

  const { pie, cerrar } = abrirModal({
    titulo: unidad ? `Editar ${esTorre ? 'torre' : 'calle'}` : `Nueva ${esTorre ? 'torre' : 'calle'}`,
    contenido,
    ancho: 420,
  });

  const btnCancelar = document.createElement('button');
  btnCancelar.type = 'button';
  btnCancelar.className = 'boton';
  btnCancelar.textContent = 'Cancelar';
  btnCancelar.addEventListener('click', cerrar);

  const btnGuardar = document.createElement('button');
  btnGuardar.type = 'button';
  btnGuardar.className = 'boton boton-primario';
  btnGuardar.textContent = 'Guardar';
  btnGuardar.addEventListener('click', async () => {
    const nombre = contenido.querySelector('#fe-nombre').value.trim();
    if (!nombre) { toast('Ingresa el nombre.', 'error'); return; }
    const pisosInput = contenido.querySelector('#fe-pisos');
    const datos = { nombre };
    if (esTorre && pisosInput) datos.pisos = Number(pisosInput.value) || 0;
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando…';
    try {
      await saveEstructuraItem(com.id, datos, unidad ? unidad.id : null);
      cerrar();
      toast('Guardado.');
      render(cont, ctx);
    } catch (err) {
      toast(err.message || 'No se pudo guardar.', 'error');
      btnGuardar.disabled = false;
      btnGuardar.textContent = 'Guardar';
    }
  });

  pie.append(btnCancelar, btnGuardar);
}
