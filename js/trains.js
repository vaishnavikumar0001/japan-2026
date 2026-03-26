// trains.js — Trains tab

function renderTrains() {
  const data = window.TripData;
  const container = document.getElementById('trains-content');
  if (!container || !data) return;

  const today = new Date().toISOString().slice(0, 10);
  const html = [];

  html.push(`
    <div class="trains-note">
      🎫 <strong>JR Pass × 2 (14-day)</strong> — must be purchased BEFORE leaving Austin.<br>
      🏷 <strong>Suica Cards × 2</strong> — pick up at Narita Airport JR counter on arrival.
    </div>
    <div class="section-heading">9 Train Rides · Chronological</div>
  `);

  data.trains.forEach(t => {
    const isGran    = t.class === 'GRAN CLASS';
    const isGreen   = t.class === 'GREEN CAR';
    const isUpcoming = t.date >= today;
    const isPast    = t.date < today;

    let cardClass = 'train-card';
    if (isGran)  cardClass += ' gran-class';
    if (isGreen) cardClass += ' green-car';

    let classBadge = '';
    if (isGran)  classBadge = '<span class="badge badge-gold">🥇 Gran Class</span>';
    else if (isGreen) classBadge = '<span class="badge badge-green">🌿 Green Car</span>';
    else         classBadge = `<span class="badge badge-muted">${escHtml(t.class)}</span>`;

    const jrTag = t.jr_pass
      ? `<span class="jr-pass-tag">✅ JR Pass</span>`
      : `<span class="jr-pass-tag supplement">💴 Not JR Pass</span>`;

    const suppTag = t.supplement
      ? `<span class="jr-pass-tag supplement">+ Supplement</span>`
      : '';

    const dateFmt = fmtDate(t.date);

    html.push(`
      <div class="${cardClass}">
        <div class="train-card-header">
          <div class="train-route">
            <div class="train-from-to">
              <span>${escHtml(t.from)}</span>
              <span class="train-arrow">→</span>
              <span>${escHtml(t.to)}</span>
            </div>
            <div class="train-name-line">${escHtml(t.train)}</div>
          </div>
          <div class="train-class-badge">${classBadge}</div>
        </div>

        <div class="train-card-meta">
          <span class="train-meta-item">📅 ${dateFmt}</span>
          ${t.depart ? `<span class="train-meta-item">🕐 ${escHtml(t.depart)}</span>` : ''}
          ${t.arrive ? `<span class="train-meta-item">🕑 ${escHtml(t.arrive)}</span>` : ''}
          <span class="train-meta-item">⏱ ${escHtml(t.duration)}</span>
          <span class="train-meta-item">${jrTag}</span>
          ${suppTag ? `<span class="train-meta-item">${suppTag}</span>` : ''}
        </div>

        ${t.warning ? `<div class="train-warning">⚠️ ${escHtml(t.warning)}</div>` : ''}

        ${t.seat_tip ? `<div class="train-seat-tip">💺 ${escHtml(t.seat_tip)}</div>` : ''}

        ${t.booking_note ? `<div class="train-booking-note">📋 ${escHtml(t.booking_note)}</div>` : ''}
      </div>
    `);
  });

  container.innerHTML = html.join('');
}
