# QUENDA — Directorio Telefónico Residencial

App web multi-comunidad para la administración de directorios telefónicos de
residenciales: propietarios, inquilinos (casas en renta), integrantes del hogar
y contactos de emergencia.

- **Tecnología:** HTML + CSS + JavaScript (vanilla) con Firebase (Auth + Firestore).
- **Roles:** superadministrador, administrador de comunidad, residente (solo consulta).

---

## ✅ Estado de la Fase 1 (MVP) — LISTA Y PROBADA

Verificada de punta a punta en el navegador con Firebase real:
login de los 3 roles, creación de comunidad, calles, viviendas (incluida una
en renta con inquilino), cuentas de admin y residente, directorio con filtros
y aislamiento de permisos (el residente no ve notas internas ni administración).

- [x] Login con correo/clave y roles
- [x] Panel de comunidades (solo superadmin)
- [x] Estructura configurable por comunidad (calles con casas o torres con apartamentos)
- [x] Viviendas con propietario, inquilino (en renta), integrantes, emergencia, notas internas
- [x] **Hasta 3 teléfonos por persona (casa, trabajo, móvil)** con **selector de código de país** (~180 países, +52 México predeterminado) y aviso suave de dígitos esperados
- [x] **Hasta 2 correos por persona** (propietario e inquilino: correo + segundo correo)
- [x] **Regla de guardado**: la persona principal (inquilino si hay renta con inquilino; si no, propietario) necesita **al menos un teléfono y un correo** para guardar
- [x] **Directorio de solo lectura**: los números son texto fijo (sin enlaces ni botón "Llamar"); botón verde de **WhatsApp** (logo oficial) solo cuando hay móvil, y botón de Correo
- [x] **Logo QUENDA** (PNG oficial con transparencia) en login, menú y favicon + crédito «Diseñada por Quenda»
- [x] **Logo propio del residencial** (URL de imagen) en el menú y cabecera del directorio
- [x] **Segundo administrador**: un admin puede crear más admins de su propia comunidad
- [x] **Editar cuentas (✏️)**: superadmin edita nombre, rol y comunidad de cualquiera; el admin edita las de su comunidad (solo nombre). Nadie cambia su propio rol
- [x] **Reestablecer mi clave de acceso (🔑)**: cada persona cambia su propia clave desde el menú (confirmando la actual); claves temporales ya no dependen del superadmin
- [x] **Exportación / respaldos**: directorio en CSV (Excel) y respaldo completo en JSON
- [x] Directorio con búsqueda y filtros
- [x] Reglas de seguridad de Firestore (cada comunidad ve solo lo suyo)

> ⚠️ **Pendiente puntual:** para que un administrador pueda crear otro
> administrador hay que publicar las reglas actualizadas de `firestore.rules`
> (Console → Firestore → Seguridad). Todo lo demás funciona con las reglas ya
> publicadas.

## 📦 Exportación y respaldos

En **Viviendas** (administración): botones **⬇️ CSV** y **🗄️ Respaldo**.

- **CSV** — el directorio completo para Excel (25 columnas: dirección, estado,
  propietario con sus 3 teléfonos y 2 correos, inquilino, emergencia,
  integrantes, notas). Con BOM UTF-8 para que las tildes se vean bien.
- **JSON** — respaldo de alta fidelidad de la comunidad: comunidad, estructura,
  todas las viviendas (normalizadas, activas e inactivas) y las cuentas
  (sin claves: Firebase Auth nunca las expone).

En **Comunidades** (superadmin): botón **🗄️ Respaldo total** — descarga TODAS
las comunidades en un solo JSON, pensado para respaldar la plataforma completa
(por ejemplo, si un cliente deja el servicio y se lleva sus datos).

Nombre de archivo con fecha: `respaldo-residencial-los-aromos-2026-10-28.json`.

> 💡 Recomendación: descarga un respaldo JSON periódico (semanal) y guárdalo
> fuera de la nube. Si algún día se necesita restaurar o migrar, el JSON
> contiene todo lo necesario (se puede construir el importador cuando se requiera).

