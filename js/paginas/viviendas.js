// ============================================================================
// QUENDA — Administración de viviendas (solo administración)
// Crear/editar/eliminar fichas de viviendas con propietario, inquilino
// (casas en renta), integrantes del hogar y contacto de emergencia.
// ============================================================================

import { listEstructura, listViviendas, saveVivienda, deleteVivienda, viviendaNormalizada, exportarComunidad } from '../db.js';
import { esc, toast, abrirModal, confirmar, iconoWhatsapp } from '../ui.js';
import { descargarArchivo, slug, fechaCorta, descargarExcel, descargarPlantilla, leerArchivoImport, analizarImportacion } from '../exportar.js';
import { partirTelefono, htmlOpcionesPais, digitosEsperados, paisDe } from '../paises.js';

export async function render(cont, ctx) {
  const com = ctx.comunidad;
  const esTorre = com.tipoEstructura === 'torres';

  const [estructura, viviendasRaw] = await Promise.all([
    listEstructura(com.id),
    listViviendas(com.id),
  ]);
  const viviendas = viviendasRaw.map(viviendaNormalizada).filter((v) => v.activo);

  const nombreDe = (id) => (estructura.find((e) => e.id === id) || {}).nombre || '—';
  const dirCorta = (v) => (esTorre ? `Apto ${v.numero || '—'}` : `Casa ${v.numero || '—'}`);
  const dirLarga = (v) => `${nombreDe(v.ubicaId)} · ${dirCorta(v)}`;

  const ordenadas = viviendas.slice().sort((a, b) =>
    dirLarga(a).localeCompare(dirLarga(b), 'es', { numeric: true }));

  cont.innerHTML = `
    <div class="cabecera-pagina">
      <div>
        <h1 class="titulo-pagina">Viviendas · ${esc(com.nombre)}</h1>
        <p class="subtitulo">${viviendas.length} viviendas registradas.</p>
      </div>
      <div class="cabecera-acciones">
        <button class="boton" id="btn-export-xlsx" title="Descarga el directorio como Excel (.xlsx): cada dato en su columna y fila">⬇️ Exportar</button>
        <button class="boton" id="btn-importar" title="Crea o actualiza viviendas desde un archivo .xlsx o .csv, con revisión previa">📥 Importar</button>
        <button class="boton" id="btn-plantilla" title="Descarga la plantilla .xlsx con las columnas exactas y ejemplos">📝 Plantilla</button>
        <button class="boton" id="btn-export-json" title="Descarga un respaldo completo de la comunidad (JSON)">🗄️ Respaldo</button>
        <button class="boton boton-primario" id="btn-nueva-vivienda">+ Nueva vivienda</button>
      </div>
    </div>

    <div class="barra-filtros">
      <input class="campo-busq" id="f-v-busq" type="search" placeholder="Filtrar por dirección o nombre…">
      <select class="campo-select" id="f-v-ubica">
        <option value="">Todos</option>
        ${estructura.map((e) => `<option value="${esc(e.id)}">${esc(e.nombre)}</option>`).join('')}
      </select>
      <select class="campo-select" id="f-v-tipo">
        <option value="">Todos los tipos</option>
        <option value="propia">Propietario ocupante</option>
        <option value="renta">En renta</option>
        <option value="vacante">Vacante</option>
      </select>
    </div>

    <div class="lista-filas" id="lista-viviendas-admin"></div>`;

  const lista = cont.querySelector('#lista-viviendas-admin');
  const inputBusq = cont.querySelector('#f-v-busq');
  const selUbica = cont.querySelector('#f-v-ubica');
  const selTipo = cont.querySelector('#f-v-tipo');

  function concuerda(v) {
    if (selUbica.value && v.ubicaId !== selUbica.value) return false;
    if (selTipo.value && v.tipo !== selTipo.value) return false;
    const q = inputBusq.value.trim().toLowerCase();
    if (!q) return true;
    const partes = [
      v.numero, nombreDe(v.ubicaId),
      v.propietario.nombre, v.propietario.telefono,
      v.inquilino ? [v.inquilino.nombre, v.inquilino.telefono] : [],
    ];
    return partes.some((p) => String(p || '').toLowerCase().includes(q));
  }

  function fila(v) {
    const principal = v.tipo === 'renta' && v.inquilino ? v.inquilino : v.propietario;
    const badge = v.tipo === 'renta'
      ? '<span class="badge badge-renta">EN RENTA</span>'
      : v.tipo === 'vacante'
        ? '<span class="badge badge-gris">VACANTE</span>'
        : '';
    const contactos = [
      principal.nombre || 'Sin datos de contacto',
      principal.telefono ? `📞 ${principal.telefono}` : '',
    ].filter(Boolean).join(' · ');
    return `
      <div class="fila" data-id="${esc(v.id)}">
        <div class="fila-principal">
          <strong>${esc(dirLarga(v))}</strong> ${badge}
          <span class="fila-secundaria">${esc(contactos)}</span>
        </div>
        <div class="fila-acciones">
          <button class="boton boton-mini" data-accion="editar" title="Editar">✏️</button>
          <button class="boton boton-mini boton-peligro" data-accion="eliminar" title="Eliminar">🗑️</button>
        </div>
      </div>`;
  }

  function aplicar() {
    const visibles = ordenadas.filter(concuerda);
    lista.innerHTML = visibles.length
      ? visibles.map(fila).join('')
      : '<div class="vacio">No hay viviendas que coincidan.</div>';
    lista.querySelectorAll('[data-accion="editar"]').forEach((b) => {
      b.addEventListener('click', () => {
        const v = visibles.find((x) => x.id === b.closest('.fila').dataset.id);
        formulario(v, { estructura, esTorre, cont, ctx });
      });
    });
    lista.querySelectorAll('[data-accion="eliminar"]').forEach((b) => {
      b.addEventListener('click', async () => {
        const id = b.closest('.fila').dataset.id;
        const v = visibles.find((x) => x.id === id);
        const ok = await confirmar(`¿Eliminar la vivienda «${dirLarga(v)}»? Esta acción no se puede deshacer.`, {
          titulo: 'Eliminar vivienda', textoSi: 'Eliminar', textoNo: 'Cancelar',
        });
        if (!ok) return;
        try {
          await deleteVivienda(com.id, id);
          toast('Vivienda eliminada.');
          render(cont, ctx);
        } catch (err) {
          toast(err.message || 'No se pudo eliminar.', 'error');
        }
      });
    });
  }

  inputBusq.addEventListener('input', aplicar);
  selUbica.addEventListener('change', aplicar);
  selTipo.addEventListener('change', aplicar);
  aplicar();

  // --- Exportación / importación / respaldos -------------------------------------
  cont.querySelector('#btn-export-xlsx').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      // Excel con TODAS las viviendas (activas e inactivas), normalizadas.
      const todas = viviendasRaw.map(viviendaNormalizada);
      await descargarExcel({ comunidad: com.nombre, estructura, viviendas: todas });
      toast('Directorio Excel descargado', 'ok');
    } catch (err) {
      toast(err.message || 'No se pudo generar el Excel.', 'error');
    } finally {
      btn.disabled = false;
    }
  });

  cont.querySelector('#btn-plantilla').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      await descargarPlantilla();
      toast('Plantilla descargada', 'ok');
    } catch (err) {
      toast(err.message || 'No se pudo generar la plantilla.', 'error');
    } finally {
      btn.disabled = false;
    }
  });

  cont.querySelector('#btn-importar').addEventListener('click', () =>
    modalImportar({ estructura, viviendasRaw, com, cont, ctx }));

  cont.querySelector('#btn-export-json').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      const respaldo = await exportarComunidad(com.id);
      descargarArchivo(
        `respaldo-${slug(com.nombre)}-${fechaCorta()}.json`,
        JSON.stringify(respaldo, null, 2),
        'application/json;charset=utf-8',
      );
      toast('Respaldo completo descargado', 'ok');
    } catch (err) {
      toast('No se pudo generar el respaldo: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });

  cont.querySelector('#btn-nueva-vivienda').addEventListener('click', () =>
    formulario(null, { estructura, esTorre, cont, ctx }));
}

/* ------------------------- Importación de viviendas --------------------- */

/**
 * Modal de importación: elige archivo (.xlsx o .csv), muestra una revisión
 * previa fila por fila (NUEVA / ACTUALIZA / ERROR) y solo al confirmar
 * escribe en la base. Nada se guarda antes de que la persona confirme.
 */
function modalImportar({ estructura, viviendasRaw, com, cont, ctx }) {
  const contenido = document.createElement('div');
  contenido.className = 'form-grid';
  contenido.innerHTML = `
    <div class="campo campo-ancho">
      <p style="margin:0 0 8px">
        Elige un archivo <strong>.xlsx</strong> o <strong>.csv</strong> con las columnas de la plantilla
        (la obtienes con el botón <strong>📝 Plantilla</strong>).
        Lo que ya exista se <strong>actualiza</strong> si coincide la calle y el número; lo demás se <strong>crea</strong>.
      </p>
      <input id="imp-archivo" type="file" accept=".xlsx,.xls,.csv">
      <p class="texto-suave" style="margin:6px 0 0">Nada se guarda hasta que revises la lista y confirmes.</p>
    </div>
    <div id="imp-previa" class="campo campo-ancho"></div>`;

  const { pie, cerrar } = abrirModal({ titulo: 'Importar viviendas', contenido, ancho: 760 });
  const inputArc = contenido.querySelector('#imp-archivo');
  const zonaPrevia = contenido.querySelector('#imp-previa');

  const btnCancelar = document.createElement('button');
  btnCancelar.type = 'button';
  btnCancelar.className = 'boton';
  btnCancelar.textContent = 'Cancelar';
  btnCancelar.addEventListener('click', cerrar);

  const btnConfirmar = document.createElement('button');
  btnConfirmar.type = 'button';
  btnConfirmar.className = 'boton boton-primario';
  btnConfirmar.textContent = 'Confirmar importación';
  btnConfirmar.hidden = true;

  let analisis = null;

  function filaPrevia(it) {
    const destino = it.datosGuardar
      ? (it.existeId
        ? '<span class="badge badge-ok">ACTUALIZA</span>'
        : '<span class="badge badge-ok">NUEVA</span>')
      : '<span class="badge badge-error">DESCARTA</span>';
    const notas = [...it.errores, ...it.avisos]
      .map((t) => `<div>${esc(t)}</div>`).join('');
    return `
      <tr>
        <td>${it.fila}</td>
        <td>${esc(it.calle || '—')} · ${esc(it.numero || '—')}</td>
        <td>${destino}</td>
        <td>${notas || '<span class="texto-suave">Sin observaciones</span>'}</td>
      </tr>`;
  }

  inputArc.addEventListener('change', async () => {
    const archivo = inputArc.files[0];
    if (!archivo) return;
    zonaPrevia.innerHTML = '<p class="texto-suave">Leyendo el archivo…</p>';
    btnConfirmar.hidden = true;
    try {
      const datos = await leerArchivoImport(archivo);
      analisis = analizarImportacion({
        encabezados: datos.encabezados,
        filas: datos.filas,
        estructura,
        existentes: viviendasRaw.map(viviendaNormalizada),
      });
      if (!analisis.resumen.reconocidas.length) {
        throw new Error('El archivo no tiene las columnas del directorio (Ubicación, Dirección, Estado…). Usa la plantilla 📝 como guión.');
      }
      const r = analisis.resumen;
      const guardar = r.nuevas + r.actualizan;
      zonaPrevia.innerHTML = `
        <div class="imp-resumen">
          <span class="badge badge-ok">${r.nuevas} nuevas</span>
          <span class="badge badge-aviso">${r.actualizan} para actualizar</span>
          ${r.conAvisos ? `<span class="badge badge-renta">${r.conAvisos} con avisos</span>` : ''}
          ${r.descartadas ? `<span class="badge badge-error">${r.descartadas} con errores (no se guardarán)</span>` : ''}
        </div>
        <div class="imp-tabla">
          <table>
            <thead><tr><th>Fila</th><th>Calle · Casa</th><th>Se hará</th><th>Detalle</th></tr></thead>
            <tbody>${analisis.items.map(filaPrevia).join('')}</tbody>
          </table>
        </div>
        ${guardar ? '' : '<p class="texto-error" style="text-align:left">Ninguna fila se puede guardar; corrige el archivo y vuelve a importarlo.</p>'}`;
      btnConfirmar.hidden = guardar === 0;
    } catch (err) {
      zonaPrevia.innerHTML = '';
      toast(err.message || 'No se pudo leer el archivo.', 'error');
    }
  });

  btnConfirmar.addEventListener('click', async () => {
    if (!analisis) return;
    const aGuardar = analisis.items.filter((i) => i.datosGuardar);
    btnConfirmar.disabled = true;
    btnConfirmar.textContent = 'Guardando…';
    let nuevas = 0;
    let actualizadas = 0;
    let fallidas = 0;
    for (const it of aGuardar) {
      try {
        await saveVivienda(com.id, it.datosGuardar, it.existeId || null);
        if (it.existeId) actualizadas += 1;
        else nuevas += 1;
      } catch (err) {
        fallidas += 1;
        console.error('Vivienda no importada (fila ' + it.fila + '):', err);
      }
    }
    cerrar();
    toast(
      `Importación lista: ${nuevas} nuevas, ${actualizadas} actualizadas.`
      + (fallidas ? ` ${fallidas} no pudieron guardarse.` : ''),
      fallidas ? 'error' : 'ok',
    );
    render(cont, ctx);
  });

  pie.append(btnCancelar, btnConfirmar);
}

/* ------------------------- Formulario vivienda ------------------------- */

/** Campo de teléfono: selector de código de país + número local + aviso suave. */
function campoTelefono(sufijo, tipo, valorCompleto, etiqueta) {
  const { codigo, numero } = partirTelefono(valorCompleto);
  const id = `fv-${sufijo}-tel-${tipo}`;
  const icono = tipo === 'movil' ? iconoWhatsapp('#25D366', 'icono-wa icono-label') : tipo === 'casa' ? '🏠' : '💼';
  return `
    <div class="campo">
      <label for="${id}">${icono} ${esc(etiqueta)}${tipo === 'trabajo' ? ' (opcional)' : ''}</label>
      <div class="campo-tel">
        <select class="tel-pais" data-tel-para="${id}">${htmlOpcionesPais(codigo)}</select>
        <input id="${id}" value="${esc(numero)}" inputmode="tel" placeholder="${tipo === 'movil' ? 'Ej: 55 1234 5678' : 'Ej: 55 8765 4321'}">
      </div>
      <small class="aviso-tel" data-aviso-para="${id}" hidden></small>
    </div>`;
}

function formulario(v, { estructura, esTorre, cont, ctx }) {
  const esNueva = !v;
  const datos = v || viviendaNormalizada({ tipo: 'propia' });

  const contenido = document.createElement('div');
  contenido.className = 'form-grid';

  contenido.innerHTML = `
    <div class="campo">
      <label>${esTorre ? 'Torre / edificio' : 'Calle / sector'}</label>
      <select id="fv-ubi">
        ${estructura.map((e) => `<option value="${esc(e.id)}" ${datos.ubicaId === e.id ? 'selected' : ''}>${esc(e.nombre)}</option>`).join('')}
      </select>
    </div>
    <div class="campo">
      <label>${esTorre ? 'N° de apartamento' : 'N° de casa'}</label>
      <input id="fv-num" value="${esc(datos.numero)}" placeholder="${esTorre ? 'Ej: 304' : 'Ej: 12'}">
    </div>
    <div class="campo campo-ancho">
      <label>Tipo de ocupación</label>
      <select id="fv-tipo">
        <option value="propia" ${datos.tipo === 'propia' ? 'selected' : ''}>Propietario ocupante</option>
        <option value="renta" ${datos.tipo === 'renta' ? 'selected' : ''}>En renta (con inquilino)</option>
        <option value="vacante" ${datos.tipo === 'vacante' ? 'selected' : ''}>Vacante (sin ocupante)</option>
      </select>
    </div>

    <div class="grupo-campos campo-ancho">
      <h4 class="titulo-grupo">👤 Propietario</h4>
      <div class="campo"><label>Nombre</label><input id="fv-p-nombre" value="${esc(datos.propietario.nombre)}"></div>

      <div class="titulo-fila">
        <h4 class="titulo-grupo">📞 Teléfonos</h4>
        <button type="button" class="boton boton-mini" id="fv-tel-mas-p" title="Agregar teléfono">＋</button>
      </div>
      <div id="fv-tels-p" class="campo-ancho"></div>

      <div class="titulo-fila">
        <h4 class="titulo-grupo">✉️ Correos</h4>
        <button type="button" class="boton boton-mini" id="fv-correo-mas-p" title="Agregar correo">＋</button>
      </div>
      <div id="fv-correos-p" class="campo-ancho"></div>

      <div class="titulo-fila">
        <h4 class="titulo-grupo">👥 Integrantes del hogar</h4>
        <button type="button" class="boton boton-mini" id="fv-agregar-integrante-p" title="Agregar integrante (referencia del propietario)">＋</button>
      </div>
      <div id="fv-integrantes-p" class="campo-ancho"></div>
    </div>

    <div class="grupo-campos campo-ancho" id="fv-seccion-inquilino">
      <h4 class="titulo-grupo">🔑 Inquilino (arrendatario)</h4>
      <div class="campo"><label>Nombre</label><input id="fv-i-nombre" value="${esc(datos.inquilino ? datos.inquilino.nombre : '')}"></div>

      <div class="titulo-fila">
        <h4 class="titulo-grupo">📞 Teléfonos</h4>
        <button type="button" class="boton boton-mini" id="fv-tel-mas-i" title="Agregar teléfono">＋</button>
      </div>
      <div id="fv-tels-i" class="campo-ancho"></div>

      <div class="titulo-fila">
        <h4 class="titulo-grupo">✉️ Correos</h4>
        <button type="button" class="boton boton-mini" id="fv-correo-mas-i" title="Agregar correo">＋</button>
      </div>
      <div id="fv-correos-i" class="campo-ancho"></div>

      <div class="titulo-fila">
        <h4 class="titulo-grupo">👥 Integrantes del hogar (inquilino)</h4>
        <button type="button" class="boton boton-mini" id="fv-agregar-integrante-i" title="Agregar integrante del inquilino">＋</button>
      </div>
      <div id="fv-integrantes-i" class="campo-ancho"></div>
    </div>

    <div class="grupo-campos campo-ancho">
      <h4 class="titulo-grupo">✚ Contacto de emergencia</h4>
      <div class="campo"><label>Nombre</label><input id="fv-e-nombre" value="${esc(datos.emergencia.nombre)}"></div>
      ${campoTelefono('e', 'movil', datos.emergencia.telefonos.movil, 'Móvil (WhatsApp)')}
      ${campoTelefono('e', 'casa', datos.emergencia.telefonos.casa, 'Casa')}
      ${campoTelefono('e', 'trabajo', datos.emergencia.telefonos.trabajo, 'Trabajo')}
      <div class="campo"><label>Tipo de sangre (opcional)</label><input id="fv-e-sangre" value="${esc(datos.emergencia.tipoSangre)}" placeholder="Ej: O+"></div>
      <div class="campo campo-ancho"><label>Relación (opcional)</label><input id="fv-e-relacion" value="${esc(datos.emergencia.relacion)}" placeholder="Ej: Familiar, vecino…"></div>
    </div>

    <div class="campo campo-ancho">
      <label class="label-check">
        <input type="checkbox" id="fv-colaborador" ${datos.esColaboradorVecinal ? 'checked' : ''}>
        Colaborador vecinal (oficio útil para la comunidad)
      </label>
      <input id="fv-oficio" value="${esc(datos.oficio)}" placeholder="Ej: Enfermera, plomero, electricista…">
    </div>

    <div class="campo campo-ancho">
      <label>Nota interna (solo administración, no sale en el directorio)</label>
      <textarea id="fv-nota" rows="2">${esc(datos.notaInterna)}</textarea>
    </div>

    <div class="campo campo-ancho">
      <label class="label-check">
        <input type="checkbox" id="fv-activa" ${datos.activo ? 'checked' : ''}>
        Vivienda activa (visible en el directorio)
      </label>
    </div>`;

  const { pie, cerrar } = abrirModal({
    titulo: esNueva ? 'Nueva vivienda' : `Editar vivienda`,
    contenido,
    ancho: 640,
  });

  const contenedorIntegrantesP = contenido.querySelector('#fv-integrantes-p');
  const contenedorIntegrantesI = contenido.querySelector('#fv-integrantes-i');
  function agregarFilaIntegrante(contenedor, nombre = '', movil = '', correo = '') {
    const fila = document.createElement('div');
    fila.className = 'fila-integrante';
    fila.innerHTML = `
      <div class="fi-cab">
        <input class="fi-nombre" placeholder="Nombre completo" value="${esc(nombre)}">
        <button type="button" class="boton boton-mini boton-peligro" title="Quitar integrante">✕</button>
      </div>
      <div class="fi-linea">
        <input class="fi-movil" placeholder="Móvil (Ej: +52 55 1234 5678)" inputmode="tel" value="${esc(movil)}">
        <input class="fi-correo" placeholder="Correo (Ej: persona@correo.com)" type="email" value="${esc(correo)}">
      </div>`;
    fila.querySelector('button').addEventListener('click', () => fila.remove());
    contenedor.appendChild(fila);
  }
  (datos.integrantes || []).forEach((i) => agregarFilaIntegrante(contenedorIntegrantesP, i.nombre, i.movil || '', i.correo || ''));
  const referenciaInquilino = datos.integrantesInquilino || (datos.inquilino ? datos.inquilino.integrantes : null) || [];
  referenciaInquilino.forEach((i) => agregarFilaIntegrante(contenedorIntegrantesI, i.nombre, i.movil || '', i.correo || ''));
  contenido.querySelector('#fv-agregar-integrante-p').addEventListener('click', () => agregarFilaIntegrante(contenedorIntegrantesP));
  contenido.querySelector('#fv-agregar-integrante-i').addEventListener('click', () => agregarFilaIntegrante(contenedorIntegrantesI));

  const seccionInq = contenido.querySelector('#fv-seccion-inquilino');
  const selTipo = contenido.querySelector('#fv-tipo');
  function actualizarVisibilidad() {
    seccionInq.style.display = selTipo.value === 'renta' ? '' : 'none';
  }
  selTipo.addEventListener('change', actualizarVisibilidad);
  actualizarVisibilidad();

  // --- Aviso suave de dígitos según el país seleccionado ---
  function cablearAviso(grupo) {
    const sel = grupo.querySelector('.tel-pais');
    const input = grupo.querySelector('input');
    const aviso = contenido.querySelector(`[data-aviso-para="${input.id}"]`);
    function checar() {
      if (!aviso) return;
      const esperados = digitosEsperados(sel.value);
      const n = input.value.replace(/\D/g, '');
      if (sel.value && esperados && n && n.length !== esperados) {
        const pais = paisDe(sel.value);
        aviso.textContent = `⚠️ ${pais ? pais.n : sel.value} suele usar ${esperados} dígitos; escribiste ${n.length}. Puedes continuar si el número es correcto.`;
        aviso.hidden = false;
      } else {
        aviso.hidden = true;
        aviso.textContent = '';
      }
    }
    sel.addEventListener('change', checar);
    input.addEventListener('input', checar);
    checar();
  }
  contenido.querySelectorAll('.campo-tel').forEach(cablearAviso);

  // --- Listas de teléfonos y correos del propietario y del inquilino ---
  // Máximo 3 de cada; el primero es el que muestra WhatsApp en el directorio.
  let nTelFicha = 0;
  function agregarFilaTelefono(prefijo, valorCompleto) {
    const contenedor = contenido.querySelector(`#fv-tels-${prefijo}`);
    nTelFicha += 1;
    const idInput = `fv-${prefijo}-tel-d${nTelFicha}`;
    const { codigo, numero } = partirTelefono(valorCompleto);
    const fila = document.createElement('div');
    fila.className = 'fila-telefono';
    fila.innerHTML = `
      <div class="campo-tel">
        <select class="tel-pais">${htmlOpcionesPais(codigo)}</select>
        <input class="ft-numero" id="${idInput}" value="${esc(numero)}" inputmode="tel" placeholder="Ej: 55 1234 5678">
      </div>
      <small class="aviso-tel" data-aviso-para="${idInput}" hidden></small>
      <button type="button" class="boton boton-mini boton-peligro" title="Quitar teléfono">✕</button>`;
    fila.querySelector('button').addEventListener('click', () => { fila.remove(); refrescarMas(prefijo); });
    cablearAviso(fila.querySelector('.campo-tel'));
    contenedor.appendChild(fila);
  }
  function agregarFilaCorreo(prefijo, valor) {
    const contenedor = contenido.querySelector(`#fv-correos-${prefijo}`);
    const fila = document.createElement('div');
    fila.className = 'fila-correo';
    fila.innerHTML = `
      <input type="email" class="fc-correo" placeholder="Ej: persona@correo.com" value="${esc(valor)}">
      <button type="button" class="boton boton-mini boton-peligro" title="Quitar correo">✕</button>`;
    fila.querySelector('button').addEventListener('click', () => { fila.remove(); refrescarMas(prefijo); });
    contenedor.appendChild(fila);
  }
  function refrescarMas(prefijo) {
    const btnTel = contenido.querySelector(`#fv-tel-mas-${prefijo}`);
    const btnCorreo = contenido.querySelector(`#fv-correo-mas-${prefijo}`);
    btnTel.hidden = contenido.querySelectorAll(`#fv-tels-${prefijo} .fila-telefono`).length >= 3;
    btnCorreo.hidden = contenido.querySelectorAll(`#fv-correos-${prefijo} .fila-correo`).length >= 3;
  }
  function cargarContacto(prefijo, persona) {
    const p = persona || {};
    [p.telefonos && p.telefonos.movil, p.telefonos && p.telefonos.casa, p.telefonos && p.telefonos.trabajo]
      .filter(Boolean).forEach((x) => agregarFilaTelefono(prefijo, String(x).trim()));
    [p.correo, p.correo2, p.correo3].filter(Boolean).forEach((c) => agregarFilaCorreo(prefijo, c));
    if (!contenido.querySelectorAll(`#fv-tels-${prefijo} .fila-telefono`).length) agregarFilaTelefono(prefijo, '');
    if (!contenido.querySelectorAll(`#fv-correos-${prefijo} .fila-correo`).length) agregarFilaCorreo(prefijo, '');
    refrescarMas(prefijo);
  }
  cargarContacto('p', datos.propietario);
  cargarContacto('i', datos.inquilino);
  contenido.querySelector('#fv-tel-mas-p').addEventListener('click', () => { agregarFilaTelefono('p', ''); refrescarMas('p'); });
  contenido.querySelector('#fv-tel-mas-i').addEventListener('click', () => { agregarFilaTelefono('i', ''); refrescarMas('i'); });
  contenido.querySelector('#fv-correo-mas-p').addEventListener('click', () => { agregarFilaCorreo('p', ''); refrescarMas('p'); });
  contenido.querySelector('#fv-correo-mas-i').addEventListener('click', () => { agregarFilaCorreo('i', ''); refrescarMas('i'); });

  // --- Guardado ---
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
    const valor = (id) => contenido.querySelector(id).value.trim();
    const tipo = selTipo.value;
    const leerIntegrantes = (contenedor) => [...contenedor.querySelectorAll('.fila-integrante')]
      .map((f) => ({
        nombre: f.querySelector('.fi-nombre').value.trim(),
        movil: f.querySelector('.fi-movil').value.trim(),
        correo: f.querySelector('.fi-correo').value.trim(),
      }))
      .filter((i) => i.nombre);
    const integrantes = leerIntegrantes(contenedorIntegrantesP);
    const integrantesInquilino = leerIntegrantes(contenedorIntegrantesI);

    // Arma el bloque de teléfonos de emergencia (campos fijos).
    function telefonosDe(sufijo) {
      function armar(campo) {
        const input = contenido.querySelector(`#fv-${sufijo}-tel-${campo}`);
        if (!input) return '';
        const numero = input.value.trim();
        if (!numero) return '';
        const sel = input.closest('.campo-tel').querySelector('.tel-pais');
        return sel.value ? `${sel.value} ${numero}` : numero;
      }
      const telefonos = {
        casa: armar('casa'),
        trabajo: armar('trabajo'),
        movil: armar('movil'),
      };
      const telefono = telefonos.movil || telefonos.casa || telefonos.trabajo || '';
      return { telefonos, telefono };
    }

    // Bloque de contacto (propietario o inquilino): lee las fichas de
    // teléfonos y correos en orden y lo guarda en los mismos espacios
    // de siempre (telefonos.movil/casa/trabajo y correo/correo2/correo3),
    // así los registros antiguos y el directorio siguen funcionando.
    function bloquesContacto(sufijo) {
      const listaTel = [...contenido.querySelectorAll(`#fv-tels-${sufijo} .ft-numero`)].map((input) => {
        const numero = input.value.trim();
        if (!numero) return '';
        const sel = input.closest('.campo-tel').querySelector('.tel-pais');
        return sel.value ? `${sel.value} ${numero}` : numero;
      }).filter(Boolean);
      const telefonos = {
        movil: listaTel[0] || '',
        casa: listaTel[1] || '',
        trabajo: listaTel[2] || '',
      };
      const telefono = telefonos.movil || telefonos.casa || telefonos.trabajo || '';
      const correos = [...contenido.querySelectorAll(`#fv-correos-${sufijo} .fc-correo`)]
        .map((i) => i.value.trim()).filter(Boolean);
      const correo = correos[0] || '';
      return {
        telefonos, telefono, correo,
        correo2: correos[1] || '',
        correo3: correos[2] || '',
      };
    }

    const emeTel = telefonosDe('e');
    const propC = bloquesContacto('p');
    const inqC = bloquesContacto('i');

    // Regla de guardado (Opción A): la persona principal — el inquilino si la
    // vivienda está en renta con inquilino nombrado; si no, el propietario —
    // necesita al menos un teléfono y al menos un correo.
    const sufijoPrincipal = (tipo === 'renta' && valor('#fv-i-nombre')) ? 'i' : 'p';
    const principal = sufijoPrincipal === 'i' ? inqC : propC;
    if (!principal.telefono) {
      toast('La persona principal necesita al menos un teléfono.', 'error');
      const primerTel = contenido.querySelector(`#fv-tels-${sufijoPrincipal} .ft-numero`);
      if (primerTel) primerTel.focus();
      return;
    }
    if (!principal.correo) {
      toast('La persona principal necesita al menos un correo electrónico.', 'error');
      const primerCorreo = contenido.querySelector(`#fv-correos-${sufijoPrincipal} .fc-correo`);
      if (primerCorreo) primerCorreo.focus();
      return;
    }

    const inquilino = tipo === 'renta'
      ? {
          nombre: valor('#fv-i-nombre'),
          correo: inqC.correo,
          correo2: inqC.correo2,
          correo3: inqC.correo3,
          telefonos: inqC.telefonos,
          telefono: inqC.telefono,
        }
      : null;

    const datosGuardar = {
      ubicaId: contenido.querySelector('#fv-ubi').value,
      numero: valor('#fv-num'),
      tipo,
      propietario: {
        nombre: valor('#fv-p-nombre'),
        correo: propC.correo,
        correo2: propC.correo2,
        correo3: propC.correo3,
        telefonos: propC.telefonos,
        telefono: propC.telefono,
      },
      inquilino: inquilino && (inquilino.nombre || inquilino.telefono || inquilino.correo) ? inquilino : null,
      integrantes,
      integrantesInquilino: tipo === 'renta' ? integrantesInquilino : [],
      emergencia: {
        nombre: valor('#fv-e-nombre'),
        telefonos: emeTel.telefonos,
        telefono: emeTel.telefono,
        tipoSangre: valor('#fv-e-sangre'),
        relacion: valor('#fv-e-relacion'),
      },
      esColaboradorVecinal: contenido.querySelector('#fv-colaborador').checked,
      oficio: valor('#fv-oficio'),
      notaInterna: valor('#fv-nota'),
      activo: contenido.querySelector('#fv-activa').checked,
    };

    if (!datosGuardar.ubicaId) { toast('Primero crea una calle o torre en la sección Estructura.', 'error'); return; }

    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando…';
    try {
      await saveVivienda(ctx.comunidad.id, datosGuardar, v ? v.id : null);
      cerrar();
      toast(esNueva ? 'Vivienda creada.' : 'Vivienda actualizada.');
      render(cont, ctx);
    } catch (err) {
      toast(err.message || 'No se pudo guardar.', 'error');
      btnGuardar.disabled = false;
      btnGuardar.textContent = 'Guardar';
    }
  });

  pie.append(btnCancelar, btnGuardar);
}
