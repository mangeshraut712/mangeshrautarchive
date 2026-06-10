/**
 * About Interactivity - Module
 * Handles segmented tab toggles and paragraph-level Read Aloud text-to-speech with visual sync.
 */

export function initAboutInteractivity() {
  const card = document.querySelector('.about-text-card');
  if (!card) return;

  // Prevent double initialization
  if (card.dataset.aboutInteractivityInit === 'true') return;
  card.dataset.aboutInteractivityInit = 'true';

  const tabButtons = card.querySelectorAll('.about-tab-btn');
  const panels = card.querySelectorAll('.about-tab-panel');
  const slider = card.querySelector('.segmented-control-bg');
  const speakBtn = card.querySelector('.about-speak-btn');
  const speakText = speakBtn?.querySelector('.speak-text');
  const speakIcon = speakBtn?.querySelector('.speak-icon');

  let activePanelId = 'full-story-panel';
  let speechState = 'idle'; // 'idle', 'speaking', 'paused'
  let paragraphsToSpeak = [];

  // ─────────────────────────────────────────────
  // 1. Tab Switching Functionality
  // ─────────────────────────────────────────────

  const updateSlider = activeBtn => {
    if (!slider || !activeBtn) return;
    slider.style.transform = `translateX(${activeBtn.offsetLeft - 3}px)`;
    slider.style.width = `${activeBtn.offsetWidth}px`;
  };

  const switchTab = targetBtn => {
    if (!targetBtn || targetBtn.classList.contains('active')) return;

    // Stop speaking if speech is active
    stopSpeech();

    // Toggle active tab buttons
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });
    targetBtn.classList.add('active');
    targetBtn.setAttribute('aria-selected', 'true');

    // Update Slider Position
    updateSlider(targetBtn);

    // Toggle tab panels visibility
    activePanelId = targetBtn.getAttribute('aria-controls');
    panels.forEach(panel => {
      if (panel.id === activePanelId) {
        panel.style.display = 'block';
        panel.setAttribute('aria-hidden', 'false');
        panel.scrollTop = 0;
      } else {
        panel.style.display = 'none';
        panel.setAttribute('aria-hidden', 'true');
      }
    });
  };

  // Bind tab events
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn));
  });

  // Keep slider aligned on window resize
  window.addEventListener('resize', () => {
    const activeBtn = card.querySelector('.about-tab-btn.active');
    if (activeBtn) updateSlider(activeBtn);
  });

  // Initial slider alignment
  const activeBtn = card.querySelector('.about-tab-btn.active');
  if (activeBtn) {
    // Wait for layout/fonts to settle to guarantee correct widths
    setTimeout(() => updateSlider(activeBtn), 150);
  }

  // ─────────────────────────────────────────────
  // 2. Speech Synthesis (Read Aloud) Logic
  // ─────────────────────────────────────────────

  if (!window.speechSynthesis) {
    // Hide speak button if speech output is not supported
    if (speakBtn) speakBtn.style.display = 'none';
    return;
  }

  const updateSpeakButtonUI = () => {
    if (!speakBtn || !speakText || !speakIcon) return;

    speakBtn.classList.remove('is-speaking', 'is-paused');

    if (speechState === 'speaking') {
      speakBtn.classList.add('is-speaking');
      speakText.textContent = 'Pause';
      speakIcon.className = 'fas fa-pause speak-icon';
    } else if (speechState === 'paused') {
      speakBtn.classList.add('is-paused');
      speakText.textContent = 'Resume';
      speakIcon.className = 'fas fa-play speak-icon';
    } else {
      speakText.textContent = 'Listen';
      speakIcon.className = 'fas fa-volume-up speak-icon';
    }
  };

  const playParagraph = index => {
    if (index >= paragraphsToSpeak.length) {
      stopSpeech();
      return;
    }

    const node = paragraphsToSpeak[index];

    // Remove active highlight, add to current
    paragraphsToSpeak.forEach(n => n.classList.remove('is-speaking'));
    node.classList.add('is-speaking');

    // Smoothly scroll the active paragraph into view
    node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Extract speech text, clean extra markup text if needed
    const text = node.textContent.trim();
    const utterance = new SpeechSynthesisUtterance(text);

    // Dynamic voice selection (prefer natural English speaker)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find(
        v =>
          v.lang.startsWith('en') &&
          (v.name.toLowerCase().includes('natural') ||
            v.name.toLowerCase().includes('premium') ||
            v.localService)
      ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 0.95; // slightly slower for better comprehensibility
    utterance.pitch = 1.0;

    utterance.onend = () => {
      // Continue to next item if we are still in speaking state
      if (speechState === 'speaking') {
        playParagraph(index + 1);
      }
    };

    utterance.onerror = event => {
      // Don't error out on manual interruption
      if (event.error !== 'interrupted') {
        console.warn('SpeechSynthesis error:', event);
        stopSpeech();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const startSpeech = () => {
    window.speechSynthesis.cancel(); // safety flush

    const activePanel = document.getElementById(activePanelId);
    if (!activePanel) return;

    // Gather highlight-target tags in the active panel
    paragraphsToSpeak = Array.from(activePanel.querySelectorAll('.highlight-target'));
    if (paragraphsToSpeak.length === 0) return;

    card.classList.add('speech-active');
    speechState = 'speaking';
    updateSpeakButtonUI();

    playParagraph(0);
  };

  const pauseSpeech = () => {
    window.speechSynthesis.pause();
    speechState = 'paused';
    updateSpeakButtonUI();
  };

  const resumeSpeech = () => {
    window.speechSynthesis.resume();
    speechState = 'speaking';
    updateSpeakButtonUI();
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    card.classList.remove('speech-active');

    if (paragraphsToSpeak) {
      paragraphsToSpeak.forEach(n => n.classList.remove('is-speaking'));
    }

    speechState = 'idle';
    updateSpeakButtonUI();
  };

  speakBtn?.addEventListener('click', () => {
    if (speechState === 'idle') {
      startSpeech();
    } else if (speechState === 'speaking') {
      pauseSpeech();
    } else if (speechState === 'paused') {
      // Some browsers have bugs resuming after pausing. If resume fails, start fresh or try default resume
      try {
        resumeSpeech();
      } catch (e) {
        console.warn('Error resuming speech, restarting sequence:', e);
        startSpeech();
      }
    }
  });

  // Stop speaking when leaving the tab or unloading page
  window.addEventListener('beforeunload', () => {
    window.speechSynthesis.cancel();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Pause speech if page goes into background
      if (speechState === 'speaking') {
        pauseSpeech();
      }
    }
  });
}

// Auto-initialize if not loaded as a module
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAboutInteractivity);
} else {
  initAboutInteractivity();
}
