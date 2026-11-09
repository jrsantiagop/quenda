// ============================================================================
// QUENDA — Directorio telefónico (la vista principal)
// Muestra las viviendas de la comunidad activa con búsqueda y filtros.
// La administración ve todo; los residentes ven la misma vista en modo consulta.
// ============================================================================

import { listEstructura, listViviendas, viviendaNormalizada } from '../db.js';
import { esc, iconoWhatsapp } from '../ui.js';

export async function render(cont, ctx) {
  const com = ctx.comunidad;
  const esAdmin = ctx.usuario.rol === 'admin' || ctx.usuario.rol === 'superadmin';

  const [estructura, viviendasRaw] = await Promise.all([
    listEstructura(com.id),
    listViviendas(com.id),
  ]);
  const viviendas = viviendasRaw.map(viviendaNormalizada).filter((v) => v.activo);
  const esTorre = com.tipoEstructura === 'torres';
  const palabraUnidad = esTorre ? 'Torre' : 'Calle';

  const nombreDe = (id) => {
    const e = estructura.find((x) => x.id === id);
    return e ? e.nombre : '—';
  };
  const dirLarga = (v) => `${nombreDe(v.ubicaId)} · ${dirCorta(v)}`;
  const dirCorta = (v) => (esTorre ? `Apto ${v.numero || '—'}` : `Casa ${v.numero || '—'}`);

  cont.innerHTML = `
    <div class="cabecera-pagina">
      <div class="cabecera-con-logo">
        ${com.logoUrl ? `<img class="logo-comunidad-grande" src="${esc(com.logoUrl)}" alt="">` : ''}
        <div>
          <h1 class="titulo-pagina">Directorio · ${esc(com.nombre)}</h1>
          <p class="subtitulo">${esAdmin ? 'Vista de administración' : 'Vista de consulta'} — toca los botones para llamar, escribir por WhatsApp o enviar un correo.</p>
        </div>
      </div>
      <button class="boton" id="btn-recargar" title="Refrescar datos">⟳ Actualizar</button>
    </div>

    <div class="barra-filtros">
      <input class="campo-busq" id="f-busq" type="search"
        placeholder="Buscar por nombre, casa/apto, teléfono, calle o torre…">
      <select class="campo-select" id="f-ubica">
        <option value="">Todos los ${esTorre ? 'edificios' : 'sectores'}</option>
        ${estructura.map((e) => `<option value="${esc(e.id)}">${esc(e.nombre)}</option>`).join('')}
      </select>
      <select class="campo-select" id="f-tipo">
        <option value="">Todas las viviendas</option>
        <option value="propia">Propietario ocupante</option>
        <option value="renta">En renta (inquilino)</option>
        <option value="vacante">Vacantes</option>
      </select>
    </div>

    <div class="resumen" id="resumen"></div>
    <div class="lista-tarjetas" id="lista-viviendas"></div>`;

  cont.querySelector('#btn-recargar').addEventListener('click', () => render(cont, ctx));

  const inputBusq = cont.querySelector('#f-busq');
  const selUbica = cont.querySelector('#f-ubica');
  const selTipo = cont.querySelector('#f-tipo');
  const lista = cont.querySelector('#lista-viviendas');
  const resumen = cont.querySelector('#resumen');

  function concuerda(v) {
    if (selUbica.value && v.ubicaId !== selUbica.value) return false;
    if (selTipo.value && v.tipo !== selTipo.value) return false;
    const q = inputBusq.value.trim().toLowerCase();
    if (!q) return true;
    const partes = [
      v.numero, nombreDe(v.ubicaId),
      v.propietario.nombre, v.propietario.telefono, v.propietario.correo,
      v.inquilino ? [v.inquilino.nombre, v.inquilino.telefono, v.inquilino.correo] : [],
      v.integrantes.map((i) => i.nombre),
      v.oficio, v.tipo,
    ].flat();
    return partes.some((p) => String(p || '').toLowerCase().includes(q));
  }

  function resumenHTML() {
    const total = viviendas.length;
    const renta = viviendas.filter((v) => v.tipo === 'renta').length;
    const vacante = viviendas.filter((v) => v.tipo === 'vacante').length;
    const visibles = ordenadas.filter(concuerda).length;
    return `
      <span class="stat"><strong>${total}</strong> viviendas</span>
      <span class="stat"><strong>${renta}</strong> en renta</span>
      <span class="stat"><strong>${vacante}</strong> vacantes</span>
      <span class="stat"><strong>${visibles}</strong> mostradas</span>`;
  }

  const ordenadas = viviendas.slice().sort((a, b) =>
    `${nombreDe(a.ubicaId)} ${String(a.numero || '')}`.localeCompare(
      `${nombreDe(b.ubicaId)} ${String(b.numero || '')}`, 'es', { numeric: true },
    ));

  function bloquePersona(titulo, p, principal) {
    if (!p) return '';
    const t = p.telefonos || { casa: '', trabajo: '', movil: '', };
    if (!p.nombre && !t.movil && !t.casa && !t.trabajo && !p.correo && !p.correo2 && !p.correo3) return '';

    // Números como texto fijo (sin enlaces); el teléfono de casa lleva 🏠 y
    // el de trabajo 💼; el móvil lleva el logo de WhatsApp.
    const filasTel = [
      t.movil ? `<span>${iconoWhatsapp('#25D366')} <span class="num-tel">${esc(t.movil)}</span></span>` : '',
      t.casa ? `<span>🏠 <span class="num-tel">${esc(t.casa)}</span></span>` : '',
      t.trabajo ? `<span>💼 <span class="num-tel">${esc(t.trabajo)}</span></span>` : '',
      t.extra1 ? `<span>📞 <span class="num-tel">${esc(t.extra1)}</span></span>` : '',
      t.extra2 ? `<span>📞 <span class="num-tel">${esc(t.extra2)}</span></span>` : '',
      t.extra3 ? `<span>📞 <span class="num-tel">${esc(t.extra3)}</span></span>` : '',
    ].filter(Boolean).join('');

    const correo = p.correo || p.correo2 || p.correo3 || '';
    const filasCorreo = [p.correo, p.correo2, p.correo3].filter(Boolean)
      .map((c) => `✉️ ${esc(c)}`).join('');

    const wa = t.movil ? `https://wa.me/${t.movil.replace(/\D/g, '')}` : '';
    const acciones = [
      wa ? `<a class="boton boton-mini boton-wa" href="${esc(wa)}" target="_blank" rel="noopener">${iconoWhatsapp('#ffffff', 'icono-wa icono-boton')} WhatsApp</a>` : '',
      correo ? `<a class="boton boton-mini boton-correo" href="mailto:${esc(correo)}">✉️ Correo</a>` : '',
    ].filter(Boolean).join('');

    return `
      <div class="persona ${principal ? '' : 'persona-suave'}">
        <div class="persona-cab">
          <span class="persona-titulo">${esc(titulo)}</span>
          <strong>${esc(p.nombre || '—')}</strong>
        </div>
        <div class="persona-datos">
          ${filasTel}
          ${filasCorreo}
        </div>
        ${acciones ? `<div class="persona-acciones">${acciones}</div>` : ''}
      </div>`;
  }

  function tarjeta(v) {
    const badges = [];
    if (v.tipo === 'renta') badges.push('<span class="badge badge-renta">EN RENTA</span>');
    if (v.tipo === 'vacante') badges.push('<span class="badge badge-gris">VACANTE</span>');
    if (v.esColaboradorVecinal) badges.push(`<span class="badge badge-oficio">${esc(v.oficio || 'Colaborador')}</span>`);

    const principal = v.tipo === 'renta' && v.inquilino
      ? bloquePersona('Inquilino', v.inquilino, true)
      : bloquePersona('Propietario', v.propietario, true);
    const secundario = v.tipo === 'renta'
      ? bloquePersona('Propietario', v.propietario, false)
      : '';

    const avisoVacante = v.tipo === 'vacante'
      ? '<p class="aviso-vacante">Vivienda vacante — sin ocupante actual.</p>'
      : '';

    const integrantes = v.integrantes.length
      ? `<div class="chips">${v.integrantes.map((i) => `<span class="chip">${esc(i.nombre)}</span>`).join('')}</div>`
      : '';

    const eme = v.emergencia;
    const emeT = eme.telefonos || {};
    const emeFilas = [
      emeT.movil ? `<span>${iconoWhatsapp('#25D366')} <span class="num-tel">${esc(emeT.movil)}</span></span>` : '',
      emeT.casa ? `<span>🏠 <span class="num-tel">${esc(emeT.casa)}</span></span>` : '',
      emeT.trabajo ? `<span>💼 <span class="num-tel">${esc(emeT.trabajo)}</span></span>` : '',
    ].filter(Boolean).join('');
    const emeWa = emeT.movil ? `https://wa.me/${emeT.movil.replace(/\D/g, '')}` : '';

    const emergencia = (eme.nombre || emeT.movil || emeT.casa || emeT.trabajo)
      ? `<div class="persona persona-emergencia">
           <div class="persona-cab">
             <span class="persona-titulo">✚ Emergencia</span>
             <strong>${esc(eme.nombre || '—')}</strong>
           </div>
           <div class="persona-datos">
             ${emeFilas}
             ${eme.tipoSangre ? `<span>🩸 ${esc(eme.tipoSangre)}</span>` : ''}
             ${eme.relacion ? `<span>${esc(eme.relacion)}</span>` : ''}
           </div>
           ${emeWa ? `<div class="persona-acciones"><a class="boton boton-mini boton-wa" href="${esc(emeWa)}" target="_blank" rel="noopener">${iconoWhatsapp('#ffffff', 'icono-wa icono-boton')} WhatsApp</a></div>` : ''}
         </div>`
      : '';

    const nota = esAdmin && v.notaInterna
      ? `<div class="nota-interna">📝 ${esc(v.notaInterna)}</div>`
      : '';

    return `
      <article class="tarjeta-vivienda tipo-${esc(v.tipo)}">
        <header class="tv-cab">
          <div>
            <div class="tv-ubica">${esc(nombreDe(v.ubicaId))}</div>
            <h2 class="tv-dir">${esc(dirCorta(v))}</h2>
          </div>
          <div class="tv-badges">${badges.join('')}</div>
        </header>
        <div class="tv-contactos">${avisoVacante}${principal}${secundario}</div>
        ${integrantes}
        ${emergencia}
        ${nota}
      </article>`;
  }

  function aplicar() {
    const visibles = ordenadas.filter(concuerda);
    resumen.innerHTML = resumenHTML();
    lista.innerHTML = visibles.length
      ? visibles.map(tarjeta).join('')
      : `<div class="vacio">No hay viviendas que coincidan con la búsqueda.</div>`;
  }

  inputBusq.addEventListener('input', aplicar);
  selUbica.addEventListener('change', aplicar);
  selTipo.addEventListener('change', aplicar);
  aplicar();
}
