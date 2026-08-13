(() => {
  const STORE = 'dart-score-v16-big-scoreboard';
  const SYNC_KEY_STORE = 'dart-score-sync-key';
  const nativeSetItem = Storage.prototype.setItem;
  let syncEnabled = false;
  let syncTimer = null;
  let lastSyncedPayload = '';

  function getSyncKey() {
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get('sync');
    if (fromUrl) {
      nativeSetItem.call(localStorage, SYNC_KEY_STORE, fromUrl);
      url.searchParams.delete('sync');
      history.replaceState({}, '', url.pathname + url.search + url.hash);
      return fromUrl;
    }
    return localStorage.getItem(SYNC_KEY_STORE) || '';
  }

  const syncKey = getSyncKey();

  async function api(method, body) {
    if (!syncKey) return null;
    const res = await fetch('/api/state', {
      method,
      headers: {
        'content-type': 'application/json',
        'x-dart-sync-key': syncKey,
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Cloud sync failed: ${res.status}`);
    return res.status === 204 ? null : res.json();
  }

  function queueSync(value) {
    if (!syncEnabled || !syncKey || value === lastSyncedPayload) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(async () => {
      try {
        const parsed = JSON.parse(value);
        await api('PUT', { state: parsed });
        lastSyncedPayload = value;
        window.dispatchEvent(new CustomEvent('dart-cloud-status', { detail: 'synced' }));
      } catch (err) {
        console.warn(err);
        window.dispatchEvent(new CustomEvent('dart-cloud-status', { detail: 'error' }));
      }
    }, 750);
  }

  Storage.prototype.setItem = function (key, value) {
    nativeSetItem.call(this, key, value);
    if (this === localStorage && key === STORE) queueSync(value);
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  async function boot() {
    if (syncKey) {
      try {
        const remote = await api('GET');
        if (remote?.state && Object.keys(remote.state).length) {
          const payload = JSON.stringify(remote.state);
          nativeSetItem.call(localStorage, STORE, payload);
          lastSyncedPayload = payload;
        }
      } catch (err) {
        console.warn('Starter med lokal lagring fordi skydata ikke kunne lastes.', err);
      }
    } else {
      console.info('DART SCORE: cloud sync er deaktivert. Åpne appen én gang med ?sync=DIN_NØKKEL.');
    }

    await loadScript('roasts.js');
    await loadScript('app.js');
    syncEnabled = true;

    const current = localStorage.getItem(STORE);
    if (current && syncKey && current !== lastSyncedPayload) queueSync(current);
  }

  boot().catch(err => {
    console.error('Kunne ikke starte DART SCORE', err);
    loadScript('roasts.js').then(() => loadScript('app.js'));
  });
})();