**Fases siguientes (trazado en `QUENDA-trazado.md`):** Fase 2 (importación CSV,
avisos, PDF) y Fase 3 (solicitudes de cambio de los residentes).

---

## 🔑 Cuentas actuales (Firebase: proyecto `quenda-app`)

| Rol | Correo | Clave inicial |
|---|---|---|
| Superadmin | `jrsantiagop@gmail.com` | `Quenda2026*` |
| Administración (prueba) | `ana.torres@testquenda.com` | `Admin2026*` |
| Residente (prueba) | `maria.gonzalez@testquenda.com` | `Residente2026*` |

> ⚠️ Cambia la clave del superadmin después del primer ingreso. Las dos cuentas
> de prueba (`testquenda.com`) son datos de demostración: puedes borrarlas
> desde la app (Usuarios) y en Authentication cuando quieras.

> 🔑 **Claves y autocompletado:** en la pantalla de login hay
> **«¿Olvidaste tu clave de acceso?»** — pide el correo y Firebase envía un
> enlace para crear una clave nueva (no hace falta estar dentro de la app; por
> seguridad Firebase confirma el envío aunque el correo esté mal escrito:
> si nunca llega, revisa cómo se escribió). Con la sesión abierta, cada
> persona también puede cambiar su clave con «🔑 Reestablecer mi clave de
> acceso» (menú lateral, pide la clave actual). Para que el navegador recuerde
> correo y clave, acepta la burbuja «Guardar contraseña» que ofrece
> Chrome/Edge al ingresar (el formulario ya usa `autocomplete="username"` y
> `current-password`). La sesión queda abierta entre visitas (Firebase la
> persiste); «Cerrar sesión» la corta a propósito.
> 💡 El correo de restablecimiento llega en español (Firebase envía su
> plantilla oficial traducida, gracias a `auth.languageCode = 'es'` en
> `db.js`). Personalizar aún más el texto desde Firebase Console →
> Authentication → Templates está temporalmente bloqueado por un error
> conocido de Google (EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED) que no depende del
> proyecto; si más adelante se corrige, ahí se puede ajustar el texto.

**Datos de prueba ya creados:** comunidad «Residencial Los Aromos» (calles con
casas), 2 calles (Los Aromos, Los Fresnos), 2 viviendas (una propia y una
EN RENTA con inquilino) y las cuentas de arriba.

---

## ⚙️ Detalle técnico importante: ID de la base de datos

La base de datos Firestore de este proyecto quedó creada con el ID **`default`**
(no la especial `(default)`). Por eso `js/firebase-config.js` incluye
`firestoreDatabaseId: "default"` y `js/db.js` la pasa al SDK. Si algún día
eliminas la base y la creas de nuevo con el ID estándar `(default)`, borra esa
línea de configuración y todo seguirá funcionando.

---

## 🖥️ Cómo probar en tu computadora

Firebase **no funciona** abriendo el archivo con doble clic (`file://`).
Necesitas un mini-servidor local.

**Opción A — sin instalar nada (recomendada en este equipo):**

```powershell
# clic derecho sobre el archivo → "Ejecutar con PowerShell"
.\servidor-local.ps1
```

Abre `http://localhost:8322/`. El script sirve la carpeta del proyecto en el
puerto 8322 (`localhost` ya está autorizado en Firebase).

**Opción B (con Node.js):**

```bash
cd quenda
npx serve .
```

**Opción C (con Python):**

```bash
cd quenda
python -m http.server 8080
```

### Flujo de prueba sugerido
1. Entra con `jrsantiagop@gmail.com` / `Quenda2026*`.
2. Crea una comunidad (ej: tu residencial) y elige calles o torres.
3. Pulsa **Administrar** → configura las calles/torres en la sección Estructura.
4. Crea viviendas en la sección Viviendas (prueba marcar una "En renta").
5. Crea una cuenta de admin para esa comunidad (Usuarios) y prueba entrando en
   otra pestaña/ventana incógnito.
6. Crea una cuenta de residente y comprueba que solo puede ver su comunidad.

---

## ☁️ Subida a tu hosting (cPanel)

