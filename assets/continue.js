(() => {
  const main = document.querySelector('main');
  if (!main) return;
  const section = document.createElement('section'); section.className = 'continue-section hidden';
  const heading = document.createElement('h2'); heading.textContent = 'Continue watching';
  const list = document.createElement('div'); list.className = 'continue-list';
  section.append(heading, list); main.prepend(section);
  function renderContinue() {
    let records;
    try { records = JSON.parse(localStorage.getItem('thiraix:watching') || '[]'); } catch (_) { records = []; }
    if (!Array.isArray(records)) records = [];
    list.replaceChildren();
    for (const item of records.slice(0, 12)) {
      if (!item || !item.id || typeof item.title !== 'string' || !Number.isFinite(item.time)) continue;
      const card = document.createElement('article'); card.className = 'continue-card';
      const link = document.createElement('a');
      link.href = `collection.html?collection=${encodeURIComponent(item.collection || 'mcu')}&video=${encodeURIComponent(item.id)}`;
      const title = document.createElement('strong'); title.textContent = item.title;
      const detail = document.createElement('span'); detail.textContent = `Resume from ${Math.floor(item.time / 60)}:${String(Math.floor(item.time % 60)).padStart(2, '0')} →`;
      const progress = document.createElement('progress'); progress.max = item.duration > 0 ? item.duration : Math.max(1, item.time); progress.value = item.time; progress.setAttribute('aria-label', 'Watch progress');
      link.append(title, detail, progress);
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `Remove ${item.title} from Continue watching`);
      remove.addEventListener('click', () => {
        try {
          const fresh = JSON.parse(localStorage.getItem('thiraix:watching') || '[]');
          localStorage.setItem('thiraix:watching', JSON.stringify(fresh.filter(v => v.group !== item.group)));
          localStorage.removeItem(`thiraix:resume:${item.id}`);
        } catch (_) {}
        renderContinue();
      });
      card.append(link, remove); list.append(card);
    }
    section.classList.toggle('hidden', !list.children.length);
  }
  window.addEventListener('thiraix:resume-updated', renderContinue);
  window.addEventListener('storage', renderContinue);
  window.addEventListener('pageshow', renderContinue);
  renderContinue();
})();
