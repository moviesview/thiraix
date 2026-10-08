/* Static browser-only enhancements: no server or build step required. */
const safeStorage = {
  getItem(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
  setItem(key, value) { try { localStorage.setItem(key, value); } catch (_) {} },
  removeItem(key) { try { localStorage.removeItem(key); } catch (_) {} }
};
let loadingWatchdog = null;
let pendingSourceRestore = null;
let pendingResumeRestore = null;
let returnFocus = null;
let controlsLocked = false;
let playbackAttempt = 0;
function clearMetadataCallbacks() {
  playbackAttempt++;
  if (pendingSourceRestore) els.video.removeEventListener('loadedmetadata', pendingSourceRestore);
  if (pendingResumeRestore) els.video.removeEventListener('loadedmetadata', pendingResumeRestore);
  pendingSourceRestore = pendingResumeRestore = null;
}
function clearPlaybackNotice() {
  document.querySelector('#playbackNotice')?.classList.add('hidden');
}
function showPlaybackFailure(message = 'Unable to play this video. The source may be unavailable or its link may have expired.') {
  hideVideoLoader();
  document.querySelector('#playbackMessage').textContent = message;
  document.querySelector('#retryPlayback').textContent = 'Retry video';
  document.querySelector('#playbackNotice').classList.remove('hidden');
  showControls();
}
function requestPlayback() {
  const attempt = playbackAttempt;
  const promise = els.video.play();
  if (promise?.catch) promise.catch(error => {
    if (attempt !== playbackAttempt || !currentVideo || error.name === 'AbortError') return;
    if (error.name === 'NotAllowedError') {
      showPlaybackFailure('Tap Play to start watching.');
      document.querySelector('#retryPlayback').textContent = 'Play';
    } else showPlaybackFailure();
  });
}
function getSeries(id) { return (window.THIRAI_X_SERIES || []).find(series => series.id === id); }
function findPlayableVideo(id) {
  return videos.find(v => String(v.id) === String(id)) || (window.THIRAI_X_SERIES || []).flatMap(s => s.episodes).find(v => v.id === String(id));
}
function renderEpisodes(v) {
  const series = getSeries(v.seriesId);
  document.querySelector('#episodePanel').classList.toggle('hidden', !series);
  const list = document.querySelector('#episodeList'); list.replaceChildren();
  if (!series) return;
  safeStorage.setItem(`thiraix:series:${series.id}`, v.id);
  for (const episode of series.episodes) {
    const button = document.createElement('button'); button.type = 'button';
    button.textContent = `Episode ${episode.episode}`;
    button.classList.toggle('active', episode.id === v.id);
    if (episode.id === v.id) button.setAttribute('aria-current', 'true');
    button.addEventListener('click', () => { if (currentVideo?.id !== episode.id) openPlayer(episode); });
    list.appendChild(button);
  }
  const nextButton = document.querySelector('#nextEpisode');
  nextButton.disabled = v.episode >= series.episodes.length;
  nextButton.textContent = nextButton.disabled ? 'Final episode' : 'Next episode →';
}
function rememberWatching() {
  if (!currentVideo || !Number.isFinite(els.video.currentTime)) return;
  let records;
  try { records = JSON.parse(safeStorage.getItem('thiraix:watching') || '[]'); } catch (_) { records = []; }
  if (!Array.isArray(records)) records = [];
  const group = currentVideo.seriesId || String(currentVideo.id);
  records = records.filter(item => item.group !== group);
  if (!els.video.ended && els.video.currentTime > 3 && (!Number.isFinite(els.video.duration) || els.video.duration - els.video.currentTime >= 15)) {
    records.unshift({ group, id: currentVideo.id, title: currentVideo.title, thumbnail: currentVideo.thumbnail || '', collection: currentVideo.seriesId ? 'series' : activeCollectionId, time: els.video.currentTime, duration: Number.isFinite(els.video.duration) ? els.video.duration : 0, updated: Date.now() });
  }
  safeStorage.setItem('thiraix:watching', JSON.stringify(records.slice(0, 20)));
}
function setControlLock(locked) {
  controlsLocked = locked;
  els.stage.classList.toggle('controls-locked', locked);
  document.querySelector('#unlockControls').classList.toggle('hidden', !locked);
}
function initPlayerImprovements() {
  document.querySelector('#retryPlayback').addEventListener('click', () => {
    const playOnly = document.querySelector('#retryPlayback').textContent === 'Play';
    clearPlaybackNotice();
    if (playOnly) requestPlayback();
    else {
      persistPlaybackPosition();
      // Reopening the record retains the saved position, even after an error.
      const record = currentVideo;
      if (record) openPlayer(record, { skipHistory: true });
    }
  });
  document.querySelector('#restartPlayback').addEventListener('click', () => {
    if (!currentVideo) return;
    clearMetadataCallbacks();
    safeStorage.removeItem(playbackStorageKey());
    els.video.currentTime = 0;
    requestPlayback();
  });
  document.querySelector('#lockControls').addEventListener('click', () => setControlLock(true));
  document.querySelector('#unlockControls').addEventListener('click', event => { event.stopPropagation(); setControlLock(false); showControls(); });
  document.querySelector('#theatreToggle').addEventListener('click', event => {
    const enabled = els.modal.classList.toggle('theatre-mode');
    event.currentTarget.setAttribute('aria-pressed', String(enabled));
    event.currentTarget.textContent = enabled ? 'Exit theatre mode' : 'Theatre mode';
  });
  const pip = document.querySelector('#pipToggle');
  if (document.pictureInPictureEnabled && els.video.requestPictureInPicture) {
    pip.classList.remove('hidden');
    pip.addEventListener('click', async () => {
      try {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else await els.video.requestPictureInPicture();
      } catch (_) { pip.textContent = 'Mini player unavailable'; }
    });
    els.video.addEventListener('leavepictureinpicture', () => { pip.textContent = 'Mini player'; });
  }
  document.querySelector('#autoNext').checked = safeStorage.getItem('thiraix:auto-next') !== 'false';
  document.querySelector('#autoNext').addEventListener('change', e => safeStorage.setItem('thiraix:auto-next', String(e.target.checked)));
  document.querySelector('#nextEpisode').addEventListener('click', () => {
    const series = getSeries(currentVideo?.seriesId);
    const next = series?.episodes.find(ep => ep.episode === currentVideo.episode + 1);
    if (next) openPlayer(next);
  });
  // A capture handler blocks accidental player gestures while locked.
  for (const type of ['click', 'pointerdown', 'pointerup', 'touchstart', 'touchend']) {
    els.stage.addEventListener(type, e => {
      if (controlsLocked && !e.target.closest('#unlockControls')) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, { capture: true, passive: false });
  }
  window.addEventListener('pagehide', persistPlaybackPosition);
  document.addEventListener('visibilitychange', () => { if (document.hidden) persistPlaybackPosition(); });
  document.addEventListener('keydown', e => {
    if (els.modal.classList.contains('hidden') || e.key !== 'Tab') return;
    const scope = els.playerMenu.classList.contains('hidden') ? els.modal : els.playerMenu;
    const focusable = [...scope.querySelectorAll('button, input, a[href], [tabindex="0"]')].filter(node => !node.disabled && node.getClientRects().length);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && (document.activeElement === first || !scope.contains(document.activeElement))) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !scope.contains(document.activeElement))) { e.preventDefault(); first?.focus(); }
  });
}