1. En Firebase Console → **Authentication → Configuración → Dominios autorizados**
   → agrega tu dominio (ej: `directorio.tudominio.cl`). Sin esto, el login fallará.
2. Comprime la carpeta `quenda/` y súbela por el Administrador de archivos de
   cPanel a `public_html/` (o a una subcarpeta, ej: `public_html/quenda/`).
   Debe quedar `index.html` accesible por HTTPS.
3. Asegúrate de que el dominio tenga **SSL/HTTPS activo** (requisito de Firebase).
4. Ingresa a `https://tu-dominio/quenda/` y entra con el superadmin.

---

## 📁 Estructura del proyecto

```
servidor-local.ps1            Servidor local de prueba (PowerShell, puerto 8322)
quenda/
├── index.html                  Pantalla única (login + app)
├── img/
│   ├── quenda-isotipo.png      Marca Q de QUENDA (menú, favicon) — PNG oficial con transparencia
│   └── quenda-logo.png         Logo completo (login) — PNG oficial con transparencia
├── css/
│   ├── base.css                Tema, layout, menú, login
│   └── componentes.css         Botones, tarjetas, modales, toasts
├── js/
│   ├── firebase-config.js      Config de Firebase (+ firestoreDatabaseId)
│   ├── db.js                   Capa de datos: Firebase + modo demostración
│   ├── estado.js               Estado compartido (usuario, comunidad activa)
│   ├── ui.js                   Toasts, modales, utilidades, logo WhatsApp SVG
│   ├── paises.js               Países, códigos telefónicos y aviso de dígitos
│   ├── auth.js                 Pantalla de login
│   ├── app.js                  Enrutado, menú, permisos, tema
│   └── paginas/
│       ├── comunidades.js      Panel de comunidades (superadmin)
│       ├── directorio.js       Directorio con búsqueda/filtros
│       ├── viviendas.js        CRUD de viviendas (con inquilinos)
│       ├── estructura.js       Calles / torres
│       └── usuarios.js         Cuentas de admin y residentes
└── firestore.rules             Copia de las reglas publicadas
```

---

## 🔒 Seguridad implementada

- Reglas de Firestore: nadie lee ni escribe sin sesión válida **con perfil**;
  cada rol solo accede a su comunidad (ver `firestore.rules`).
- Un administrador puede crear residentes **y otros administradores de su
  propia comunidad**; el superadmin puede crear cualquier cuenta.
- La apiKey de Firebase es pública por diseño; la seguridad real está en las reglas.
- Notas internas de las viviendas solo se muestran a la administración.

## 📇 Modelo de teléfonos y correos

Cada persona (propietario, inquilino, contacto de emergencia) admite hasta 3
números: `telefonos: { casa, trabajo, movil }` y, propietario e inquilino,
hasta 2 correos: `correo` y `correo2`. El campo antiguo `telefono` sigue
aceptándose y se migra automáticamente a "móvil" al leerse.

**En el formulario** cada teléfono tiene un selector de código de país
(`js/paises.js`, ~180 países, México +52 predeterminado y fijo arriba, con
grupo "Los más comunes"). Si el número no coincide con la cantidad de dígitos
del país (ej. México = 10), aparece un **aviso amarillo** que no impide
guardar. Los valores guardados quedan como `+52 55 1234 5678`; los antiguos
sin código se conservan con la opción "(sin código)".

**Regla de guardado:** la persona principal (el inquilino si la vivienda está
"En renta" con inquilino nombrado; si no, el propietario) debe tener **al
menos un teléfono** de los tres **y al menos un correo**; si falta algo, el
guardado se bloquea con un aviso y el foco va al campo correspondiente.

**En el directorio** los números son texto fijo (no enlaces `tel:` ni botón
"Llamar"). El móvil muestra el logo oficial de WhatsApp y, si la persona tiene
móvil, aparece el botón verde de WhatsApp (`wa.me`) con el logo original;
después el botón de Correo (mailto con el correo principal). Los dos correos
se muestran como texto. El contacto de emergencia recibe el mismo tratamiento.

## 📌 Pendientes conocidos

- Fase 2: importación Excel/CSV, avisos, PDF.
- Fase 3: solicitudes de cambio desde el residente.
