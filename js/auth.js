// ============================================================================
// QUENDA — Pantalla de inicio de sesión
// Prepara el formulario de login y, en modo demostración, muestra las cuentas
// de prueba para que puedas entrar con un clic.
// ============================================================================

import { MODO, login, restablecerClave } from './db.js';
import { abrirModal } from './ui.js';

const CUENTAS_DEMO = [
  { correo: 'super@demo.com', etiqueta: 'Superadmin — ve todas las comunidades' },
  { correo: 'admin@demo.com', etiqueta: 'Administrador — maneja «Los Álamos»' },
  { correo: 'vecino@demo.com', etiqueta: 'Residente — solo consulta' },
];

export function montarLogin() {
  const form = document.getElementById('form-login');
  const inputCorreo = document.getElementById('l-correo');
  const inputClave = document.getElementById('l-clave');
  const mensaje = document.getElementById('login-mensaje');
  const boton = document.getElementById('login-enviar');
  const cajaDemo = document.getElementById('login-demo');
  const pie = document.getElementById('login-pie');

  if (MODO === 'demo') {
    cajaDemo.classList.remove('oculto');
    cajaDemo.innerHTML = `
      <strong>Modo demostración</strong>
      <span>Conecta tu Firebase siguiendo <code>README-QUENDA.md</code> para usar datos reales.</span>
      <div class="demo-cuentas"></div>`;
    const lista = cajaDemo.querySelector('.demo-cuentas');
    CUENTAS_DEMO.forEach((c) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'demo-cuenta';
      btn.innerHTML = `<strong>${c.correo}</strong><span>${c.etiqueta}</span>`;
      btn.addEventListener('click', () => {
        inputCorreo.value = c.correo;
        inputClave.value = '123456';
        form.requestSubmit();
      });
      lista.appendChild(btn);
    });
    pie.textContent = 'MODO DEMO — datos de ejemplo guardados solo en este navegador';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensaje.textContent = '';
    mensaje.className = 'texto-error';
    boton.disabled = true;
    boton.textContent = 'Ingresando…';
    try {
      await login(inputCorreo.value, inputClave.value);
      // El oyente de sesión (app.js) se encarga de mostrar la app.
    } catch (err) {
      mensaje.textContent = err.message || 'No se pudo iniciar sesión.';
    } finally {
      boton.disabled = false;
      boton.textContent = 'Ingresar';
    }
  });

  /* -------- ¿Olvidaste tu clave? → restablecimiento por correo -------- */

  document.getElementById('btn-olvide-clave').addEventListener('click', () => {
    abrirRestablecerClave(inputCorreo, mensaje);
  });
}

function abrirRestablecerClave(inputCorreo, mensajeLogin) {
  const contenido = document.createElement('div');
  contenido.className = 'form-grid';
  contenido.innerHTML = `
    <div class="campo campo-ancho">
      <label>Tu correo de acceso</label>
      <input id="fr-correo" type="email" autocomplete="email" placeholder="tu@correo.com" value="${inputCorreo.value.replace(/"/g, '')}">
      <small class="texto-suave">Te enviaremos un enlace para crear una clave nueva. Revisa también tu carpeta de spam.</small>
      <small id="fr-error" class="texto-error"></small>
    </div>`;

  const { pie, cerrar } = abrirModal({ titulo: 'Reestablecer clave de acceso', contenido, ancho: 420 });

  const btnCancelar = document.createElement('button');
  btnCancelar.type = 'button';
  btnCancelar.className = 'boton';
  btnCancelar.textContent = 'Cancelar';
  btnCancelar.addEventListener('click', cerrar);

  const btnEnviar = document.createElement('button');
  btnEnviar.type = 'button';
  btnEnviar.className = 'boton boton-primario';
  btnEnviar.textContent = 'Enviar enlace';
  btnEnviar.addEventListener('click', async () => {
    const correo = contenido.querySelector('#fr-correo').value.trim();
    const errorEl = contenido.querySelector('#fr-error');
    errorEl.textContent = '';
    btnEnviar.disabled = true;
    try {
      await restablecerClave(correo);
      cerrar();
      mensajeLogin.textContent = `📩 Te enviamos un enlace a ${correo} para crear tu clave nueva.`;
      mensajeLogin.className = 'texto-ok';
    } catch (err) {
      errorEl.textContent = err.message || 'No se pudo enviar el enlace.';
      btnEnviar.disabled = false;
    }
  });

  pie.append(btnCancelar, btnEnviar);
  contenido.querySelector('#fr-correo').focus();
}
