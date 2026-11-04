// ============================================================================
// QUENDA — Utilidades de interfaz
// Escape de texto, avisos flotantes (toast) y ventanas modales.
// ============================================================================

/** Escapa texto para insertarlo de forma segura dentro de HTML. */
export function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/** Muestra un aviso flotante temporal. tipo: 'ok' | 'info' | 'error' */
export function toast(mensaje, tipo = 'ok') {
  const contenedor = document.getElementById('contenedor-toast');
  if (!contenedor) { console.log(`[${tipo}] ${mensaje}`); return; }
  const t = document.createElement('div');
  t.className = `toast toast-${tipo}`;
  t.textContent = mensaje;
  contenedor.appendChild(t);
  setTimeout(() => t.classList.add('toast-out'), 2600);
  setTimeout(() => t.remove(), 3100);
}

/**
 * Abre una ventana modal y devuelve { pie, cerrar }.
 * - `pie` es la zona inferior donde el llamador agrega sus botones.
 * - `cerrar()` quita la modal de la pantalla.
 */
export function abrirModal({ titulo = '', contenido = null, ancho = 560 } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const tarjeta = document.createElement('div');
  tarjeta.className = 'modal';
  tarjeta.style.maxWidth = `${ancho}px`;

  const cabecera = document.createElement('div');
  cabecera.className = 'modal-cab';
  const h = document.createElement('h3');
  h.textContent = titulo;
  const btnCerrar = document.createElement('button');
  btnCerrar.className = 'modal-cerrar';
  btnCerrar.type = 'button';
  btnCerrar.setAttribute('aria-label', 'Cerrar');
  btnCerrar.textContent = '✕';
  cabecera.append(h, btnCerrar);

  const cuerpo = document.createElement('div');
  cuerpo.className = 'modal-cuerpo';
  if (contenido) cuerpo.appendChild(contenido);

  const pie = document.createElement('div');
  pie.className = 'modal-pie';

  tarjeta.append(cabecera, cuerpo, pie);
  overlay.appendChild(tarjeta);
  document.body.appendChild(overlay);

  const cerrar = () => overlay.remove();
  btnCerrar.addEventListener('click', cerrar);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrar(); });
  const enEscape = (e) => { if (e.key === 'Escape') { document.removeEventListener('keydown', enEscape); cerrar(); } };
  document.addEventListener('keydown', enEscape);

  return { pie, cerrar };
}

/** Ventana de confirmación. Resuelve true/false. */
export function confirmar(texto, { titulo = 'Confirmar', textoSi = 'Confirmar', textoNo = 'Cancelar' } = {}) {
  return new Promise((resolver) => {
    const contenido = document.createElement('div');
    contenido.className = 'texto-confirmar';
    contenido.textContent = texto;

    const { pie, cerrar } = abrirModal({ titulo, contenido, ancho: 420 });

    const btnNo = document.createElement('button');
    btnNo.type = 'button';
    btnNo.className = 'boton';
    btnNo.textContent = textoNo;
    btnNo.addEventListener('click', () => { cerrar(); resolver(false); });

    const btnSi = document.createElement('button');
    btnSi.type = 'button';
    btnSi.className = 'boton boton-peligro';
    btnSi.textContent = textoSi;
    btnSi.addEventListener('click', () => { cerrar(); resolver(true); });

    pie.append(btnNo, btnSi);
  });
}

/* ------------------------------------------------------------------ */
/* LOGO DE WHATSAPP (SVG oficial, inline)                              */
/* ------------------------------------------------------------------ */

/** Logo original de WhatsApp. color = relleno del glifo (verde de marca por defecto). */
export function iconoWhatsapp(color = '#25D366', clase = 'icono-wa') {
  return `<svg class="${clase}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="${color}" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
}
