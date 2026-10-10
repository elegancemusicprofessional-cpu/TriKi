/* =====================================================
   TriKi HUB - tasks.js
   Muro de tareas:
   - YouTube suscripción
   - Spotify playlist
   - YouTube like
   - Anuncios rápidos infinitos
   - Bono diario progresivo de 7 días
   ===================================================== */

(() => {
  if (!window.TriKi) {
    console.warn("TriKi: tasks.js necesita app.js primero.");
    return;
  }

  const VERIFY_WAIT_MS = 20000;
  const QUICK_AD_REWARD = 1000n
