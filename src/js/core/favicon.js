/* Browser chrome follows the OS theme independently of the page theme toggle. */
(() => {
  const icon = document.querySelector('link[data-system-favicon]');
  if (!icon) return;
  const scheme = window.matchMedia('(prefers-color-scheme: dark)');
  const update = () => {
    icon.href = scheme.matches ? icon.dataset.dark : icon.dataset.light;
  };
  update();
  scheme.addEventListener('change', update);
})();
