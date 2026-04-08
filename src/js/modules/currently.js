/**
 * Currently Section - Interactive Module
 * Handles tab switching and broken image fallbacks
 */

export function initCurrentlySection() {
  const tabs = document.querySelectorAll('.currently-tab');
  const contents = document.querySelectorAll('.currently-content');

  if (!tabs.length || !contents.length) return;

  // Tab switching logic
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // Update tabs
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update content
      contents.forEach(c => c.classList.remove('active'));
      const targetContent = document.getElementById(`${tabName}-content`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });

  // Handle broken images - use a nice Apple-style SVG placeholder
  const fallbackSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 150'%3E%3Crect fill='%23f5f5f7' width='100' height='150'/%3E%3Ctext fill='%2386868b' font-family='system-ui' font-size='12' x='50' y='75' text-anchor='middle'%3EIMAGE%3C/text%3E%3C/svg%3E`;
  
  const handleImageError = (event) => {
    const img = event.target;
    if (img.src !== fallbackSvg) {
      img.src = fallbackSvg;
    }
  };

  document.querySelectorAll('.currently-content img').forEach(img => {
    img.addEventListener('error', handleImageError);
  });

  console.log('✓ Currently section initialized');
}

// Auto-initialize if not loaded as a module
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCurrentlySection);
} else {
  initCurrentlySection();
}
