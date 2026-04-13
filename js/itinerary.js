// itinerary.js — Today tab + Schedule tab

// ── Shared helpers ─────────────────────────────────────────

function _itinFmtDate(dateStr) {
  return window.fmtDate ? fmtDate(dateStr) : dateStr;
}

function _loadNote(date) {
  try { return localStorage.getItem('note_' + date) || ''; } catch(e) { return ''; }
}
function _saveNote(date, val) {
  try { localStorage.setItem('note_' + date, val); } catch(e) {}
}

function _renderActivity(act) {
  const name       = act.activity || act.name || '';
  const desc       = act.notes    || act.description || '';
  const hasMap     = name.trim().length > 0;
  const isSumo     = /sumo/i.test(name);
  const isSuzuka   = /suzuka/i.test(name);
  const notJrPass  = act.non_jr_pass || /not jr pass/i.test(desc);

  return `
    <div class="activity-item${notJrPass ? ' activity-not-jr' : ''}">
      <div class="activity-time">${escHtml(act.time || '')}</div>
      <div class="activity-body">
        <div class="activity-name">${escHtml(name)}</div>
        ${notJrPass ? `<div class="not-jr-badge">⚠️ NOT JR Pass — separate ticket</div>` : ''}
        ${desc ? `<div class="activity-desc">${escHtml(desc)}</div>` : ''}
        <div class="activity-actions">
          ${hasMap ? `<a href="${mapLink(name)}" target="_blank" rel="noopener" class="map-btn">🗺 Map</a>` : ''}
          ${isSumo   ? `<button class="learn-link-btn" onclick="window.openLearnTopic('sumo')">📖 Sumo Guide</button>` : ''}
          ${isSuzuka ? `<button class="learn-link-btn" onclick="window.openLearnTopic('suzuka')">🏎️ Suzuka Guide</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

// ── Tab 1: Today ───────────────────────────────────────────
// Shows countdown + pre-trip to-do (before trip),
// a today-at-a-glance card (during trip),
// and a trip complete banner (after trip).

function renderItinerary() {
  const data = window.TripData;
  const container = document.getElementById('itinerary-content');
  if (!container || !data) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tripStart = new Date('2026-05-12T00:00:00');
  const tripEnd   = new Date('2026-05-25T00:00:00');
  const todayStr  = today.toISOString().slice(0, 10);

  container.innerHTML = '';

  // ── Before trip ──
  if (today < tripStart) {
    const diffDays = Math.ceil((tripStart - today) / 86400000);

    const countdownEl = document.createElement('div');
    countdownEl.className = 'countdown-card';
    countdownEl.innerHTML = `
      <div class="countdown-flag">🇯🇵</div>
      <div class="countdown-days">${diffDays}</div>
      <div class="countdown-label">day${diffDays !== 1 ? 's' : ''} until Japan!</div>
      <div class="countdown-dates">May 12 – 25, 2026 · ${data.trip.route.join(' → ')}</div>
    `;
    container.appendChild(countdownEl);

    const todoWrap = document.createElement('div');
    todoWrap.id = 'pretodo-wrap';
    container.appendChild(todoWrap);
    renderPreTripTodos(todoWrap, data);
    return;
  }

  // ── During trip ──
  if (today <= tripEnd) {
    const dayMap = {};
    data.itinerary.forEach(d => { dayMap[d.date] = d; });
    const day = dayMap[todayStr];

    const card = document.createElement('div');
    card.className = 'today-glance-card';
    if (day) {
      card.innerHTML = `
        <div class="today-glance-label">TODAY</div>
        <div class="today-glance-title">${escHtml(day.label)}</div>
        <div class="today-glance-meta">
          <span>📍 ${escHtml(day.city)}</span>
          <span>📅 ${_itinFmtDate(day.date)}</span>
          <span>Day ${day.day}</span>
        </div>
        <button class="today-glance-btn" onclick="window.switchTab('schedule')">View Full Schedule →</button>
      `;
    } else {
      card.innerHTML = `
        <div class="today-glance-label">🇯🇵 JAPAN 2026</div>
        <div class="today-glance-title">You're in Japan!</div>
        <button class="today-glance-btn" onclick="window.switchTab('schedule')">View Schedule →</button>
      `;
    }
    container.appendChild(card);
    return;
  }

  // ── After trip ──
  const summaryEl = document.createElement('div');
  summaryEl.className = 'trip-summary-card';
  summaryEl.innerHTML = `
    <div style="font-size:2.5rem;margin-bottom:8px">🎌</div>
    <div style="font-size:1.3rem;font-weight:800;margin-bottom:6px">Trip Complete!</div>
    <div style="opacity:0.8;font-size:0.9rem">May 12 – 25, 2026<br>${data.trip.route.join(' → ')}</div>
  `;
  container.appendChild(summaryEl);
}

// ── Pre-trip to-do list ────────────────────────────────────

function renderPreTripTodos(wrap, data) {
  const bookings = data.bookings_checklist || data.bookings || [];

  function isChecked(id) {
    try { return !!localStorage.getItem('booking_' + id); } catch(e) { return false; }
  }
  function toggleItem(id) {
    try {
      if (localStorage.getItem('booking_' + id)) localStorage.removeItem('booking_' + id);
      else localStorage.setItem('booking_' + id, '1');
    } catch(e) {}
  }

  function draw() {
    const done  = bookings.filter(b => b.done || isChecked(b.id)).length;
    const total = bookings.length;
    const pct   = total ? Math.round((done / total) * 100) : 0;

    const priorityOrder = ['URGENT', 'HIGH', 'MEDIUM'];
    const priorityEmoji = { URGENT: '🔴', HIGH: '🟠', MEDIUM: '🟡' };
    const priorityClass = { URGENT: 'priority-urgent', HIGH: 'priority-high', MEDIUM: 'priority-medium' };

    let html = `
      <div class="pretodo-header">
        <div class="pretodo-title">📋 Before You Go — Pre-Trip To-Do</div>
        <div class="pretodo-count">${done} of ${total} done</div>
      </div>
      <div class="pretodo-progress">
        <div class="pretodo-progress-fill" style="width:${pct}%"></div>
      </div>
    `;

    priorityOrder.forEach(priority => {
      const items = bookings.filter(b => b.priority === priority);
      if (!items.length) return;
      html += `<div class="pretodo-group-label">${priorityEmoji[priority]} ${priority}</div>`;
      items.forEach(b => {
        const checked = b.done || isChecked(b.id);
        const whereLabel = b.where_to_book || b.where || '';
        html += `
          <div class="pretodo-item ${checked ? 'done' : ''}" data-id="${escHtml(b.id)}">
            <div class="pretodo-check">${checked ? '✓' : ''}</div>
            <div class="pretodo-body">
              <div class="pretodo-name">
                <span class="priority-badge ${priorityClass[priority]}">${priority}</span>
                ${escHtml(b.item)}
              </div>
              ${whereLabel ? `<div class="pretodo-where">${b.url
                ? `<a href="${escHtml(b.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">🔗 ${escHtml(whereLabel)}</a>`
                : `📋 ${escHtml(whereLabel)}`
              }</div>` : ''}
              ${b.sale_date_austin ? `
              <div class="pretodo-sale-alert">
                <span>⏰</span>
                <div>
                  <strong>${escHtml(b.sale_date_austin)}</strong>
                  <div class="pretodo-sale-jp">${escHtml(b.sale_date_japan)}</div>
                </div>
              </div>` : ''}
            </div>
          </div>
        `;
      });
    });

    wrap.innerHTML = html;

    wrap.querySelectorAll('.pretodo-item').forEach(el => {
      el.addEventListener('click', () => {
        toggleItem(el.dataset.id);
        draw();
        const checklistsPanel = document.getElementById('tab-checklists');
        if (checklistsPanel && checklistsPanel.querySelector('.checklist-section')) {
          renderChecklists();
        }
      });
    });
  }

  draw();
}

// ── Tab 2: Schedule (day picker + full itinerary) ──────────

function renderSchedule() {
  const data = window.TripData;
  const container = document.getElementById('schedule-content');
  if (!container || !data) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tripStart = new Date('2026-05-12T00:00:00');
  const tripEnd   = new Date('2026-05-25T00:00:00');

  let initialDate;
  if (today < tripStart)     initialDate = '2026-05-12';
  else if (today > tripEnd)  initialDate = '2026-05-25';
  else                       initialDate = today.toISOString().slice(0, 10);

  let currentDate = initialDate;

  const dayMap = {};
  data.itinerary.forEach(d => { dayMap[d.date] = d; });
  const dates = data.itinerary.map(d => d.date).sort();

  window.goToDay = function(date) {
    if (dayMap[date]) { currentDate = date; renderDay(); }
  };

  function render() {
    container.innerHTML = '';

    // Sticky day picker strip
    const strip = document.createElement('div');
    strip.className = 'day-picker';
    strip.id = 'day-picker-strip';
    dates.forEach(date => {
      const d = dayMap[date];
      const pill = document.createElement('button');
      pill.className = 'day-pill';
      if (date === currentDate) pill.classList.add('active');
      if (date === today.toISOString().slice(0, 10)) pill.classList.add('today');
      const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][new Date(date + 'T00:00:00').getMonth()];
      pill.textContent = `${mo}-${date.slice(8)}${d.suzuka_day ? ' 🏎️' : ''}`;
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

    const dayArea = document.createElement('div');
    dayArea.id = 'day-area';
    container.appendChild(dayArea);

    renderDay();

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
      <div class="day-nav">
        <button class="day-nav-arrow" id="prev-day" ${!prevDate ? 'disabled' : ''}>‹</button>
        <div class="day-nav-center">
          <div class="day-nav-date">${_itinFmtDate(day.date)}${isToday ? ' · <span style="color:var(--red);font-weight:700">TODAY</span>' : ''}</div>
          <div class="day-nav-title">${escHtml(day.label)}</div>
        </div>
        <button class="day-nav-arrow" id="next-day" ${!nextDate ? 'disabled' : ''}>›</button>
      </div>

      <div class="day-header">
        <div class="day-header-num">Day ${day.day} of ${dates.length}</div>
        <div class="day-header-title">${escHtml(day.label)}</div>
        <div class="day-header-meta">
          <span>📍 ${escHtml(day.city)}</span>
          <span>🏨 ${escHtml(day.hotel)}</span>
        </div>
        ${(day.luggage_forward || day.fuji_view_alert || day.rest_day) ? `
        <div class="day-badges">
          ${day.luggage_forward ? `<span class="day-badge badge-luggage">🧳 Luggage Forward Day</span>` : ''}
          ${day.fuji_view_alert ? `<span class="day-badge badge-fuji">🗻 Mt Fuji View Day</span>` : ''}
          ${day.rest_day ? `<span class="day-badge badge-rest">😌 Rest Day</span>` : ''}
        </div>` : ''}
      </div>

      ${day.suzuka_day ? `
      <div class="suzuka-alert">
        <div class="suzuka-alert-flag">🏁</div>
        <div class="suzuka-alert-body">
          <div class="suzuka-alert-title">SUZUKA CIRCUIT DAY — Super Formula Race + Pit Walk 🏎️</div>
          <div class="suzuka-alert-msg">⚠️ <strong>Kintetsu to Shiroko is NOT covered by JR Pass.</strong> Buy tickets at Nagoya Station EAST exit (~¥1,720 each way). Buy BOTH outbound + return at same time.</div>
        </div>
      </div>` : ''}

      <div class="activity-list" id="activity-list-${day.date}">
        ${(day.schedule || []).map(act => _renderActivity(act)).join('')}
      </div>

      ${day.optional ? (() => {
        const entries = Object.entries(day.optional);
        return entries.map(([key, val]) => `
        <details class="optional-block">
          <summary class="optional-summary">⏱️ Optional if time allows — ${escHtml(key.replace(/_/g,' '))}</summary>
          <div class="optional-body">${escHtml(val)}</div>
        </details>`).join('');
      })() : ''}

      ${day.tips && day.tips.length ? `
      <div class="tips-section">
        <div class="tips-title">💡 Tips for today</div>
        ${day.tips.map(t => `<div class="tip-item">${escHtml(t)}</div>`).join('')}
      </div>` : ''}

      <div class="notes-section">
        <div class="notes-label">📝 My Notes</div>
        <textarea class="notes-textarea" id="notes-${day.date}" placeholder="Add personal notes for this day…">${escHtml(_loadNote(day.date))}</textarea>
      </div>
    `;

    dayArea.querySelector('#prev-day').addEventListener('click', () => {
      if (prevDate) { currentDate = prevDate; renderDay(); updatePills(); }
    });
    dayArea.querySelector('#next-day').addEventListener('click', () => {
      if (nextDate) { currentDate = nextDate; renderDay(); updatePills(); }
    });

    const noteTA = dayArea.querySelector(`#notes-${day.date}`);
    if (noteTA) noteTA.addEventListener('input', () => _saveNote(day.date, noteTA.value));

    window.scrollTo(0, 0);
  }

  // ── Swipe support ──────────────────────────────────────────
  let touchStartX = 0;
  container.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  container.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 60) return;
    const idx = dates.indexOf(currentDate);
    if (dx < 0 && idx < dates.length - 1) { currentDate = dates[idx + 1]; renderDay(); updatePills(); }
    else if (dx > 0 && idx > 0)            { currentDate = dates[idx - 1]; renderDay(); updatePills(); }
  }, { passive: true });

  render();
}
