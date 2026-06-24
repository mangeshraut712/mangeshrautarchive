(function () {
  var root = document.documentElement;
  var ua = navigator.userAgent || '';
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua)) {
    root.classList.add('browser-chromium');
  } else if (/Safari\//.test(ua) && !/Chrome\//.test(ua) && !/Chromium\//.test(ua)) {
    root.classList.add('browser-safari');
  }

  var MODE_KEY = 'themeMode';
  var LEGACY_KEY = 'theme';
  var GEO_KEY = 'themeGeo';
  var DEFAULT_LAT = 39.9526;
  var DEFAULT_LNG = -75.1652;
  var scheduleTimer = null;

  function readJson(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_error) {
      // Storage unavailable — keep in-memory behavior only.
    }
  }

  function normalizeMode(value) {
    if (value === 'auto' || value === 'system' || value === 'light' || value === 'dark') {
      return value;
    }
    return null;
  }

  function getThemeMode() {
    var savedMode = normalizeMode(localStorage.getItem(MODE_KEY));
    if (savedMode) {
      return savedMode;
    }

    var legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy === 'light' || legacy === 'dark') {
      return legacy;
    }

    return 'system';
  }

  function setThemeMode(mode) {
    var normalized = normalizeMode(mode);
    if (!normalized) {
      return;
    }

    try {
      localStorage.setItem(MODE_KEY, normalized);
      if (normalized === 'light' || normalized === 'dark') {
        localStorage.setItem(LEGACY_KEY, normalized);
      } else {
        localStorage.removeItem(LEGACY_KEY);
      }
    } catch (_error) {
      // Ignore storage failures.
    }
  }

  function prefersDarkSystem() {
    return (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }

  function toRadians(value) {
    return (value * Math.PI) / 180;
  }

  function toDegrees(value) {
    return (value * 180) / Math.PI;
  }

  function getDayOfYear(date) {
    var start = Date.UTC(date.getFullYear(), 0, 0);
    var current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.floor((current - start) / 86400000);
  }

  function getSolarEventUtcMinutes(dayOfYear, lat, lng, isSunrise) {
    var zenith = 90.833;
    var lngHour = lng / 15;
    var t = isSunrise ? dayOfYear + (6 - lngHour) / 24 : dayOfYear + (18 - lngHour) / 24;
    var m = 0.9856 * t - 3.289;
    var l = m + 1.916 * Math.sin(toRadians(m)) + 0.02 * Math.sin(toRadians(2 * m)) + 282.634;
    l = ((l % 360) + 360) % 360;

    var ra = toDegrees(Math.atan(0.91764 * Math.tan(toRadians(l))));
    ra = ((ra % 360) + 360) % 360;
    var lQuadrant = Math.floor(l / 90) * 90;
    var raQuadrant = Math.floor(ra / 90) * 90;
    ra = ra + (lQuadrant - raQuadrant);
    ra /= 15;

    var sinDec = 0.39782 * Math.sin(toRadians(l));
    var cosDec = Math.cos(Math.asin(sinDec));
    var cosH =
      (Math.cos(toRadians(zenith)) - sinDec * Math.sin(toRadians(lat))) /
      (cosDec * Math.cos(toRadians(lat)));

    if (cosH > 1 || cosH < -1) {
      return null;
    }

    var h = isSunrise ? 360 - toDegrees(Math.acos(cosH)) : toDegrees(Math.acos(cosH));
    h /= 15;

    var tLocal = h + ra - 0.06571 * t - 6.622;
    var ut = tLocal - lngHour;
    ut = ((ut % 24) + 24) % 24;
    return ut * 60;
  }

  function getSunTimes(date, lat, lng) {
    var dayOfYear = getDayOfYear(date);
    var sunriseMinutes = getSolarEventUtcMinutes(dayOfYear, lat, lng, true);
    var sunsetMinutes = getSolarEventUtcMinutes(dayOfYear, lat, lng, false);

    if (sunriseMinutes == null || sunsetMinutes == null) {
      return null;
    }

    var timezoneOffsetMinutes = date.getTimezoneOffset();
    var sunrise = new Date(date);
    sunrise.setHours(0, 0, 0, 0);
    sunrise.setMinutes(sunriseMinutes - timezoneOffsetMinutes);

    var sunset = new Date(date);
    sunset.setHours(0, 0, 0, 0);
    sunset.setMinutes(sunsetMinutes - timezoneOffsetMinutes);

    if (sunset <= sunrise) {
      sunset.setDate(sunset.getDate() + 1);
    }

    return { sunrise: sunrise, sunset: sunset };
  }

  function getStoredCoords() {
    var stored = readJson(GEO_KEY);
    if (!stored || typeof stored.lat !== 'number' || typeof stored.lng !== 'number') {
      return null;
    }
    return stored;
  }

  function getCoords() {
    var stored = getStoredCoords();
    if (stored) {
      return stored;
    }
    return { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
  }

  function isNightAtCoords(date, coords) {
    var sunTimes = getSunTimes(date, coords.lat, coords.lng);
    if (!sunTimes) {
      return prefersDarkSystem();
    }

    return date < sunTimes.sunrise || date >= sunTimes.sunset;
  }

  function resolveIsDark(mode, date) {
    var when = date || new Date();

    if (mode === 'light') {
      return false;
    }
    if (mode === 'dark') {
      return true;
    }
    if (mode === 'system') {
      return prefersDarkSystem();
    }

    return isNightAtCoords(when, getCoords());
  }

  function applyTheme(isDark) {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme-mode', getThemeMode());
    document.documentElement.style.backgroundColor = isDark ? '#000000' : '#ffffff';
    if (document.body) {
      document.body.classList.toggle('dark-mode', isDark);
      document.body.style.backgroundColor = isDark ? '#000000' : '#ffffff';
    }

    document.dispatchEvent(
      new CustomEvent('portfolio-theme-change', {
        detail: { isDark: isDark, mode: getThemeMode() },
      })
    );
  }

  function syncTheme() {
    applyTheme(resolveIsDark(getThemeMode()));
  }

  function msUntilNextTransition() {
    var mode = getThemeMode();
    if (mode !== 'auto') {
      return null;
    }

    var coords = getCoords();
    var now = new Date();
    var sunTimes = getSunTimes(now, coords.lat, coords.lng);
    if (!sunTimes) {
      return 60000;
    }

    var next = now < sunTimes.sunrise ? sunTimes.sunrise : sunTimes.sunset;
    if (now >= sunTimes.sunset) {
      var tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      var tomorrowSun = getSunTimes(tomorrow, coords.lat, coords.lng);
      next = tomorrowSun ? tomorrowSun.sunrise : new Date(now.getTime() + 3600000);
    }

    return Math.max(next.getTime() - now.getTime() + 1000, 60000);
  }

  function scheduleAutoUpdate() {
    if (scheduleTimer) {
      clearTimeout(scheduleTimer);
      scheduleTimer = null;
    }

    if (getThemeMode() !== 'auto') {
      return;
    }

    var delay = msUntilNextTransition();
    if (delay == null) {
      return;
    }

    scheduleTimer = window.setTimeout(function () {
      syncTheme();
      scheduleAutoUpdate();
    }, delay);
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function (position) {
        writeJson(GEO_KEY, {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          ts: Date.now(),
        });
        syncTheme();
        scheduleAutoUpdate();
      },
      function () {
        // Permission denied — keep fallback coordinates / system preference.
      },
      { enableHighAccuracy: false, maximumAge: 86400000, timeout: 8000 }
    );
  }

  function bindSystemListener() {
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    var media = window.matchMedia('(prefers-color-scheme: dark)');
    var handler = function () {
      var mode = getThemeMode();
      if (mode === 'system' || mode === 'auto') {
        syncTheme();
      }
    };

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handler);
    } else if (typeof media.addListener === 'function') {
      media.addListener(handler);
    }

    // Re-sync when tab becomes visible again, so missed OS theme changes
    // (e.g. macOS switching at sunrise/sunset while tab was hidden) apply immediately.
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        var mode = getThemeMode();
        if (mode === 'system' || mode === 'auto') {
          syncTheme();
          scheduleAutoUpdate();
        }
      }
    });
  }

  function toggleManualTheme() {
    var isDark = !document.documentElement.classList.contains('dark');
    setThemeMode(isDark ? 'dark' : 'light');
    syncTheme();
    scheduleAutoUpdate();
    return getThemeMode();
  }

  function cycleAutomaticTheme() {
    var mode = getThemeMode();
    var next = mode === 'auto' ? 'system' : 'auto';
    setThemeMode(next);
    syncTheme();
    scheduleAutoUpdate();
    if (next === 'auto') {
      requestLocation();
    }
    return next;
  }

  function resetToAutoTheme() {
    setThemeMode('auto');
    syncTheme();
    scheduleAutoUpdate();
    requestLocation();
  }

  function getThemeModeLabel(mode) {
    if (mode === 'auto') return 'Automatic (sunrise / sunset)';
    if (mode === 'system') return 'System (follows your OS)';
    if (mode === 'light') return 'Light';
    return 'Dark';
  }

  function pinThemeSolidStylesheet() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll('link[rel="stylesheet"]')
    );
    links
      .filter(function (link) {
        return /theme-solid-surfaces/.test(link.getAttribute('href') || '');
      })
      .forEach(function (link) {
        if (link.parentNode) {
          document.head.appendChild(link);
        }
      });
  }

  window.__portfolioTheme = {
    MODE_KEY: MODE_KEY,
    getThemeMode: getThemeMode,
    setThemeMode: setThemeMode,
    resolveIsDark: resolveIsDark,
    applyTheme: applyTheme,
    syncTheme: syncTheme,
    scheduleAutoUpdate: scheduleAutoUpdate,
    requestLocation: requestLocation,
    bindSystemListener: bindSystemListener,
    cycleThemeMode: cycleAutomaticTheme,
    toggleManualTheme: toggleManualTheme,
    cycleAutomaticTheme: cycleAutomaticTheme,
    resetToAutoTheme: resetToAutoTheme,
    getThemeModeLabel: getThemeModeLabel,
    init: function () {
      syncTheme();
      bindSystemListener();
      pinThemeSolidStylesheet();
      window.addEventListener('load', pinThemeSolidStylesheet, { once: true });
      // Only schedule solar-based auto-updates if explicitly in 'auto' mode.
      // Default 'system' mode relies on prefers-color-scheme listener instead.
      if (getThemeMode() === 'auto') {
        scheduleAutoUpdate();
      }
    },
  };

  window.__portfolioTheme.init();
})();
