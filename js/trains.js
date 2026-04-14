// trains.js — Trains tab

function renderTrains() {
  const data = window.TripData;
  const container = document.getElementById('trains-content');
  if (!container || !data) return;

  const html = [];

  const trainCount = data.trains.filter(t => t.type !== 'bus').length;
  const busCount   = data.trains.filter(t => t.type === 'bus').length;

  html.push(`
    <div class="trains-note">
      🎫 <strong>JR Pass × 2 (14-day)</strong> — must be purchased BEFORE leaving Austin.<br>
      🏷 <strong>Suica Cards × 2</strong> — pick up at Narita Airport JR counter on arrival.
    </div>
    <div class="section-heading">${trainCount} Train Rides · ${busCount} Bus Rides · Chronological</div>
  `);

  data.trains.forEach(t => {
    const isBus  = t.type === 'bus';
    const isGran = t.class === 'GRAN CLASS';
    const isGreenClass = t.class === 'GREEN CAR';

    let cardClass = isBus ? 'train-card bus-card' : 'train-card';
    if (isGran)       cardClass += ' gran-class';
    if (isGreenClass) cardClass += ' green-car';

    // Class badge
    let classBadge = '';
    if (isBus)           classBadge = `<span class="badge badge-bus">🚌 Bus</span>`;
    else if (isGran)     classBadge = '<span class="badge badge-gold">🥇 Gran Class</span>';
    else if (isGreenClass) classBadge = '<span class="badge badge-green">🌿 Green Car</span>';
    else                 classBadge = `<span class="badge badge-muted">${escHtml(t.class)}</span>`;

    // Series badge (N700S, HC85, E259, etc.)
    const seriesBadge = t.series
      ? `<span class="badge badge-series">🚄 ${escHtml(t.series)}</span>`
      : '';

    const jrTag = t.jr_pass
      ? `<span class="jr-pass-tag">✅ JR Pass</span>`
      : `<span class="jr-pass-tag supplement">💴 Not JR Pass</span>`;

    const suppTag = t.supplement
      ? `<span class="jr-pass-tag supplement">+ Supplement</span>`
      : '';

    const dateFmt = fmtDate(t.date);

    // Green Car section — show if this train has Green Car available
    let greenCarSection = '';
    if (!isBus && t.green_car === true) {
      greenCarSection = `
        <div class="train-green-car-row">
          <span class="green-car-icon">🌿</span>
          <div class="green-car-info">
            <strong>Green Car available</strong>${t.green_car_cars ? ` · ${escHtml(t.green_car_cars)}` : ''}
            ${t.green_car_supplement ? `<span class="green-car-price"> · ${escHtml(t.green_car_supplement)}</span>` : ''}
            ${t.green_car_note ? `<div class="green-car-note">${escHtml(t.green_car_note)}</div>` : ''}
          </div>
        </div>`;
    } else if (!isBus && t.green_car === false && t.green_car_note) {
      greenCarSection = `
        <div class="train-no-green-car-row">
          <span>❌</span>
          <div class="green-car-note">${escHtml(t.green_car_note)}</div>
        </div>`;
    }

    // Booking section
    let bookingSection = '';
    if (t.booking_how || t.booking_url) {
      bookingSection = `
        <div class="train-booking-section">
          <div class="train-booking-label">🎟 How to Book</div>
          ${t.booking_how ? `<div class="train-booking-how">${escHtml(t.booking_how)}</div>` : ''}
          ${t.booking_url ? `<a href="${escHtml(t.booking_url)}" target="_blank" rel="noopener" class="train-book-btn">Book Online →</a>` : ''}
        </div>`;
    }

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
            ${t.train_no ? `<div class="train-number-line">🔢 ${escHtml(t.train_no)}</div>` : ''}
          </div>
          <div class="train-class-badge">
            ${classBadge}
            ${seriesBadge}
          </div>
        </div>

        <div class="train-card-meta">
          <span class="train-meta-item">📅 ${dateFmt}</span>
          ${t.depart ? `<span class="train-meta-item">🕐 Dep ${escHtml(t.depart)}</span>` : ''}
          ${t.arrive ? `<span class="train-meta-item">🕑 Arr ${escHtml(t.arrive)}</span>` : ''}
          ${t.duration ? `<span class="train-meta-item">⏱ ${escHtml(t.duration)}</span>` : ''}
          <span class="train-meta-item">${jrTag}</span>
          ${suppTag ? `<span class="train-meta-item">${suppTag}</span>` : ''}
        </div>

        ${t.warning ? `<div class="train-warning">⚠️ ${escHtml(t.warning)}</div>` : ''}

        ${t.notes ? `<div class="train-booking-note">ℹ️ ${escHtml(t.notes)}</div>` : ''}

        ${t.seat_tip ? `<div class="train-seat-tip">💺 ${escHtml(t.seat_tip)}</div>` : ''}

        ${greenCarSection}

        ${t.booking_note ? `<div class="train-booking-note">📋 ${escHtml(t.booking_note)}</div>` : ''}

        ${bookingSection}
      </div>
    `);
  });

  container.innerHTML = html.join('');
}
