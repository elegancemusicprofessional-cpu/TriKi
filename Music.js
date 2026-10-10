(() => {
  "use strict";

  // Evitar doble inicialización
  if (window.__TRIKI_MUSIC_LOADED__) return;
  window.__TRIKI_MUSIC_LOADED__ = true;

  /* ==========================================================
     CONFIGURACIÓN GENERAL
     ========================================================== */

  const CONFIG = {
    rewardAmount: 100,
    rewardedAdDurationMs: 30000,
    rewardCooldownMs: 28000,

    // Recompensa cuando termina una canción
    rewardedOnTrackEnd: true,

    // Recompensa cuando el usuario pulsa siguiente/anterior manualmente
    // Si te parece molesto, puedes ponerlo en false.
    rewardedOnManualChange: true,

    storageKey: "triki_balance",

    adScripts: {
      adsgram: {
        enabled: false,

        // Aquí debes pegar el script oficial que te genera tu panel de Adsgram.
        // No existe un CDN universal público; el script se genera desde tu cuenta.
        sdkSrc: "",

        bannerBlockId: "",
        rewardedBlockId: ""
      },

      monetag: {
        enabled: false,

        // Aquí debes pegar el script oficial que te genera tu panel de Monetag.
        sdkSrc: "",

        rewardedZoneId: "",
        bannerZoneId: ""
      }
    },

    docs: {
      adsgram: "https://adsgram.ai/",
      monetag: "https://www.monetag.com/"
    }
  };

  /* ==========================================================
     PLAYLIST DEMO
     Puedes reemplazar estas pistas por tus audios reales.
     ========================================================== */

  const PLAYLIST = [
    {
      title: "Neon Nights",
      artist: "TriKi Radio · Synthwave",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      artwork: "https://picsum.photos/seed/triki-neon/512"
    },
    {
      title: "Cyber Drive",
      artist: "TriKi Radio · Electro",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      artwork: "https://picsum.photos/seed/triki-cyber/512"
    },
    {
      title: "Midnight Pulse",
      artist: "TriKi Radio · Chill",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      artwork: "https://picsum.photos/seed/triki-midnight/512"
    }
  ];

  /* ==========================================================
     ESTADO
     ========================================================== */

  const state = {
    currentIndex: 0,
    isPlaying: false,
    rewardInProgress: false,
    lastRewardAt: 0,
    positionStateThrottle: 0
  };

  let audio = null;
  let wakeLock = null;

  /* ==========================================================
     DOM
     ========================================================== */

  const DOM = {};

  function cacheDom() {
    DOM.playBtn = document.querySelector(".ctrl-main");
    DOM.prevBtn = document.querySelector(".player-controls .ctrl:nth-child(1)");
    DOM.nextBtn = document.querySelector(".player-controls .ctrl:nth-child(3)");

    DOM.progressLine = document.querySelector(".progress-line");
    DOM.progressCurrent = document.querySelector(".progress-current");

    DOM.times = document.querySelectorAll(".player-times span");
    DOM.title = document.querySelector(".track-title");
    DOM.artist = document.querySelector(".track-artist");
    DOM.disc = document.querySelector(".disc");
    DOM.balance = document.getElementById("user-balance");
  }

  /* ==========================================================
     ICONOS DEL BOTÓN PLAY / PAUSE
     ========================================================== */

  const PLAY_SVG = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14l11-7z"></path>
    </svg>
  `;

  const PAUSE_SVG = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5h3v14H7z"></path>
      <path d="M14 5h3v14h-3z"></path>
    </svg>
  `;

  /* ==========================================================
     INICIALIZACIÓN
     ========================================================== */

  function init() {
    cacheDom();

    if (!DOM.playBtn) {
      console.warn("TriKi Music: no se encontraron controles del reproductor.");
      return;
    }

    createAudioElement();
    bindEvents();
    injectRewardStyles();

    renderTrack(state.currentIndex);
    updatePlayButton();
    setDiscPlaying(false);

    updateBalanceUI(getBalance());
    setupMediaSession();
    loadAdScripts();

    console.info("TriKi Music iniciado correctamente.");
  }

  function createAudioElement() {
    audio = new Audio();
    audio.preload = "metadata";

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onTrackEnded);
    audio.addEventListener("play", onAudioPlay);
    audio.addEventListener("pause", onAudioPause);
    audio.addEventListener("error", onAudioError);
  }

  function bindEvents() {
    DOM.playBtn.addEventListener("click", togglePlay);
    DOM.prevBtn.addEventListener("click", userPrev);
    DOM.nextBtn.addEventListener("click", userNext);

    if (DOM.progressLine) {
      DOM.progressLine.addEventListener("click", onSeek);
    }
  }

  /* ==========================================================
     RENDER DE PISTA
     ========================================================== */

  function renderTrack(index) {
    const track = PLAYLIST[index];
    if (!track) return;

    state.currentIndex = index;

    if (audio) {
      audio.src = track.src;
      audio.load();
    }

    if (DOM.title) DOM.title.textContent = track.title;
    if (DOM.artist) DOM.artist.textContent = track.artist;

    resetProgressUI();
    updateMediaMetadata(track);
  }

  function resetProgressUI() {
    if (DOM.progressCurrent) {
      DOM.progressCurrent.style.width = "0%";
    }

    if (DOM.times && DOM.times.length >= 2) {
      DOM.times[0].textContent = "0:00";
      DOM.times[1].textContent = "0:00";
    }
  }

  /* ==========================================================
     CONTROLES BÁSICOS
     ========================================================== */

  async function play() {
    if (!audio) return;

    try {
      await audio.play();
    } catch (error) {
      console.warn("TriKi Music: autoplay bloqueado o error de reproducción.", error);
      showToast("Toca nuevamente para reproducir");
    }
  }

  function pause() {
    if (!audio) return;
    audio.pause();
  }

  function togglePlay() {
    if (!audio) return;

    if (audio.paused) {
      play();
    } else {
      pause();
    }
  }

  async function userNext() {
    await changeTrack(1, { manual: true, autoPlay: true });
  }

  async function userPrev() {
    // Si la canción ya avanzó más de 3 segundos, volver al inicio.
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    await changeTrack(-1, { manual: true, autoPlay: true });
  }

  async function changeTrack(direction, options = {}) {
    const {
      manual = false,
      autoPlay = true
    } = options;

    if (state.rewardInProgress) return;

    const shouldReward = manual
      ? CONFIG.rewardedOnManualChange
      : CONFIG.rewardedOnTrackEnd;

    if (shouldReward) {
      await triggerRewardedAd({
        reason: manual ? "manual_track_change" : "track_end"
      });
    }

    const nextIndex =
      (state.currentIndex + direction + PLAYLIST.length) % PLAYLIST.length;

    renderTrack(nextIndex);

    if (autoPlay) {
      await play();
    }
  }

  function onTrackEnded() {
    changeTrack(1, {
      manual: false,
      autoPlay: true
    });
  }

  /* ==========================================================
     UI DEL REPRODUCTOR
     ========================================================== */

  function onAudioPlay() {
    state.isPlaying = true;
    updatePlayButton();
    setDiscPlaying(true);
    setMediaPlaybackState("playing");
    requestWakeLock();
  }

  function onAudioPause() {
    state.isPlaying = false;
    updatePlayButton();
    setDiscPlaying(false);
    setMediaPlaybackState("paused");
    releaseWakeLock();
  }

  function onAudioError() {
    console.error("TriKi Music: error cargando la pista de audio.");
    showToast("No se pudo cargar la pista");
  }

  function updatePlayButton() {
    if (!DOM.playBtn) return;

    DOM.playBtn.innerHTML = state.isPlaying ? PAUSE_SVG : PLAY_SVG;
    DOM.playBtn.setAttribute(
      "aria-label",
      state.isPlaying ? "Pausar" : "Reproducir"
    );
  }

  function setDiscPlaying(isPlaying) {
    if (!DOM.disc) return;
    DOM.disc.style.animationPlayState = isPlaying ? "running" : "paused";
  }

  function onTimeUpdate() {
    if (!audio) return;

    const duration = audio.duration || 0;
    const current = audio.currentTime || 0;

    if (DOM.progressCurrent && duration > 0) {
      const percent = (current / duration) * 100;
      DOM.progressCurrent.style.width = `${percent}%`;
    }

    if (DOM.times && DOM.times.length >= 1) {
      DOM.times[0].textContent = formatTime(current);
    }

    updateMediaPosition();
  }

  function onLoadedMetadata() {
    if (!audio) return;

    if (DOM.times && DOM.times.length >= 2) {
      DOM.times[1].textContent = formatTime(audio.duration);
    }

    updateMediaPosition();
  }

  function onSeek(event) {
    if (!audio || !audio.duration || !DOM.progressLine) return;

    const rect = DOM.progressLine.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;

    let ratio = (clientX - rect.left) / rect.width;
    ratio = Math.min(Math.max(ratio, 0), 1);

    audio.currentTime = ratio * audio.duration;
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  /* ==========================================================
     MEDIA SESSION
     Reproducción continua / pantalla de bloqueo
     ========================================================== */

  function setupMediaSession() {
    if (!("mediaSession" in navigator)) {
      console.info("TriKi Music: Media Session no disponible en este navegador.");
      return;
    }

    try {
      navigator.mediaSession.setActionHandler("play", play);
      navigator.mediaSession.setActionHandler("pause", pause);
      navigator.mediaSession.setActionHandler("previoustrack", userPrev);
      navigator.mediaSession.setActionHandler("nexttrack", userNext);

      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (!audio) return;

        if (details.seekTime != null) {
          audio.currentTime = details.seekTime;
        }
      });
    } catch (error) {
      console.warn("TriKi Music: error configurando Media Session.", error);
    }
  }

  function updateMediaMetadata(track) {
    if (!("mediaSession" in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: "TriKi HUB",
        artwork: [
          {
            src: track.artwork,
            sizes: "512x512",
            type: "image/jpeg"
          }
        ]
      });
    } catch (error) {
      console.warn("TriKi Music: error actualizando MediaMetadata.", error);
    }
  }

  function setMediaPlaybackState(playbackState) {
    if (!("mediaSession" in navigator)) return;

    try {
      navigator.mediaSession.playbackState = playbackState;
    } catch (error) {
      console.warn("TriKi Music: error cambiando playbackState.", error);
    }
  }

  function updateMediaPosition() {
    if (!("mediaSession" in navigator)) return;
    if (!navigator.mediaSession.setPositionState) return;
    if (!audio || !Number.isFinite(audio.duration)) return;

    const now = Date.now();

    if (now - state.positionStateThrottle < 1000) return;
    state.positionStateThrottle = now;

    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate,
        position: Math.min(audio.currentTime, audio.duration)
      });
    } catch (error) {
      console.warn("TriKi Music: error actualizando posición multimedia.", error);
    }
  }

  /* ==========================================================
     WAKE LOCK
     Ayuda a mantener reproducción activa mientras la app está visible.
     No garantiza reproducción con pantalla apagada en todos los dispositivos.
     ========================================================== */

  async function requestWakeLock() {
    if (!("wakeLock" in navigator)) return;

    try {
      wakeLock = await navigator.wakeLock.request("screen");

      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
    } catch (error) {
      console.warn("TriKi Music: no se pudo obtener Wake Lock.", error);
    }
  }

  function releaseWakeLock() {
    if (!wakeLock) return;

    wakeLock.release().catch(() => {});
    wakeLock = null;
  }

  /* ==========================================================
     SALDO TRIKICOINS
     ========================================================== */

  function getBalance() {
    try {
      const raw = localStorage.getItem(CONFIG.storageKey);
      const parsed = parseInt(raw || "0", 10);
      return Number.isFinite(parsed) ? parsed : 0;
    } catch {
      return 0;
    }
  }

  function addCoins(amount, reason = "reward") {
    const newBalance = getBalance() + amount;

    try {
      localStorage.setItem(CONFIG.storageKey, String(newBalance));
    } catch (error) {
      console.warn("TriKi Music: no se pudo guardar el saldo local.", error);
    }

    updateBalanceUI(newBalance);
    triggerSuccessHaptic();

    showToast(`+${amount} TriKiCoins 🪙`);

    // Evento global para que app.js o backend lo escuchen
    window.dispatchEvent(
      new CustomEvent("triki:coins-added", {
        detail: {
          amount,
          reason,
          balance: newBalance
        }
      })
    );
  }

  function updateBalanceUI(balance) {
    if (DOM.balance) {
      DOM.balance.textContent = formatNumber(balance);
    }
  }

  function formatNumber(value) {
    try {
      return new Intl.NumberFormat("es").format(value);
    } catch {
      return String(value);
    }
  }

  function triggerSuccessHaptic() {
    const tg = window.Telegram?.WebApp;

    if (tg?.HapticFeedback) {
      try {
        tg.HapticFeedback.notificationOccurred("success");
      } catch {
        // Ignorar
      }
    }
  }

  /* ==========================================================
     ANUNCIO RECOMPENSADO
     ========================================================== */

  async function triggerRewardedAd({ reason = "ad" } = {}) {
    if (state.rewardInProgress) {
      return false;
    }

    const now = Date.now();

    if (now - state.lastRewardAt < CONFIG.rewardCooldownMs) {
      console.info("TriKi Music: recompensa en cooldown.");
      return false;
    }

    state.rewardInProgress = true;

    let completed = false;

    try {
      if (
        CONFIG.adScripts.adsgram.enabled &&
        typeof window.TrikiAdsgramRewarded === "function"
      ) {
        completed = await window.TrikiAdsgramRewarded();
      } else if (
        CONFIG.adScripts.monetag.enabled &&
        typeof window.TrikiMonetagRewarded === "function"
      ) {
        completed = await window.TrikiMonetagRewarded();
      } else {
        completed = await simulateRewardedAd();
      }

      if (completed) {
        state.lastRewardAt = Date.now();
        addCoins(CONFIG.rewardAmount, reason);
      }
    } catch (error) {
      console.error("TriKi Music: error en anuncio recompensado.", error);
      completed = false;
    } finally {
      state.rewardInProgress = false;
    }

    return completed;
  }

  /* ==========================================================
     SIMULACIÓN LOCAL DE ANUNCIO RECOMPENSADO
     Útil para pruebas antes de conectar Adsgram o Monetag.
     ========================================================== */

  function simulateRewardedAd() {
    return new Promise((resolve) => {
      injectRewardStyles();

      const overlay = createRewardOverlay();
      const countEl = overlay.querySelector("#triki-reward-count");
      const fillEl = overlay.querySelector("#triki-reward-fill");
      const cancelBtn = overlay.querySelector("#triki-reward-cancel");

      const totalSeconds = Math.ceil(CONFIG.rewardedAdDurationMs / 1000);
      let secondsLeft = totalSeconds;
      let finished = false;

      const interval = setInterval(() => {
        secondsLeft -= 1;

        if (countEl) {
          countEl.textContent = secondsLeft;
        }

        if (fillEl) {
          const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
          fillEl.style.width = `${progress}%`;
        }

        if (secondsLeft <= 0) {
          finish(true);
        }
      }, 1000);

      function finish(result) {
        if (finished) return;
        finished = true;

        clearInterval(interval);
        overlay.remove();
        resolve(result);
      }

      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
          finish(false);
        });
      }
    });
  }

  function createRewardOverlay() {
    const existing = document.querySelector(".triki-reward-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "triki-reward-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    overlay.innerHTML = `
      <div class="triki-reward-card">
        <div class="triki-reward-icon">🎁</div>
        <h3 class="triki-reward-title">Anuncio recompensado</h3>
        <p class="triki-reward-text">
          Espera <strong id="triki-reward-count">30</strong> segundos
          para ganar <strong>+${CONFIG.rewardAmount} TriKiCoins 🪙</strong>.
        </p>

        <div class="triki-reward-progress">
          <span class="triki-reward-fill" id="triki-reward-fill"></span>
        </div>

        <button type="button" class="triki-btn ghost" id="triki-reward-cancel">
          Cancelar
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  function injectRewardStyles() {
    if (document.getElementById("triki-music-styles")) return;

    const style = document.createElement("style");
    style.id = "triki-music-styles";

    style.textContent = `
      .triki-reward-overlay {
        position: fixed;
        inset: 0;
        z-index: 2500;
        display: grid;
        place-items: center;
        padding: 20px;
        background: rgba(5, 3, 8, 0.78);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
      }

      .triki-reward-card {
        width: min(92vw, 360px);
        padding: 22px;
        border-radius: 24px;
        text-align: center;
        background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.05));
        border: 1px solid rgba(255,255,255,0.14);
        box-shadow: 0 24px 80px rgba(0,0,0,0.45);
      }

      .triki-reward-icon {
        font-size: 42px;
        margin-bottom: 10px;
      }

      .triki-reward-title {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: 900;
      }

      .triki-reward-text {
        margin: 0 0 16px;
        color: rgba(255,255,255,0.72);
        font-size: 14px;
        line-height: 1.5;
      }

      .triki-reward-progress {
        height: 8px;
        border-radius: 999px;
        overflow: hidden;
        background: rgba(255,255,255,0.08);
        margin-bottom: 16px;
      }

      .triki-reward-fill {
        display: block;
        height: 100%;
        width: 0%;
        border-radius: 999px;
        background: linear-gradient(90deg, #00f0ff, #b026ff, #ff267a);
        box-shadow: 0 0 18px rgba(0,240,255,0.35);
        transition: width 0.35s ease;
      }

      .triki-btn {
        min-height: 44px;
        padding: 12px 16px;
        border-radius: 16px;
        font-weight: 800;
        border: none;
      }

      .triki-btn.ghost {
        background: rgba(255,255,255,0.07);
        border: 1px solid rgba(255,255,255,0.09);
        color: rgba(255,255,255,0.78);
      }

      .triki-toast {
        position: fixed;
        left: 50%;
        transform: translateX(-50%) translateY(18px);
        bottom: calc(118px + env(safe-area-inset-bottom, 0px));
        z-index: 3000;
        padding: 12px 16px;
        border-radius: 999px;
        background: rgba(255,255,255,0.10);
        border: 1px solid rgba(255,255,255,0.16);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        box-shadow: 0 18px 40px rgba(0,0,0,0.35);
        opacity: 0;
        transition: 0.3s ease;
        font-weight: 800;
        pointer-events: none;
      }

      .triki-toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    `;

    document.head.appendChild(style);
  }

  /* ==========================================================
     TOAST
     ========================================================== */

  function showToast(message) {
    const existing = document.querySelector(".triki-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "triki-toast";
    toast.textContent = message;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 2200);
  }

  /* ==========================================================
     PUBLICIDAD - ADSGRAM Y MONETAG
     ========================================================== */

  function loadAdScripts() {
    const { adsgram, monetag } = CONFIG.adScripts;

    if (adsgram.enabled && adsgram.sdkSrc) {
      injectScript(adsgram.sdkSrc, () => {
        console.info("TriKi Music: Adsgram cargado.");
        initAdsgram();
      });
    } else {
      console.info(
        `TriKi Music: Adsgram desactivado. Panel oficial: ${CONFIG.docs.adsgram}`
      );
    }

    if (monetag.enabled && monetag.sdkSrc) {
      injectScript(monetag.sdkSrc, () => {
        console.info("TriKi Music: Monetag cargado.");
        initMonetag();
      });
    } else {
      console.info(
        `TriKi Music: Monetag desactivado. Panel oficial: ${CONFIG.docs.monetag}`
      );
    }
  }

  function injectScript(src, onload) {
    if (!src) return;

    if (document.querySelector(`script[src="${src}"]`)) {
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;

    if (typeof onload === "function") {
      script.onload = onload;
    }

    script.onerror = () => {
      console.warn("TriKi Music: no se pudo cargar el script publicitario.", src);
    };

    document.head.appendChild(script);
  }

  function initAdsgram() {
    // IMPORTANTE:
    // Reemplaza esto por la inicialización oficial que te entregue Adsgram.
    // Normalmente deberás usar tu blockId generado desde el panel.

    console.info("TriKi Music: inicializando Adsgram (placeholder).");

    // Ejemplo ficticio:
    // if (window.Adsgram) {
    //   window.Adsgram.init({
    //     blockId: CONFIG.adScripts.adsgram.bannerBlockId
    //   });
    // }
  }

  function initMonetag() {
    // IMPORTANTE:
    // Reemplaza esto por la inicialización oficial que te entregue Monetag.

    console.info("TriKi Music: inicializando Monetag (placeholder).");
  }

  /* ==========================================================
     WRAPPERS PARA ANUNCIOS RECOMPENSADOS
     ========================================================== */

  window.TrikiAdsgramRewarded = function () {
    return new Promise((resolve) => {
      /*
        IMPORTANTE:
        Aquí debes reemplazar la simulación por la llamada oficial de Adsgram.

        Ejemplo ficticio:

        if (window.Adsgram && typeof window.Adsgram.showRewarded === "function") {
          window.Adsgram.showRewarded({
            blockId: CONFIG.adScripts.adsgram.rewardedBlockId,
            onReward: () => resolve(true),
            onClose: () => resolve(false),
            onError: () => resolve(false)
          });
          return;
        }
      */

      simulateRewardedAd().then(resolve);
    });
  };

  window.TrikiMonetagRewarded = function () {
    return new Promise((resolve) => {
      /*
        IMPORTANTE:
        Aquí debes reemplazar la simulación por la llamada oficial de Monetag.
      */

      simulateRewardedAd().then(resolve);
    });
  };

  /* ==========================================================
     API PÚBLICA
     ========================================================== */

  window.TrikiMusic = {
    play,
    pause,
    togglePlay,
    next: userNext,
    prev: userPrev,
    getBalance,
    getCurrentIndex: () => state.currentIndex,
    getPlaylist: () => [...PLAYLIST]
  };

  /* ==========================================================
     ARRANQUE
     ========================================================== */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
