// onsens.js — Onsens tab

function renderOnsens() {
  const data = window.TripData;
  const container = document.getElementById('onsens-content');
  if (!container || !data) return;

  function getVisited() {
    const visited = {};
    data.onsens.forEach(o => {
      try { visited[o.id] = !!localStorage.getItem('onsen_' + o.id); } catch(e) {}
    });
    return visited;
  }

  function toggleVisited(id) {
    try {
      if (localStorage.getItem('onsen_' + id)) {
        localStorage.removeItem('onsen_' + id);
      } else {
        localStorage.setItem('onsen_' + id, '1');
      }
    } catch(e) {}
  }

  function render() {
    const visited = getVisited();
    const doneCount = Object.values(visited).filter(Boolean).length;
    const total = data.onsens.length;
    const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    const html = [];

    // Progress header
    html.push(`
      <div class="onsen-progress-bar">
        <div class="onsen-progress-text">
          ♨️ ${doneCount} of ${total} onsens soaked
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
      </div>
      <div class="section-heading">6 Onsen Experiences</div>
    `);

    data.onsens.forEach(o => {
      const isVisited = !!visited[o.id];
      html.push(`
        <div class="onsen-card ${isVisited ? 'visited' : ''}" data-id="${o.id}">
          <div class="onsen-card-header">
            <div>
              <div class="onsen-num">Onsen ${o.number} of ${total}</div>
              <div class="onsen-name">♨️ ${escHtml(o.location || o.hotel || '')}</div>
              <div class="onsen-date">📅 ${escHtml(o.date.slice(5))} · ${escHtml(o.time)}</div>
            </div>
            <div class="onsen-check-wrap">
              <button class="onsen-check ${isVisited ? 'checked' : ''}" data-id="${o.id}" aria-label="Mark visited">
                ${isVisited ? '✓' : ''}
              </button>
            </div>
          </div>
          <div class="onsen-card-body">
            <div class="onsen-type">📍 ${escHtml(o.city)} · ${escHtml(o.type)}</div>
            <div class="onsen-desc">${escHtml(o.notes || o.description || '')}</div>
            ${o.pay_at_door ? `<div class="onsen-tips onsen-pay">🎫 Pay at door — ${escHtml(o.entry_fee || '')} · Not included in hotel stay</div>` : ''}
            ${o.taxi_required ? `<div class="onsen-tips onsen-taxi">🚕 Taxi required — ${escHtml(o.taxi_cost || '')}</div>` : ''}
            ${(!o.pay_at_door && o.included !== undefined) ? `<div class="onsen-tips">💡 ${o.included ? 'Included with hotel stay' : 'Separate entry fee'}</div>` : ''}
          </div>
        </div>
      `);
    });

    container.innerHTML = html.join('');

    // Wire checkboxes
    container.querySelectorAll('.onsen-check').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.id;
        toggleVisited(id);
        render(); // re-render to update progress
      });
    });

    // Tap card also toggles
    container.querySelectorAll('.onsen-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        toggleVisited(id);
        render();
      });
    });
  }

  render();
}
