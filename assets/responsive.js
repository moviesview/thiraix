(() => {
  const root = document.documentElement;

  function applyViewportMetrics() {
    const vv = window.visualViewport;
    const width = Math.max(1, Math.round(vv?.width || document.documentElement.clientWidth || window.innerWidth));
    const height = Math.max(1, Math.round(vv?.height || document.documentElement.clientHeight || window.innerHeight));
    const ratio = width / height;

    root.style.setProperty('--viewport-width', `${width}px`);
    root.style.setProperty('--viewport-height', `${height}px`);
    root.dataset.viewport = ratio > 1.25 ? 'landscape' : ratio < 0.8 ? 'portrait' : 'balanced';
    root.dataset.viewportWidth = String(width);

    // 2 cards only when each card can remain readable. Otherwise fall back to 1.
    if (width <= 305) {
      root.style.setProperty('--card-min', '100%');
    } else if (width < 600) {
      const usable = width - Math.max(16, width * 0.064);
      const twoColMin = Math.max(126, Math.min(154, (usable - 10) / 2));
      root.style.setProperty('--card-min', `${twoColMin.toFixed(1)}px`);
    } else if (width < 901) {
      root.style.setProperty('--card-min', '175px');
    } else {
      root.style.setProperty('--card-min', '220px');
    }
  }

  applyViewportMetrics();
  window.addEventListener('resize', applyViewportMetrics, { passive: true });
  window.addEventListener('orientationchange', applyViewportMetrics, { passive: true });
  window.visualViewport?.addEventListener('resize', applyViewportMetrics, { passive: true });
})();
