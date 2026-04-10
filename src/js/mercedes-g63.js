class MercedesG63Widget {
  constructor(elementId) {
    this.root = document.getElementById(elementId);
    if (!this.root) return;

    this.isAnimating = false;
    this.randomTimer = null;
    this.init();
  }

  init() {
    this.root.addEventListener('click', () => this.launch());
    this.root.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      this.launch();
    });

    this.scheduleRandomEvent();
  }

  scheduleRandomEvent() {
    const delay = 3200 + Math.random() * 4200;
    this.randomTimer = window.setTimeout(() => {
      if (!this.isAnimating) {
        if (Math.random() > 0.58) {
          this.flashLights();
        } else {
          this.revEngine();
        }
      }
      this.scheduleRandomEvent();
    }, delay);
  }

  pulse(className, duration) {
    this.root.classList.add(className);
    window.setTimeout(() => this.root.classList.remove(className), duration);
  }

  flashLights() {
    this.pulse('flashing', 220);
    window.setTimeout(() => this.pulse('flashing', 220), 320);
  }

  revEngine() {
    this.pulse('revving', 980);
  }

  launch() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.root.classList.add('launching');

    window.setTimeout(() => {
      this.root.classList.remove('launching');
      this.isAnimating = false;
    }, 900);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new MercedesG63Widget('mercedes-g63-widget');
});
