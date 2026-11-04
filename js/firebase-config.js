// ============================================================================
// QUENDA — Configuración de Firebase
//
// CÓMO CONECTAR TU PROYECTO:
// 1) Crea tu proyecto gratuito en https://console.firebase.google.com
// 2) En "Configuración del proyecto" → "Tus apps" → agrega una "App web"
// 3) Copia el objeto firebaseConfig que te muestra y PÉGALO AQUÍ,
//    reemplazando este objeto de ejemplo.
//
// Mientras apiKey tenga un valor de ejemplo (TU_API_KEY), QUENDA corre en
// MODO DEMOSTRACIÓN: los datos de ejemplo se guardan solo en este navegador.
//
// También tendrás que activar en tu proyecto:
//   - Authentication → método "Correo/contraseña"
//   - Firestore Database → crear en modo producción
// ============================================================================

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBK2sLQXN4Kn09gnd_uJn8KOn3UGseGwfw",
  authDomain: "quenda-app.firebaseapp.com",
  projectId: "quenda-app",
  storageBucket: "quenda-app.firebasestorage.app",
  messagingSenderId: "746097843163",
  appId: "1:746097843163:web:db8db0b00913501fbaa5fe",
  // ID de la base de datos Firestore de este proyecto. Se creó con el ID
  // "default" (no la especial "(default)"), y el SDK necesita saberlo.
  firestoreDatabaseId: "default",
};
