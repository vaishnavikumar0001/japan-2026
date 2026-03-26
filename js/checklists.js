// checklists.js — Bookings + Experiences Checklists tab

function renderChecklists() {
  const data = window.TripData;
  const container = document.getElementById('checklists-content');
  if (!container || !data) return;

  // ── localStorage helpers ───────────────────────────────────
  function isChecked(key) {
    try { return !!localStorage.getItem(key); } catch(e) { return false; }
  }
  function toggle(key) {
    try {
      if (localStorage.getItem(key)) localStorage.removeItem(key);
      else localStorage.setItem(key, '1');
    } catch(e) {}
  }

  // ── Render ─────────────────────────────────────────────────
  function render() {
    const bookings    = data.bookings_checklist    || data.bookings    || [];
    const experiences = data.experiences_checklist || data.experiences || [];

    const bDone = bookings.filter(b => isChecked('booking_' + b.id)).length;
    const eDone = experiences.filter(e => isChecked('exp_' + e.id)).length;

    const bPct = bookings.length ? Math.round((bDone / bookings.length) * 100) : 0;
    const ePct = experiences.length ? Math.round((eDone / experiences.length) * 100) : 0;

    const html = [];

    // ── BOOKINGS SECTION ───────────────────────────────────
    html.push(`
      <div class="checklist-section">
        <div class="checklist-header">
          <div class="checklist-title">🎫 Bookings to Make</div>
          <button class="reset-btn" id="reset-bookings">Reset</button>
        </div>

        <div class="checklist-progress">
          <div class="checklist-progress-text">
            <span>${bDone} of ${bookings.length} done</span>
            <span>${bPct}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${bPct}%"></div>
          </div>
        </div>
    `);

    // Group by priority order
    const priorityOrder = ['URGENT', 'HIGH', 'MEDIUM'];
    priorityOrder.forEach(priority => {
      const items = bookings.filter(b => b.priority === priority);
      if (!items.length) return;

      html.push(`<div class="section-heading">${priorityEmoji(priority)} ${priority}</div>`);

      items.forEach(b => {
        const done = isChecked('booking_' + b.id);
        const priorityClass = 'priority-' + priority.toLowerCase();

        const whereLabel = b.where_to_book || b.where || '';
        html.push(`
          <div class="checklist-item ${done ? 'done' : ''}" data-key="booking_${escHtml(b.id)}">
            <div class="ci-checkbox">${done ? '✓' : ''}</div>
            <div class="ci-body">
              <div class="ci-name">
                <span class="priority-badge ${priorityClass}">${escHtml(priority)}</span>${escHtml(b.item)}
              </div>
              <div class="ci-meta">
                ${b.url
                  ? `<a href="${escHtml(b.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">🔗 ${escHtml(whereLabel)}</a>`
                  : `📋 ${escHtml(whereLabel)}`}
                ${b.notes ? ` · ${escHtml(b.notes)}` : ''}
              </div>
              ${b.sale_date_austin ? `
              <div class="sale-date-alert" onclick="event.stopPropagation()">
                <div class="sale-date-icon">⏰</div>
                <div class="sale-date-details">
                  <div class="sale-date-label">TICKETS ON SALE</div>
                  <div class="sale-date-chicago">${escHtml(b.sale_date_austin)}</div>
                  <div class="sale-date-japan">${escHtml(b.sale_date_japan)}</div>
                </div>
              </div>` : ''}
            </div>
          </div>
        `);
      });
    });

    html.push('</div>'); // end bookings section

    // ── EXPERIENCES SECTION ────────────────────────────────
    html.push(`
      <div class="checklist-section">
        <div class="checklist-header">
          <div class="checklist-title">⭐ Experiences</div>
          <button class="reset-btn" id="reset-experiences">Reset</button>
        </div>

        <div class="checklist-progress">
          <div class="checklist-progress-text">
            <span>${eDone} of ${experiences.length} done</span>
            <span>${ePct}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${ePct}%"></div>
          </div>
        </div>
    `);

    experiences.forEach(e => {
      const done = isChecked('exp_' + e.id);
      html.push(`
        <div class="checklist-item ${done ? 'done' : ''}" data-key="exp_${escHtml(e.id)}">
          <div class="ci-checkbox">${done ? '✓' : ''}</div>
          <div class="ci-body">
            <div class="ci-name">${escHtml(e.item)}</div>
            <div class="ci-meta">📅 ${escHtml(e.date)}${e.description ? ` · ${escHtml(e.description)}` : ''}</div>
          </div>
        </div>
      `);
    });

    html.push('</div>'); // end experiences section

    container.innerHTML = html.join('');

    // ── Wire checklist item clicks ─────────────────────────
    container.querySelectorAll('.checklist-item').forEach(item => {
      item.addEventListener('click', () => {
        const key = item.dataset.key;
        if (!key) return;
        toggle(key);
        render();
      });
    });

    // ── Wire reset buttons ─────────────────────────────────
    const resetB = container.querySelector('#reset-bookings');
    if (resetB) {
      resetB.addEventListener('click', e => {
        e.stopPropagation();
        if (!confirm('Reset all bookings?')) return;
        bookings.forEach(b => { try { localStorage.removeItem('booking_' + b.id); } catch(e) {} });
        render();
      });
    }

    const resetE = container.querySelector('#reset-experiences');
    if (resetE) {
      resetE.addEventListener('click', e => {
        e.stopPropagation();
        if (!confirm('Reset all experiences?')) return;
        experiences.forEach(e => { try { localStorage.removeItem('exp_' + e.id); } catch(e) {} });
        render();
      });
    }
  }

  function priorityEmoji(p) {
    if (p === 'URGENT') return '🔴';
    if (p === 'HIGH')   return '🟠';
    return '🟡';
  }

  render();
}
