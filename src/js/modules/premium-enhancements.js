/**
 * ═══════════════════════════════════════════════════════════════════
 * PREMIUM ENHANCEMENTS MODULE - 2026 Edition
 * Advanced interactions, animations, and visual polish
 * ═══════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowPowerDevice =
    (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

  /**
   * 1. SCROLL PROGRESS INDICATOR
   * Shows reading progress at the top of the page
   */
  function initScrollProgress() {
    if (prefersReducedMotion) return;

    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progressBar);

    let ticking = false;

    function updateProgress() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(updateProgress);
          ticking = true;
        }
      },
      { passive: true }
    );

    updateProgress();
  }

  /**
   * 2. ANIMATED SKILL COUNTERS
   * Counts up numbers when they come into view
   */
  function initSkillCounters() {
    if (prefersReducedMotion) return;

    const counters = document.querySelectorAll(
      '.hero-stat-value, .project-stat-value, [data-counter]'
    );

    const observerOptions = {
      threshold: 0.5,
      rootMargin: '0px',
    };

    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          animateCounter(entry.target);
          entry.target.dataset.counted = 'true';
        }
      });
    }, observerOptions);

    counters.forEach(counter => counterObserver.observe(counter));
  }

  function animateCounter(element) {
    const text = element.textContent.trim();
    const match = text.match(/^(\d+)(\+?)$/);

    if (!match) return;

    const target = parseInt(match[1], 10);
    const suffix = match[2] || '';
    const duration = 2000;
    const startTime = performance.now();

    element.classList.add('counting');

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(target * easeOut);

      element.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = target + suffix;
        element.classList.remove('counting');
      }
    }

    requestAnimationFrame(update);
  }

  /**
   * 3. STAGGERED REVEAL FOR GRIDS
   * Reveals grid items one by one as they enter viewport
   */
  function initStaggeredReveal() {
    const grids = document.querySelectorAll('.projects-grid, .skills-grid, .cert-grid, .blog-grid');

    grids.forEach(grid => {
      grid.classList.add('stagger-reveal');
    });

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '50px',
    };

    const gridObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          gridObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    grids.forEach(grid => gridObserver.observe(grid));
  }

  /**
   * 4. MAGNETIC BUTTON EFFECT
   * Buttons subtly follow the cursor
   */
  function initMagneticButtons() {
    if (prefersReducedMotion) return;

    const buttons = document.querySelectorAll('.hero-cta, .btn-primary, .projects-view-all-btn');

    buttons.forEach(button => {
      button.classList.add('magnetic-btn');

      button.addEventListener('mousemove', e => {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        button.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = '';
      });
    });
  }

  /**
   * 5. SMOOTH SECTION TRANSITIONS & PARALLAX
   * Adds parallax-like effect on scroll
   */
  function initParallax() {
    if (prefersReducedMotion) return;
    const parallaxElements = Array.from(document.querySelectorAll('[data-parallax="scroll"]'));
    if (!parallaxElements.length) return;

    const parallaxConfig = parallaxElements.map(el => ({
      el,
      speed: parseFloat(el.dataset.parallaxSpeed) || 0.06,
      maxShift: parseFloat(el.dataset.parallaxMax) || 18,
    }));

    let ticking = false;

    function updateParallax() {
      const disableParallax = window.innerWidth <= 900;
      const viewportCenter = window.innerHeight * 0.5;

      parallaxConfig.forEach(({ el, speed, maxShift }) => {
        if (disableParallax) {
          el.style.transform = 'translate3d(0, 0, 0)';
          return;
        }

        const rect = el.getBoundingClientRect();
        if (rect.bottom < -120 || rect.top > window.innerHeight + 120) {
          el.style.transform = 'translate3d(0, 0, 0)';
          return;
        }

        const elementCenter = rect.top + rect.height * 0.5;
        const delta = (viewportCenter - elementCenter) * speed;
        const clamped = Math.max(-maxShift, Math.min(maxShift, delta));
        el.style.transform = `translate3d(0, ${clamped.toFixed(2)}px, 0)`;
      });

      ticking = false;
    }

    const onParallaxTick = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateParallax);
    };

    window.addEventListener('scroll', onParallaxTick, { passive: true });
    window.addEventListener('resize', onParallaxTick, { passive: true });
    updateParallax();
  }

  function initSmoothSections() {
    if (prefersReducedMotion) return;

    const sections = document.querySelectorAll('section');
    function updateSections() {
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;

        if (inView) {
          const progress = 1 - rect.top / window.innerHeight;
          section.style.setProperty('--scroll-progress', Math.min(1, Math.max(0, progress)));
        }
      });
    }

    let ticking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            updateSections();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  /**
   * 6. ENHANCED IMAGE LOADING
   * Adds smooth fade-in for images as they load
   */
  function initImageLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');

    images.forEach(img => {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        });
      }
    });
  }

  /**
   * 7. TYPING EFFECT FOR HERO (Optional - triggered by class)
   */
  function initTypingEffect() {
    const heroTitle = document.querySelector('.hero-title[data-typing]');
    if (!heroTitle || prefersReducedMotion) return;

    heroTitle.classList.add('typing-animation');
  }

  /**
   * 8. SMOOTH ANCHOR SCROLLING
   * Enhanced scroll-to with easing
   */
  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]:not(.nav-link):not(.menu-item)').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();

          const navHeight = document.querySelector('.global-nav, .navbar')?.offsetHeight || 80;
          const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
          });
        }
      });
    });
  }

  /**
   * 9. HOVER SOUND EFFECTS (Optional, subtle)
   * Plays subtle click sounds on button hover
   */
  function initHoverSounds() {
    // Disabled by default - can be enabled via localStorage
    if (!localStorage.getItem('enableSounds')) return;

    const buttons = document.querySelectorAll('.btn, .hero-cta');

    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        // Create subtle click sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.02, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      });
    });
  }

  /**
   * 10. CARD TILT EFFECT
   * 3D tilt on hover for cards
   */
  function applyTiltToElement(card) {
    if (prefersReducedMotion || lowPowerDevice || card.dataset.tiltInitialized) return;
    card.dataset.tiltInitialized = 'true';

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = -((y - centerY) / 20);
      const rotateY = (x - centerX) / 20;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      card.style.transition = 'none';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      card.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s ease-out';
    });
  }

  function initCardTilt() {
    if (prefersReducedMotion) return;

    const cards = document.querySelectorAll('.project-card, .blog-card, .apple-3d-project');
    cards.forEach(applyTiltToElement);
  }

  /**
   * 11. CURSOR SPOTLIGHT EFFECT
   * Subtle light following cursor on dark mode
   */
  function initCursorSpotlight() {
    if (prefersReducedMotion) return;

    const spotlight = document.createElement('div');
    spotlight.className = 'cursor-spotlight';
    spotlight.style.cssText = `
            position: fixed;
            pointer-events: none;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(0, 113, 227, 0.03) 0%, transparent 70%);
            transform: translate(-50%, -50%);
            z-index: -1;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
    document.body.appendChild(spotlight);

    let visible = false;

    function updateSpotlight(e) {
      requestAnimationFrame(() => {
        spotlight.style.left = e.clientX + 'px';
        spotlight.style.top = e.clientY + 'px';
      });
    }

    document.addEventListener(
      'mousemove',
      e => {
        updateSpotlight(e);
        if (!visible) {
          spotlight.style.opacity = '1';
          visible = true;
        }
      },
      { passive: true }
    );

    document.addEventListener('mouseleave', () => {
      spotlight.style.opacity = '0';
      visible = false;
    });

    // Update for dark mode
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      if (isDark) {
        spotlight.style.background =
          'radial-gradient(circle, rgba(41, 151, 255, 0.05) 0%, transparent 70%)';
      } else {
        spotlight.style.background =
          'radial-gradient(circle, rgba(0, 113, 227, 0.03) 0%, transparent 70%)';
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  /**
   * 12. ACTIVE SECTION HIGHLIGHT IN NAV
   * Highlights current section in navigation
   */
  function initActiveNavHighlight() {
    if (window.__smartNavbarHandlesDynamicIsland) return;
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link, .menu-item');

    const observerOptions = {
      threshold: 0.3,
      rootMargin: '-80px 0px -50% 0px',
    };

    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');

          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach(section => sectionObserver.observe(section));
  }

  /**
   * INITIALIZE ALL ENHANCEMENTS
   */
  function init() {
    // Core enhancements
    initScrollProgress();
    initSkillCounters();
    initStaggeredReveal();
    initImageLoading();
    initSmoothAnchors();
    initActiveNavHighlight();
    if (!lowPowerDevice) {
      initParallax();
    }

    // Premium effects (only on desktop)
    if (window.innerWidth > 768 && !lowPowerDevice) {
      initMagneticButtons();
      initCardTilt();
      initCursorSpotlight();
    }

    // Optional enhancements
    if (!lowPowerDevice) {
      initSmoothSections();
    }
    initTypingEffect();
    initHoverSounds(); // Enabled only when localStorage flag is present

    console.log(`✨ Premium enhancements initialized${lowPowerDevice ? ' (low-power mode)' : ''}`);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging and dynamic elements
  window.PremiumEnhancements = {
    init,
    initScrollProgress,
    initSkillCounters,
    initMagneticButtons,
    initCardTilt,
    applyTiltToElement,
    initParallax,
  };
})();
