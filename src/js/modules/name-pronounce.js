/**
 * Name Pronunciation Audio Player & Advanced Speech Controller
 * Supports native recording playback, playback rate speed adjustment (0.75x, 1.0x, 1.25x),
 * and multilingual Text-to-Speech voices (Marathi & English) with an Apple Glass menu.
 */
(function initNamePronounce() {
  'use strict';

  const btn = document.getElementById('name-pronounce-btn');
  const settingsBtn = document.getElementById('name-pronounce-settings-btn');
  const menu = document.getElementById('name-pronounce-menu');
  const audio = document.getElementById('name-pronounce-audio');

  if (!btn) return;

  let isPlaying = false;
  let currentSpeed = 1.0;
  let currentVoice = 'natural'; // 'natural' | 'marathi' | 'english'

  // Restore saved speech preferences
  try {
    const savedSpeed = parseFloat(localStorage.getItem('portfolio-speech-speed') || '1.0');
    if ([0.75, 1.0, 1.25].includes(savedSpeed)) {
      currentSpeed = savedSpeed;
    }
    const savedVoice = localStorage.getItem('portfolio-speech-voice');
    if (['natural', 'marathi', 'english'].includes(savedVoice)) {
      currentVoice = savedVoice;
    }
  } catch (_err) {
    // Ignore storage errors
  }

  function updateMenuState() {
    if (!menu) return;
    const speedPills = menu.querySelectorAll('.speed-pill');
    speedPills.forEach(pill => {
      const speed = parseFloat(pill.dataset.speed || '1.0');
      const active = speed === currentSpeed;
      pill.classList.toggle('is-active', active);
      pill.setAttribute('aria-checked', active ? 'true' : 'false');
    });

    const voiceOptions = menu.querySelectorAll('.voice-option');
    voiceOptions.forEach(opt => {
      const voice = opt.dataset.voice;
      const active = voice === currentVoice;
      opt.classList.toggle('is-active', active);
      opt.setAttribute('aria-checked', active ? 'true' : 'false');
    });
  }

  function stop() {
    isPlaying = false;
    btn.classList.remove('is-playing');
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (_err) {
        // Ignore speech cancel error
      }
    }
  }

  function playNativeAudio() {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    audio.playbackRate = currentSpeed;

    btn.classList.add('is-playing');
    isPlaying = true;

    audio.play().catch(function (err) {
      console.warn('[NamePronounce] Audio play failed:', err);
      // Fallback to TTS
      playTTS('Mangesh Raut', 'en-US');
    });
  }

  function playTTS(text, lang) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      stop();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = currentSpeed;
      utterance.lang = lang;

      // Find best matching voice if available
      const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      if (voices.length) {
        const match =
          voices.find(v => v.lang && v.lang.startsWith(lang.slice(0, 2))) ||
          voices.find(v => v.lang && v.lang.startsWith('en'));
        if (match) utterance.voice = match;
      }

      utterance.onstart = () => {
        isPlaying = true;
        btn.classList.add('is-playing');
      };
      utterance.onend = stop;
      utterance.onerror = stop;

      window.speechSynthesis.speak(utterance);
    } catch (_err) {
      stop();
    }
  }

  function play() {
    stop();

    if (currentVoice === 'natural') {
      playNativeAudio();
    } else if (currentVoice === 'marathi') {
      playTTS('मंगेश राऊत', 'mr-IN');
    } else {
      playTTS('Mangesh Raut', 'en-US');
    }
  }

  // Click speaker button to toggle play/stop
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (isPlaying) {
      stop();
    } else {
      play();
    }
  });

  if (audio) {
    audio.addEventListener('ended', stop);
    audio.addEventListener('error', stop);
  }

  // Settings menu toggle
  if (settingsBtn && menu) {
    settingsBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const open = !menu.hidden;
      if (open) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    function openMenu() {
      updateMenuState();
      menu.hidden = false;
      settingsBtn.setAttribute('aria-expanded', 'true');
      menu.classList.add('is-open');
    }

    function closeMenu() {
      menu.hidden = true;
      settingsBtn.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
    }

    // Handle speed changes
    menu.addEventListener('click', function (e) {
      const speedPill = e.target.closest('.speed-pill');
      if (speedPill) {
        e.preventDefault();
        const speed = parseFloat(speedPill.dataset.speed || '1.0');
        currentSpeed = speed;
        try {
          localStorage.setItem('portfolio-speech-speed', String(speed));
        } catch (_err) {
          // Ignore
        }
        updateMenuState();
        play();
        return;
      }

      const voiceOpt = e.target.closest('.voice-option');
      if (voiceOpt) {
        e.preventDefault();
        const voice = voiceOpt.dataset.voice;
        if (voice) {
          currentVoice = voice;
          try {
            localStorage.setItem('portfolio-speech-voice', voice);
          } catch (_err) {
            // Ignore
          }
          updateMenuState();
          play();
        }
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (!menu.hidden && !menu.contains(e.target) && !settingsBtn.contains(e.target)) {
        closeMenu();
      }
    });

    // Close menu on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) {
        closeMenu();
        settingsBtn.focus();
      }
    });
  }

  // Keyboard accessibility
  btn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      btn.click();
    }
  });

  updateMenuState();
})();
