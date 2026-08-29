/**
 * Name Pronunciation Audio Player
 * Clean, lightweight, reliable name pronunciation player for the hero section.
 */
(function initNamePronounce() {
  'use strict';

  const btn = document.getElementById('name-pronounce-btn');
  const audio = document.getElementById('name-pronounce-audio');

  if (!btn) return;

  let isPlaying = false;

  function stop() {
    isPlaying = false;
    btn.classList.remove('is-playing');
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  function play() {
    if (!audio) return;
    stop();

    audio.pause();
    audio.currentTime = 0;
    btn.classList.add('is-playing');
    isPlaying = true;

    audio.play().catch(function (err) {
      console.warn('[NamePronounce] Audio playback failed:', err);
      stop();
    });
  }

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
    audio.addEventListener('pause', function () {
      if (isPlaying && audio.currentTime === 0) {
        stop();
      }
    });
  }

  btn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      btn.click();
    }
  });
})();
