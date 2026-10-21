/* ============ TRIKI - CONFIGURACIÓN CENTRAL (códigos y enlaces) ============ */
window.TRIKI_CONFIG = {
  adsgram: {
    sdk: 'https://sdk.adsgram.ai/js/sdk.js',
    rewarded: '52934',        // Videos de 30 sec (anuncio recompensado)
    banner: 'task-52935',     // Banner
    bloqueMusica: '8061d2e4'  // Bloque del reproductor
  },
  monetag: {
    zoneRewarded: '11992190', // Rewarded interstitial (show_11992190)
    banner: '3524750'         // Banner
  },
  enlaces: {
    youtube: 'https://www.youtube.com/@JimmyPrince1',
    spotify: 'https://open.spotify.com/artist/0IOIIVpbuIqiAjIqpWLA2Q?si=ikG8WtCqTO2XHLSdnzZCmw&utm_source=copy-link',
    video1: 'IFSXiHp319o',    // ID del video 1 (like / ver 30s)
    video2: '_8zWDLHf_rw',    // ID del video 2 (like)
    telegram: ''              // pendiente: URL de tu canal oficial
  },
  recompensas: {
    clicAnuncio: 1000,        // +1k por clic en botón de anuncio
    bannerAbajo: 10,          // +10 por cada banner que rota abajo
    seguirCanal: 10000,       // +10k seguir YouTube/Spotify (aprobación tuya)
    likeVideo: 5000,          // +5k like (aprobación tuya)
    verVideo30: 5000,         // +5k ver 30s de video (automático)
    diaria: [1000,2000,3000,4000,5000,6000,7000]
  }
};
