(() => {
  const BANNERS = {
    "320x50": {
      key: "d256836a6c3a9df1296f3bb7aa360d0b",
      width: 320,
      height: 50,
      src: "https://www.highrevenueformat.com/d256836a6c3a9df1296f3bb7aa360d0b/invoke.js"
    },
    "728x90": {
      key: "4189f10ddd4c5a29615098d720d8d201",
      width: 728,
      height: 90,
      src: "https://www.highrevenueformat.com/4189f10ddd4c5a29615098d720d8d201/invoke.js"
    },
    "160x600": {
      key: "81641170811e715b881de8d540b51c24",
      width: 160,
      height: 600,
      src: "https://www.highrevenueformat.com/81641170811e715b881de8d540b51c24/invoke.js"
    },
    "160x300": {
      key: "95a6ad6072adf19808bd1ee31a0decc2",
      width: 160,
      height: 300,
      src: "https://www.highrevenueformat.com/95a6ad6072adf19808bd1ee31a0decc2/invoke.js"
    },
    "468x60": {
      key: "11e00f9470e9822a6c9a855e965735c9",
      width: 468,
      height: 60,
      src: "https://www.highrevenueformat.com/11e00f9470e9822a6c9a855e965735c9/invoke.js"
    },
    "300x250": {
      key: "2bb021e96157106e059b9c3fb953097c",
      width: 300,
      height: 250,
      src: "https://www.highrevenueformat.com/2bb021e96157106e059b9c3fb953097c/invoke.js"
    }
  };

  function bannerHTML(cfg) {
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;width:${cfg.width}px;height:${cfg.height}px}</style></head><body><script>window.atOptions={key:'${cfg.key}',format:'iframe',height:${cfg.height},width:${cfg.width},params:{}};<\/script><script src="${cfg.src}"><\/script></body></html>`;
  }

  function nativeHTML() {
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;max-width:100%}#container-0c83a8f3b97ddff77d6e83ecad5c5ac3{max-width:100%}</style></head><body><script async data-cfasync="false" src="https://pl31108420.profitableratecpmnetwork.com/0c83a8f3b97ddff77d6e83ecad5c5ac3/invoke.js"><\/script><div id="container-0c83a8f3b97ddff77d6e83ecad5c5ac3"></div></body></html>`;
  }

  function makeFrame(slot, html, width, height, title) {
    if (!slot || slot.dataset.loaded === "1") return;
    const frame = document.createElement("iframe");
    frame.className = "ad-frame";
    frame.title = title || "Advertisement";
    frame.loading = "lazy";
    frame.referrerPolicy = "no-referrer-when-downgrade";
    frame.setAttribute("scrolling", "no");
    frame.setAttribute("frameborder", "0");
    const available = Math.max(1, slot.clientWidth || window.innerWidth || width);
    const scale = Math.min(1, available / width);

    frame.style.width = `${width}px`;
    frame.style.height = `${height}px`;
    frame.style.transformOrigin = "top center";
    frame.style.transform = `scale(${scale})`;
    frame.style.flex = "0 0 auto";
    frame.srcdoc = html;

    const holder = document.createElement("div");
    holder.className = "ad-scale-holder";
    holder.style.width = `${Math.min(width, available)}px`;
    holder.style.height = `${Math.ceil(height * scale)}px`;
    holder.style.maxWidth = "100%";
    holder.style.overflow = "hidden";
    holder.style.display = "flex";
    holder.style.justifyContent = "center";
    holder.appendChild(frame);

    slot.appendChild(holder);
    slot.dataset.loaded = "1";
  }

  function loadSlot(slot) {
    const type = slot.dataset.adSlot;
    if (type === "responsive-top") {
      const typeToUse = window.matchMedia("(min-width: 760px)").matches ? "728x90" : "320x50";
      const cfg = BANNERS[typeToUse];
      makeFrame(slot, bannerHTML(cfg), cfg.width, cfg.height, `${typeToUse} advertisement`);
      return;
    }
    if (type === "player-responsive") {
      const typeToUse = window.matchMedia("(min-width: 760px)").matches ? "468x60" : "320x50";
      const cfg = BANNERS[typeToUse];
      makeFrame(slot, bannerHTML(cfg), cfg.width, cfg.height, `${typeToUse} in-player advertisement`);
      return;
    }
    if (type === "native") {
      makeFrame(slot, nativeHTML(), 420, 280, "Native advertisement");
      return;
    }
    const cfg = BANNERS[type];
    if (!cfg) return;
    makeFrame(slot, bannerHTML(cfg), cfg.width, cfg.height, `${type} advertisement`);
  }

  function loadVisibleAds() {
    document.querySelectorAll("[data-ad-slot]").forEach(slot => {
      // Player ad is loaded only when the player is actually opened,
      // otherwise the hidden modal has no reliable width for scaling.
      if (slot.dataset.adSlot === "player-responsive") return;
      if (slot.closest(".ad-zone-wide-only") && !window.matchMedia("(min-width: 1180px)").matches) return;
      loadSlot(slot);
    });
  }

  function loadGlobalScript(src, id) {
    if (document.getElementById(id)) return;
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    document.body.appendChild(script);
  }

  function init() {
    loadVisibleAds();

    // Social bar may load globally. The popunder is deliberately NOT loaded
    // here because global click interception can make navigation controls feel
    // like they require a second tap, especially on mobile.
    loadGlobalScript(
      "https://pl31108421.profitableratecpmnetwork.com/95/3d/21/953d216fb120ca0cfbf6d32af9dadec6.js",
      "thiraix-socialbar-ad"
    );
  }

  let resizeTimer = null;
  function rescaleLoadedAds() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      document.querySelectorAll("[data-ad-slot]").forEach(slot => {
        const holder = slot.querySelector(".ad-scale-holder");
        const frame = holder?.querySelector(".ad-frame");
        if (!holder || !frame) return;
        const originalWidth = Number.parseFloat(frame.style.width) || frame.offsetWidth || 1;
        const originalHeight = Number.parseFloat(frame.style.height) || frame.offsetHeight || 1;
        const available = Math.max(1, slot.clientWidth || document.documentElement.clientWidth);
        const scale = Math.min(1, available / originalWidth);
        frame.style.transform = `scale(${scale})`;
        holder.style.width = `${Math.min(originalWidth, available)}px`;
        holder.style.height = `${Math.ceil(originalHeight * scale)}px`;
      });
    }, 80);
  }

  window.addEventListener("resize", rescaleLoadedAds, { passive: true });
  window.addEventListener("orientationchange", rescaleLoadedAds, { passive: true });
  window.visualViewport?.addEventListener("resize", rescaleLoadedAds, { passive: true });

  window.addEventListener("thiraix:player-ad-show", () => {
    const slot = document.querySelector('[data-ad-slot="player-responsive"]');
    if (slot) loadSlot(slot);
    // Do not arm the popunder while the player is open. Popunder click
    // interception causes first-tap failures on playback controls.
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
