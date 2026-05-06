/**
 * Name Pronunciation Audio Player
 * Inspired by chanhdai.com's name pronunciation feature
 * Plays an audio clip of how to pronounce "Mangesh Raut" when the speaker icon is clicked.
 */
(function initNamePronounce() {
  'use strict';

  const btn = document.getElementById('name-pronounce-btn');
  const audio = document.getElementById('name-pronounce-audio');

  if (!btn || !audio) return;

  let isPlaying = false;

  function play() {
    // If already playing, restart
    if (isPlaying) {
      audio.pause();
      audio.currentTime = 0;
    }

    btn.classList.add('is-playing');
    isPlaying = true;

    audio.play().catch(function (err) {
      console.warn('[NamePronounce] Audio play failed:', err);
      stop();
    });
  }

  function stop() {
    btn.classList.remove('is-playing');
    isPlaying = false;
  }

  // Click handler
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (isPlaying) {
      audio.pause();
      audio.currentTime = 0;
      stop();
    } else {
      play();
    }
  });

  // When audio finishes playing
  audio.addEventListener('ended', stop);

  // Handle errors
  audio.addEventListener('error', function () {
    console.warn('[NamePronounce] Audio failed to load');
    stop();
  });

  // Keyboard accessibility
  btn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      btn.click();
    }
  });
})();
