// app.js — main app init, tab routing, search

(function() {

  // ── Register Service Worker ────────────────────────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }

  // ── Show loading screen ────────────────────────────────────
  const loadingEl = document.createElement('div');
  loadingEl.id = 'loading';
  loadingEl.innerHTML = '<div class="load-flag">🇯🇵</div><div class="load-text">Loading your Japan trip…</div>';
  document.body.appendChild(loadingEl);

  // ── Dynamic calendar badge ─────────────────────────────────
  (function() {
    const now = new Date();
    const monthEl = document.getElementById('cal-month');
    const dayEl   = document.getElementById('cal-day');
    if (monthEl && dayEl) {
      monthEl.textContent = now.toLocaleString('en-US', { month: 'short' });
      dayEl.textContent   = now.getDate();
    }
  })();

  // ── Tab routing ────────────────────────────────────────────
  const tabs = {
    itinerary:  { panel: document.getElementById('tab-itinerary'),  btn: null, rendered: false },
    schedule:   { panel: document.getElementById('tab-schedule'),   btn: null, rendered: false },
    hotels:     { panel: document.getElementById('tab-hotels'),     btn: null, rendered: false },
    trains:     { panel: document.getElementById('tab-trains'),     btn: null, rendered: false },
    onsens:     { panel: document.getElementById('tab-onsens'),     btn: null, rendered: false },
    checklists: { panel: document.getElementById('tab-checklists'), btn: null, rendered: false },
    learn:      { panel: document.getElementById('tab-learn'),      btn: null, rendered: false }
  };

  let activeTab = 'itinerary';

  document.querySelectorAll('.nav-btn').forEach(btn => {
    const t = btn.dataset.tab;
    if (tabs[t]) tabs[t].btn = btn;

    btn.addEventListener('click', () => switchTab(t));
  });

  function switchTab(name) {
    if (!tabs[name]) return;

    // Update panels
    Object.values(tabs).forEach(t => t.panel.classList.remove('active'));
    tabs[name].panel.classList.add('active');

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if (tabs[name].btn) tabs[name].btn.classList.add('active');

    // Update header title
    const titles = {
      itinerary:  '🇯🇵 Today',
      schedule:   '📅 Itinerary',
      hotels:     '🏨 Hotels',
      trains:     '🚄 Trains',
      onsens:     '♨️ Onsens',
      checklists: '✅ Checklists',
      learn:      '📚 Learn'
    };
    document.getElementById('header-title').textContent = titles[name] || '🇯🇵 Japan 2026';

    activeTab = name;

    // Lazy-render tabs on first visit
    if (!tabs[name].rendered) {
      tabs[name].rendered = true;
      switch (name) {
        case 'schedule':   renderSchedule();   break;
        case 'hotels':     renderHotels();     break;
        case 'trains':     renderTrains();     break;
        case 'onsens':     renderOnsens();     break;
        case 'checklists': renderChecklists(); break;
        case 'learn':      renderLearn();      break;
      }
    }

    // Scroll to top
    tabs[name].panel.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  // Expose switchTab globally (used by search results)
  window.switchTab = switchTab;

  // ── Search ─────────────────────────────────────────────────
  const searchBtn     = document.getElementById('search-btn');
  const searchOverlay = document.getElementById('search-overlay');
  const searchInput   = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const searchClose   = document.getElementById('search-close');

  searchBtn.addEventListener('click', () => {
    searchOverlay.classList.remove('hidden');
    setTimeout(() => searchInput.focus(), 100);
  });

  searchClose.addEventListener('click', closeSearch);

  searchOverlay.addEventListener('click', e => {
    if (e.target === searchOverlay) closeSearch();
  });

  function closeSearch() {
    searchOverlay.classList.add('hidden');
    searchInput.value = '';
    searchResults.innerHTML = '';
  }

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (q.length < 2) { searchResults.innerHTML = ''; return; }
    performSearch(q);
  });

  function performSearch(q) {
    if (!window.TripData) return;
    const data = window.TripData;
    const results = [];

    // Search itinerary activities
    data.itinerary.forEach(day => {
      (day.schedule || day.activities || []).forEach(act => {
        const name = act.activity || act.name || '';
        const desc = act.notes    || act.description || '';
        const haystack = (name + ' ' + desc + ' ' + (day.label || day.title || '') + ' ' + day.city).toLowerCase();
        if (haystack.includes(q)) {
          results.push({
            type: 'activity',
            day: day,
            activity: { ...act, name, description: desc },
            label: `Day ${day.day || day.day_num} · ${day.date.slice(5)} · ${day.city}`
          });
        }
      });
    });

    // Search hotels
    data.hotels.forEach(h => {
      const haystack = (h.name + ' ' + h.city + ' ' + h.notes).toLowerCase();
      if (haystack.includes(q)) {
        results.push({ type: 'hotel', hotel: h, label: 'Hotel · ' + h.city });
      }
    });

    // Search trains
    data.trains.forEach(t => {
      const haystack = (t.from + ' ' + t.to + ' ' + t.train + ' ' + t.class).toLowerCase();
      if (haystack.includes(q)) {
        results.push({ type: 'train', train: t, label: 'Train · ' + t.date.slice(5) });
      }
    });

    renderSearchResults(results, q);
  }

  function renderSearchResults(results, q) {
    if (results.length === 0) {
      searchResults.innerHTML = `<div class="search-empty">No results for "<strong>${escHtml(q)}</strong>"</div>`;
      return;
    }

    searchResults.innerHTML = results.slice(0, 20).map((r, i) => {
      if (r.type === 'activity') {
        return `<div class="search-result-item" data-index="${i}">
          <div class="sr-day">${escHtml(r.label)}</div>
          <div class="sr-name">${r.activity.time ? r.activity.time + ' · ' : ''}${escHtml(r.activity.name)}</div>
          ${r.activity.description ? `<div class="sr-desc">${escHtml(r.activity.description.slice(0, 80))}</div>` : ''}
        </div>`;
      } else if (r.type === 'hotel') {
        return `<div class="search-result-item" data-index="${i}">
          <div class="sr-day">${escHtml(r.label)}</div>
          <div class="sr-name">🏨 ${escHtml(r.hotel.name)}</div>
          <div class="sr-desc">${escHtml(r.hotel.city)} · Check-in ${r.hotel.check_in.slice(5)}</div>
        </div>`;
      } else if (r.type === 'train') {
        return `<div class="search-result-item" data-index="${i}">
          <div class="sr-day">${escHtml(r.label)}</div>
          <div class="sr-name">🚄 ${escHtml(r.train.from)} → ${escHtml(r.train.to)}</div>
          <div class="sr-desc">${escHtml(r.train.train)} · ${escHtml(r.train.class)}</div>
        </div>`;
      }
      return '';
    }).join('');

    searchResults.querySelectorAll('.search-result-item').forEach((el, i) => {
      el.addEventListener('click', () => {
        const r = results[i];
        closeSearch();
        if (r.type === 'activity') {
          switchTab('itinerary');
          setTimeout(() => {
            if (window.goToDay) window.goToDay(r.day.date);
          }, 50);
        } else if (r.type === 'hotel') {
          switchTab('hotels');
        } else if (r.type === 'train') {
          switchTab('trains');
        }
      });
    });
  }

  // ── Escape HTML helper (global) ────────────────────────────
  window.escHtml = function(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  // ── Map link helper (global) ───────────────────────────────
  window.mapLink = function(query) {
    if (!query) return '#';
    const encoded = encodeURIComponent(query);
    // iOS uses maps:// deep link; others use google maps
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return isIOS
      ? `maps://?q=${encoded}`
      : `https://maps.google.com/?q=${encoded}`;
  };

  // ── Format date helper (global) ───────────────────────────
  window.fmtDate = function(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  // ── Init ───────────────────────────────────────────────────
  window.loadTripData().then(() => {
    // Remove loading screen
    loadingEl.remove();

    // Render itinerary first (active tab)
    renderItinerary();
    tabs.itinerary.rendered = true;

  }).catch(err => {
    loadingEl.innerHTML = `<div class="load-flag">⚠️</div><div class="load-text">Failed to load trip data.<br>Please refresh.</div>`;
    console.error('Failed to load trip data:', err);
  });

})();
