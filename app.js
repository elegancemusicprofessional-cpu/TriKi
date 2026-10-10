/* =====================================================
   TriKi HUB - app.js
   Lógica general:
   - Balance TriKiCoins sin límite
   - Navegación entre pestañas
   - Selector de idiomas
   - Banner pasivo +10 TKC cada 15 segundos
   - Sistema de anuncios recompensados simulados
   ===================================================== */

(() => {
  const TG = window.Telegram?.WebApp;

  if (TG) {
    TG.ready();
    TG.expand();

    if (TG.setHeaderColor) {
      TG.setHeaderColor("#050308");
    }

    if (TG.setBackgroundColor) {
      TG.setBackgroundColor("#050308");
    }
  }

  const STORAGE_KEY = "triki_hub_state_v1";

  const defaultState = {
    balance: "0",
    lang: "es",
    tasks: {},
    daily: {
      cycleMonday: null,
      claimedDates: []
    },
    music: {
      lastTrack: 0
    }
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return structuredClone(defaultState);
      }

      const parsed = JSON.parse(raw);

      return {
        ...structuredClone(defaultState),
        ...parsed,
        tasks: {
          ...defaultState.tasks,
          ...(parsed.tasks || {})
        },
        daily: {
          ...defaultState.daily,
          ...(parsed.daily || {})
        }
      };
    } catch (error) {
      return structuredClone(defaultState);
    }
  }

  const state = loadState();

  /* =====================================================
     IDIOMAS
     Español, Inglés, Ruso, Chino
     ===================================================== */

  const i18n = {
    es: {
      balanceLabel: "TriKiCoins",
      tabs: ["Música", "Videos", "Tareas", "Top", "Billetera"],
      stations: "Estaciones populares",
      videoSources: "Fuentes de video",
      tasksActive: "Muro de tareas",
      leaderboard: "Tabla de clasificación",
      topUsers: "Top usuarios",
      totalBalance: "Balance total",
      connectWallet: "Conectar billetera de Telegram",
      open: "Abrir",
      verifying: "Verificando...",
      claim: "Reclamar",
      completed: "Completado",
      watch: "Ver",
      watching: "Viendo...",
      dailyBonus: "Bono diario 7 días",
      quickAds: "Anuncios rápidos",
      day: "Día",
      locked: "Bloqueado",
      youtubeSubscribe: "Suscribirse al canal oficial de YouTube",
      spotifyFollow: "Seguir lista de reproducción en Spotify",
      youtubeLike: "Dar Like al video oficial de YouTube",
      ad1: "Anuncio rápido 1",
      ad2: "Anuncio rápido 2"
    },

    en: {
      balanceLabel: "TriKiCoins",
      tabs: ["Music", "Videos", "Tasks", "Top", "Wallet"],
      stations: "Popular stations",
      videoSources: "Video sources",
      tasksActive: "Task wall",
      leaderboard: "Leaderboard",
      topUsers: "Top users",
      totalBalance: "Total balance",
      connectWallet: "Connect Telegram wallet",
      open: "Open",
      verifying: "Verifying...",
      claim: "Claim",
      completed: "Completed",
      watch: "Watch",
      watching: "Watching...",
      dailyBonus: "7-day daily bonus",
      quickAds: "Quick ads",
      day: "Day",
      locked: "Locked",
      youtubeSubscribe: "Subscribe to the official YouTube channel",
      spotifyFollow: "Follow the official Spotify playlist",
      youtubeLike: "Like the official YouTube video",
      ad1: "Quick ad 1",
      ad2: "Quick ad 2"
    },

    ru: {
      balanceLabel: "TriKiCoins",
      tabs: ["Музыка", "Видео", "Задания", "Топ", "Кошелёк"],
      stations: "Популярные станции",
      videoSources: "Источники видео",
      tasksActive: "Стена заданий",
      leaderboard: "Таблица лидеров",
      topUsers: "Топ пользователей",
      totalBalance: "Общий баланс",
      connectWallet: "Подключить кошелёк Telegram",
      open: "Открыть",
      verifying: "Проверка...",
      claim: "Получить",
      completed: "Выполнено",
      watch: "Смотреть",
      watching: "Просмотр...",
      dailyBonus: "Ежедневный бонус 7 дней",
      quickAds: "Быстрые рекламы",
      day: "День",
      locked: "Заблокировано",
      youtubeSubscribe: "Подписаться на официальный YouTube-канал",
      spotifyFollow: "Подписаться на плейлист в Spotify",
      youtubeLike: "Поставить лайк официальному видео на YouTube",
      ad1: "Быстрая реклама 1",
      ad2: "Быстрая реклама 2"
    },

    zh: {
      balanceLabel: "TriKiCoins",
      tabs: ["音乐", "视频", "任务", "排行榜", "钱包"],
      stations: "热门电台",
      videoSources: "视频来源",
      tasksActive: "任务墙",
      leaderboard: "排行榜",
      topUsers: "顶级用户",
      totalBalance: "总余额",
      connectWallet: "连接 Telegram 钱包",
      open: "打开",
      verifying: "验证中...",
      claim: "领取",
      completed: "已完成",
      watch: "观看",
      watching: "观看中...",
      dailyBonus: "7天每日奖励",
      quickAds: "快速广告",
      day: "第",
      locked: "未解锁",
      youtubeSubscribe: "订阅官方 YouTube 频道",
      spotifyFollow: "关注官方 Spotify 播放列表",
      youtubeLike: "点赞官方 YouTube 视频",
      ad1: "快速广告 1",
      ad2: "快速广告 2"
    }
  };

  function t(key) {
    const lang = state.lang || "es";

    if (i18n[lang] && i18n[lang][key] !== undefined) {
      return i18n[lang][key];
    }

    if (i18n.es[key] !== undefined) {
      return i18n.es[key];
    }

    return key;
  }

  /* =====================================================
     PERSISTENCIA
     ===================================================== */

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("TriKi: no se pudo guardar el estado.", error);
    }
  }

  /* =====================================================
     BALANCE SIN LÍMITE
     Usamos BigInt para manejar cantidades grandes.
     ===================================================== */

  function toBigInt(value) {
    try {
      return BigInt(value);
    } catch (error) {
      return 0n;
    }
  }

  function formatCoins(bigintValue) {
    const value = toBigInt(bigintValue);
    const negative = value < 0n;
    const abs = negative ? -value : value;

    const formatted = abs
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return negative ? `-${formatted}` : formatted;
  }

  const balanceEl = document.getElementById("user-balance");

  function renderBalance() {
    if (balanceEl) {
      balanceEl.textContent = formatCoins(state.balance);
    }
  }

  function addCoins(amount, reason = "") {
    const bigAmount = typeof amount === "bigint"
      ? amount
      : BigInt(Math.floor(Number(amount) || 0));

    const currentBalance = toBigInt(state.balance);
    const newBalance = currentBalance + bigAmount;

    state.balance = newBalance.toString();

    saveState();
    renderBalance();

    if (TG?.HapticFeedback) {
      TG.HapticFeedback.impactOccurred("light");
    }

    document.dispatchEvent(
      new CustomEvent("triki:coins", {
        detail: {
          amount: bigAmount.toString(),
          reason,
          balance: state.balance
        }
      })
    );
  }

  function getBalance() {
    return toBigInt(state.balance);
  }

  /* =====================================================
     NAVEGACIÓN ENTRE PESTAÑAS
     ===================================================== */

  const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
  const pages = Array.from(document.querySelectorAll(".page"));

  function showPage(pageId) {
    pages.forEach((page) => {
      page.classList.toggle("active", page.id === pageId);
    });

    tabButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.tab === pageId);
    });

    const langToggle = document.getElementById("lang-toggle");

    if (langToggle) {
      langToggle.checked = false;
    }

    if (TG?.HapticFeedback) {
      TG.HapticFeedback.selectionOccurred();
    }
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showPage(button.dataset.tab);
    });
  });

  /* =====================================================
     SELECTOR DE IDIOMAS
     ===================================================== */

  const langItems = Array.from(document.querySelectorAll(".lang-item"));
  const langCodes = ["es", "en", "ru", "zh"];

  function applyTranslations() {
    document.documentElement.lang = state.lang;

    const balanceSmall = document.querySelector(".balance-meta small");

    if (balanceSmall) {
      balanceSmall.textContent = t("balanceLabel");
    }

    const tabs = t("tabs");

    document.querySelectorAll(".tab-label").forEach((el, index) => {
      if (Array.isArray(tabs) && tabs[index]) {
        el.textContent = tabs[index];
      }
    });

    const set = (selector, key) => {
      const el = document.querySelector(selector);

      if (el) {
        el.textContent = t(key);
      }
    };

    set("#page-music .panel-head h2", "stations");
    set("#page-videos .panel-head h2", "videoSources");
    set("#page-tasks .panel-head h2", "tasksActive");
    set("#page-top .top-hero h2", "leaderboard");
    set("#page-top .panel-head h2", "topUsers");
    set(".wallet-label", "totalBalance");
    set(".connect-btn", "connectWallet");
  }

  function setLang(code) {
    if (!langCodes.includes(code)) {
      code = "es";
    }

    state.lang = code;
    saveState();

    langItems.forEach((item, index) => {
      item.classList.toggle("active", langCodes[index] === code);
    });

    applyTranslations();

    document.dispatchEvent(
      new CustomEvent("triki:language", {
        detail: {
          lang: code
        }
      })
    );

    const langToggle = document.getElementById("lang-toggle");

    if (langToggle) {
      langToggle.checked = false;
    }
  }

  langItems.forEach((item, index) => {
    item.addEventListener("click", () => {
      setLang(langCodes[index]);
    });
  });

  /* =====================================================
     BANNER PASIVO
     +10 TriKiCoins cada 15 segundos con uso activo.
     Se pausa si la app queda oculta.
     ===================================================== */

  const PASSIVE_AMOUNT = 10n;
  const PASSIVE_INTERVAL = 15000;
  const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

  let lastInteraction = Date.now();
  let hasInteracted = false;
  let passiveTimer = null;

  function markActive() {
    lastInteraction = Date.now();
    hasInteracted = true;
    managePassive();
  }

  ["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
    window.addEventListener(eventName, markActive, { passive: true });
  });

  function grantPassive() {
    if (document.visibilityState !== "visible") {
      return;
    }

    if (!hasInteracted) {
      return;
    }

    if (Date.now() - lastInteraction > ACTIVE_WINDOW_MS) {
      return;
    }

    addCoins(PASSIVE_AMOUNT, "passive_banner");
  }

  function managePassive() {
    clearInterval(passiveTimer);
    passiveTimer = null;

    const isVisible = document.visibilityState === "visible";
    const isActive = hasInteracted && Date.now() - lastInteraction <= ACTIVE_WINDOW_MS;

    if (isVisible && isActive) {
      passiveTimer = setInterval(grantPassive, PASSIVE_INTERVAL);
    }
  }

  document.addEventListener("visibilitychange", managePassive);

  /* =====================================================
     SISTEMA DE ANUNCIOS RECOMPENSADOS
     Por ahora simulado.
     Para Monetag/Adsgram, reemplazar con SDK real.
     ===================================================== */

  let adOverlayActive = false;

  function createAdOverlay(duration) {
    return new Promise((resolve) => {
      if (adOverlayActive) {
        resolve(false);
        return;
      }

      adOverlayActive = true;

      const overlay = document.createElement("div");

      overlay.id = "triki-ad-overlay";
      overlay.style.cssText = [
        "position:fixed",
        "inset:0",
        "z-index:99999",
        "background:rgba(5,3,8,.94)",
        "backdrop-filter:blur(18px)",
        "display:grid",
        "place-items:center",
        "color:#fff",
        "font-family:Outfit,system-ui,sans-serif",
        "padding:24px",
        "text-align:center"
      ].join(";");

      const box = document.createElement("div");

      box.style.cssText = [
        "width:min(320px,100%)",
        "border:1px solid rgba(255,255,255,.14)",
        "border-radius:24px",
        "padding:24px",
        "background:rgba(255,255,255,.06)"
      ].join(";");

      box.innerHTML = `
        <div style="font-size:11px;font-weight:900;letter-spacing:.35em;color:rgba(255,255,255,.55);margin-bottom:12px;">
          AD
        </div>

        <div style="font-size:24px;font-weight:900;margin-bottom:8px;">
          Anuncio recompensado
        </div>

        <div id="triki-ad-count" style="font-size:42px;font-weight:900;background:linear-gradient(90deg,#00f0ff,#b026ff,#ff267a);-webkit-background-clip:text;background-clip:text;color:transparent;">
          ${Math.ceil(duration / 1000)}
        </div>

        <div style="margin-top:10px;font-size:13px;color:rgba(255,255,255,.65);">
          No cierres esta pantalla
        </div>
      `;

      overlay.appendChild(box);
      document.body.appendChild(overlay);

      let remaining = Math.ceil(duration / 1000);
      const countEl = box.querySelector("#triki-ad-count");

      const timer = setInterval(() => {
        remaining -= 1;

        if (countEl) {
          countEl.textContent = String(remaining);
        }

        if (remaining <= 0) {
          clearInterval(timer);
          overlay.remove();
          adOverlayActive = false;

          if (TG?.HapticFeedback) {
            TG.HapticFeedback.notificationOccurred("success");
          }

          resolve(true);
        }
      }, 1000);
    });
  }

  window.TriKiAds = {
    async showRewardedAd(duration = 30000) {
      /*
        Integración real:
        Si más adelante conectas Monetag o Adsgram, puedes exponer:

        window.TriKiAdProvider = {
          showRewarded: async (duration) => {
            // llamar SDK real
            return true;
          }
        };
      */

      if (window.TriKiAdProvider?.showRewarded) {
        return window.TriKiAdProvider.showRewarded(duration);
      }

      return createAdOverlay(duration);
    }
  };

  /* =====================================================
     API GLOBAL TRIKI
     ===================================================== */

  window.TriKi = {
    state,
    saveState,
    addCoins,
    getBalance,
    formatCoins,
    t,
    showPage,
    setLang,
    applyTranslations,
    haptic: {
      success() {
        if (TG?.HapticFeedback) {
          TG.HapticFeedback.notificationOccurred("success");
        }
      },
      error() {
        if (TG?.HapticFeedback) {
          TG.HapticFeedback.notificationOccurred("error");
        }
      }
    }
  };

  /* =====================================================
     INICIO
     ===================================================== */

  renderBalance();

  const initialLang = state.lang || "es";

  langItems.forEach((item, index) => {
    item.classList.toggle("active", langCodes[index] === initialLang);
  });

  applyTranslations();
  showPage("page-music");
  managePassive();
})();
