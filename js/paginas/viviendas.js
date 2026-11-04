// ============================================================================
// QUENDA — Administración de viviendas (solo administración)
// Crear/editar/eliminar fichas de viviendas con propietario, inquilino
// (casas en renta), integrantes del hogar y contacto de emergencia.
// ============================================================================

import { listEstructura, listViviendas, saveVivienda, deleteVivienda, viviendaNormalizada, exportarComunidad } from '../db.js';
import { esc, toast, abrirModal, confirmar, iconoWhatsapp } from '../ui.js';
import { descargarArchivo, slug, fechaCorta, directorioCSV } from '../exportar.js';
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
        <button class="boton" id="btn-export-csv" title="Descarga el directorio para abrir en Excel">⬇️ CSV</button>
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

  // --- Exportación / respaldos -------------------------------------
  cont.querySelector('#btn-export-csv').addEventListener('click', () => {
    // CSV con TODAS las viviendas (activas e inactivas), normalizadas.
    const todas = viviendasRaw.map(viviendaNormalizada);
    descargarArchivo(
      `directorio-${slug(com.nombre)}-${fechaCorta()}.csv`,
      '\ufeff' + directorioCSV({ estructura, viviendas: todas }),
      'text/csv;charset=utf-8',
    );
    toast('Directorio CSV descargado', 'ok');
  });

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
      <div class="campo"><label>Correo electrónico</label><input id="fv-p-correo" type="email" value="${esc(datos.propietario.correo)}"></div>
      <div class="campo" id="cont-p-correo2" ${datos.propietario.correo2 ? '' : 'hidden'}><label>Segundo correo (opcional)</label><input id="fv-p-correo2" type="email" value="${esc(datos.propietario.correo2 || '')}"></div>
      <div class="campo campo-ancho">
        <button type="button" class="boton boton-mini" id="btn-p-correo2" ${datos.propietario.correo2 ? 'hidden' : ''}>+ Agregar segundo correo</button>
      </div>
      ${campoTelefono('p', 'movil', datos.propietario.telefonos.movil, 'Móvil (WhatsApp)')}
      ${campoTelefono('p', 'casa', datos.propietario.telefonos.casa, 'Casa')}
      ${campoTelefono('p', 'trabajo', datos.propietario.telefonos.trabajo, 'Trabajo')}
    </div>

    <div class="grupo-campos campo-ancho" id="fv-seccion-inquilino">
      <h4 class="titulo-grupo">🔑 Inquilino (arrendatario)</h4>
      <div class="campo"><label>Nombre</label><input id="fv-i-nombre" value="${esc(datos.inquilino ? datos.inquilino.nombre : '')}"></div>
      <div class="campo"><label>Correo electrónico</label><input id="fv-i-correo" type="email" value="${esc(datos.inquilino ? datos.inquilino.correo : '')}"></div>
      <div class="campo" id="cont-i-correo2" ${datos.inquilino && datos.inquilino.correo2 ? '' : 'hidden'}><label>Segundo correo (opcional)</label><input id="fv-i-correo2" type="email" value="${esc(datos.inquilino ? datos.inquilino.correo2 || '' : '')}"></div>
      <div class="campo campo-ancho">
        <button type="button" class="boton boton-mini" id="btn-i-correo2" ${datos.inquilino && datos.inquilino.correo2 ? 'hidden' : ''}>+ Agregar segundo correo</button>
      </div>
      ${campoTelefono('i', 'movil', datos.inquilino ? datos.inquilino.telefonos.movil : '', 'Móvil (WhatsApp)')}
      ${campoTelefono('i', 'casa', datos.inquilino ? datos.inquilino.telefonos.casa : '', 'Casa')}
      ${campoTelefono('i', 'trabajo', datos.inquilino ? datos.inquilino.telefonos.trabajo : '', 'Trabajo')}
    </div>

    <div class="grupo-campos campo-ancho">
      <h4 class="titulo-grupo">👥 Integrantes del hogar</h4>
      <div id="fv-integrantes"></div>
      <button type="button" class="boton boton-mini" id="fv-agregar-integrante">+ Agregar integrante</button>
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

  const contenedorIntegrantes = contenido.querySelector('#fv-integrantes');
  function agregarFilaIntegrante(nombre = '', relacion = '') {
    const fila = document.createElement('div');
    fila.className = 'fila-integrante';
    fila.innerHTML = `
      <input class="fi-nombre" placeholder="Nombre" value="${esc(nombre)}">
      <input class="fi-relacion" placeholder="Relación (cónyuge, hija…)" value="${esc(relacion)}">
      <button type="button" class="boton boton-mini boton-peligro" title="Quitar">✕</button>`;
    fila.querySelector('button').addEventListener('click', () => fila.remove());
    contenedorIntegrantes.appendChild(fila);
  }
  (datos.integrantes || []).forEach((i) => agregarFilaIntegrante(i.nombre, i.relacion));
  contenido.querySelector('#fv-agregar-integrante').addEventListener('click', () => agregarFilaIntegrante());

  const seccionInq = contenido.querySelector('#fv-seccion-inquilino');
  const selTipo = contenido.querySelector('#fv-tipo');
  function actualizarVisibilidad() {
    seccionInq.style.display = selTipo.value === 'renta' ? '' : 'none';
  }
  selTipo.addEventListener('change', actualizarVisibilidad);
  actualizarVisibilidad();

  // --- Aviso suave de dígitos según el país seleccionado ---
  contenido.querySelectorAll('.campo-tel').forEach((grupo) => {
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
  });

  // --- Segundo correo: aparece al pulsar el botón ---
  [['p', '#btn-p-correo2', '#cont-p-correo2'], ['i', '#btn-i-correo2', '#cont-i-correo2']].forEach(([suf, selBtn, selCont]) => {
    const b = contenido.querySelector(selBtn);
    if (!b) return;
    b.addEventListener('click', () => {
      contenido.querySelector(selCont).hidden = false;
      b.hidden = true;
      contenido.querySelector(`#fv-${suf}-correo2`).focus();
    });
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
    const valor = (id) => contenido.querySelector(id).value.trim();
    const tipo = selTipo.value;
    const integrantes = [...contenedorIntegrantes.querySelectorAll('.fila-integrante')]
      .map((f) => ({
        nombre: f.querySelector('.fi-nombre').value.trim(),
        relacion: f.querySelector('.fi-relacion').value.trim(),
      }))
      .filter((i) => i.nombre);

    // Arma el bloque de teléfonos: selector de país + número local.
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

    const propTel = telefonosDe('p');
    const inqTel = telefonosDe('i');
    const emeTel = telefonosDe('e');

    // Regla de guardado (Opción A): la persona principal — el inquilino si la
    // vivienda está en renta con inquilino nombrado; si no, el propietario —
    // necesita al menos un teléfono de los tres y al menos un correo.
    const sufijoPrincipal = (tipo === 'renta' && valor('#fv-i-nombre')) ? 'i' : 'p';
    const telPrincipal = sufijoPrincipal === 'i' ? inqTel : propTel;
    const correoPrincipal = valor(`#fv-${sufijoPrincipal}-correo`) || valor(`#fv-${sufijoPrincipal}-correo2`);
    if (!telPrincipal.telefono) {
      toast('La persona principal necesita al menos un teléfono (móvil, casa o trabajo).', 'error');
      contenido.querySelector(`#fv-${sufijoPrincipal}-tel-movil`).focus();
      return;
    }
    if (!correoPrincipal) {
      toast('La persona principal necesita al menos un correo electrónico.', 'error');
      contenido.querySelector(`#fv-${sufijoPrincipal}-correo`).focus();
      return;
    }

    const inquilino = tipo === 'renta'
      ? {
          nombre: valor('#fv-i-nombre'),
          correo: valor('#fv-i-correo'),
          correo2: valor('#fv-i-correo2'),
          telefonos: inqTel.telefonos,
          telefono: inqTel.telefono,
        }
      : null;

    const datosGuardar = {
      ubicaId: contenido.querySelector('#fv-ubi').value,
      numero: valor('#fv-num'),
      tipo,
      propietario: {
        nombre: valor('#fv-p-nombre'),
        correo: valor('#fv-p-correo'),
        correo2: valor('#fv-p-correo2'),
        telefonos: propTel.telefonos,
        telefono: propTel.telefono,
      },
      inquilino: inquilino && (inquilino.nombre || inquilino.telefono || inquilino.correo || inquilino.correo2) ? inquilino : null,
      integrantes,
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
