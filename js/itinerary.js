// itinerary.js — Today / Itinerary tab

function renderItinerary() {
  const data = window.TripData;
  const container = document.getElementById('itinerary-content');
  if (!container || !data) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tripStart = new Date('2026-05-12T00:00:00');
  const tripEnd   = new Date('2026-05-25T00:00:00');

  // Determine initial day to show
  let initialDate;
  if (today < tripStart) {
    initialDate = '2026-05-12'; // Show first day before trip
  } else if (today > tripEnd) {
    initialDate = '2026-05-25'; // Show last day after trip
  } else {
    initialDate = today.toISOString().slice(0, 10);
  }

  // State
  let currentDate = initialDate;

  // Build day index
  const dayMap = {};
  data.itinerary.forEach(d => { dayMap[d.date] = d; });
  const dates = data.itinerary.map(d => d.date);

  // ── Expose goToDay globally (used by search) ──────────────
  window.goToDay = function(date) {
    if (dayMap[date]) {
      currentDate = date;
      renderDay();
    }
  };

  // ── Main render ────────────────────────────────────────────
  function render() {
    container.innerHTML = '';

    // Before trip: countdown
    if (today < tripStart) {
      const diffMs = tripStart - today;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const countdownEl = document.createElement('div');
      countdownEl.className = 'countdown-card';
      countdownEl.innerHTML = `
        <div class="countdown-flag">🇯🇵</div>
        <div class="countdown-days">${diffDays}</div>
        <div class="countdown-label">day${diffDays !== 1 ? 's' : ''} until Japan!</div>
        <div class="countdown-dates">May 12 – 25, 2026 · ${data.trip.route.join(' → ')}</div>
      `;
      container.appendChild(countdownEl);
    }

    // After trip: summary banner
    if (today > tripEnd) {
      const summaryEl = document.createElement('div');
      summaryEl.className = 'trip-summary-card';
      summaryEl.innerHTML = `
        <div style="font-size:2.5rem;margin-bottom:8px">🎌</div>
        <div style="font-size:1.3rem;font-weight:800;margin-bottom:6px">Trip Complete!</div>
        <div style="opacity:0.8;font-size:0.9rem">May 12 – 25, 2026<br>${data.trip.route.join(' → ')}</div>
      `;
      container.appendChild(summaryEl);
    }

    // Day picker strip
    const strip = document.createElement('div');
    strip.className = 'day-picker';
    strip.id = 'day-picker-strip';
    dates.forEach(date => {
      const d = dayMap[date];
      const pill = document.createElement('button');
      pill.className = 'day-pill';
      if (date === currentDate) pill.classList.add('active');
      const isToday = date === today.toISOString().slice(0, 10);
      if (isToday) pill.classList.add('today');
      pill.textContent = `${d.day_num} · ${date.slice(5)}`;
      pill.dataset.date = date;
      pill.addEventListener('click', () => {
        currentDate = date;
        renderDay();
        updatePills();
        scrollPillIntoView(pill);
      });
      strip.appendChild(pill);
    });
    container.appendChild(strip);

    // Day content area
    const dayArea = document.createElement('div');
    dayArea.id = 'day-area';
    container.appendChild(dayArea);

    renderDay();

    // Scroll active pill into view on load
    requestAnimationFrame(() => {
      const activePill = strip.querySelector('.day-pill.active');
      if (activePill) scrollPillIntoView(activePill);
    });
  }

  function updatePills() {
    document.querySelectorAll('.day-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.date === currentDate);
    });
  }

  function scrollPillIntoView(pill) {
    const strip = document.getElementById('day-picker-strip');
    if (!strip || !pill) return;
    const stripRect = strip.getBoundingClientRect();
    const pillRect  = pill.getBoundingClientRect();
    const offset = pillRect.left - stripRect.left - (stripRect.width / 2) + (pillRect.width / 2);
    strip.scrollBy({ left: offset, behavior: 'smooth' });
  }

  function renderDay() {
    const dayArea = document.getElementById('day-area');
    if (!dayArea) return;

    const day = dayMap[currentDate];
    if (!day) { dayArea.innerHTML = ''; return; }

    const idx = dates.indexOf(currentDate);
    const prevDate = idx > 0 ? dates[idx - 1] : null;
    const nextDate = idx < dates.length - 1 ? dates[idx + 1] : null;
    const isToday  = currentDate === today.toISOString().slice(0, 10);

    dayArea.innerHTML = `
      <!-- Day Nav Arrows -->
      <div class="day-nav">
        <button class="day-nav-arrow" id="prev-day" ${!prevDate ? 'disabled' : ''}>‹</button>
        <div class="day-nav-center">
          <div class="day-nav-date">${fmtDate(day.date)}${isToday ? ' · <span style="color:var(--red);font-weight:700">TODAY</span>' : ''}</div>
          <div class="day-nav-title">${escHtml(day.title)}</div>
        </div>
        <button class="day-nav-arrow" id="next-day" ${!nextDate ? 'disabled' : ''}>›</button>
      </div>

      <!-- Day Header -->
      <div class="day-header">
        <div class="day-header-num">Day ${day.day_num} of ${dates.length}</div>
        <div class="day-header-title">${escHtml(day.title)}</div>
        <div class="day-header-meta">
          <span>📍 ${escHtml(day.city)}</span>
          <span>🏨 ${escHtml(day.hotel)}</span>
        </div>
      </div>

      <!-- Activities -->
      <div class="activity-list" id="activity-list-${day.date}">
        ${day.activities.map(act => renderActivity(act)).join('')}
      </div>

      <!-- Tips -->
      ${day.tips && day.tips.length ? `
      <div class="tips-section">
        <div class="tips-title">💡 Tips for today</div>
        ${day.tips.map(t => `<div class="tip-item">${escHtml(t)}</div>`).join('')}
      </div>` : ''}

      <!-- Notes -->
      <div class="notes-section">
        <div class="notes-label">📝 My Notes</div>
        <textarea class="notes-textarea" id="notes-${day.date}" placeholder="Add personal notes for this day…">${escHtml(loadNote(day.date))}</textarea>
      </div>
    `;

    // Wire prev/next arrows
    const prevBtn = dayArea.querySelector('#prev-day');
    const nextBtn = dayArea.querySelector('#next-day');
    if (prevBtn) prevBtn.addEventListener('click', () => { if (prevDate) { currentDate = prevDate; renderDay(); updatePills(); }});
    if (nextBtn) nextBtn.addEventListener('click', () => { if (nextDate) { currentDate = nextDate; renderDay(); updatePills(); }});

    // Wire notes autosave
    const noteTA = dayArea.querySelector(`#notes-${day.date}`);
    if (noteTA) {
      noteTA.addEventListener('input', () => saveNote(day.date, noteTA.value));
    }

    // Scroll panel to top
    window.scrollTo(0, 0);
  }

  function renderActivity(act) {
    const hasMap = act.map_query && act.map_query.trim();
    const isOnsen = act.name.includes('ONSEN') || act.name.includes('♨️');
    const isTaqbin = act.name.includes('TA-Q-BIN') || act.name.includes('⚠️');
    const isBucket = act.name.includes('BUCKET LIST') || act.name.includes('🗻') || act.name.includes('GRAN CLASS') || act.name.includes('GREEN CAR') || act.name.includes('FINAL');

    return `
      <div class="activity-item">
        <div class="activity-time">${escHtml(act.time || '')}</div>
        <div class="activity-body">
          <div class="activity-name">${escHtml(act.name)}</div>
          ${act.description ? `<div class="activity-desc">${escHtml(act.description)}</div>` : ''}
          ${act.transport ? `<div class="activity-transport">🚇 ${escHtml(act.transport)}</div>` : ''}
          <div class="activity-actions">
            ${hasMap ? `<a href="${mapLink(act.map_query)}" target="_blank" rel="noopener" class="map-btn">🗺 Map</a>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // ── Notes persistence ──────────────────────────────────────
  function loadNote(date) {
    try { return localStorage.getItem('note_' + date) || ''; } catch(e) { return ''; }
  }
  function saveNote(date, val) {
    try { localStorage.setItem('note_' + date, val); } catch(e) {}
  }

  // ── Swipe support ──────────────────────────────────────────
  let touchStartX = 0;
  container.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  container.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 60) return;
    const idx = dates.indexOf(currentDate);
    if (dx < 0 && idx < dates.length - 1) {
      // Swipe left → next day
      currentDate = dates[idx + 1];
      renderDay(); updatePills();
    } else if (dx > 0 && idx > 0) {
      // Swipe right → prev day
      currentDate = dates[idx - 1];
      renderDay(); updatePills();
    }
  }, { passive: true });

  render();
}
