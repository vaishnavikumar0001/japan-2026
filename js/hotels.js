// hotels.js — Hotels tab

function renderHotels() {
  const data = window.TripData;
  const container = document.getElementById('hotels-content');
  if (!container || !data) return;

  const today = new Date().toISOString().slice(0, 10);
  const html = [];

  // ── Hotel Booking Checklist ────────────────────────────────
  function hotelKey(id) { return 'hotel_booked_' + id; }
  function isHotelBooked(id) {
    try { return !!localStorage.getItem(hotelKey(id)); } catch(e) { return false; }
  }
  function toggleHotelBooked(id) {
    try {
      if (localStorage.getItem(hotelKey(id))) localStorage.removeItem(hotelKey(id));
      else localStorage.setItem(hotelKey(id), '1');
    } catch(e) {}
  }

  const totalHotels = data.hotels.length;
  const bookedCount = data.hotels.filter(h => isHotelBooked(h.id)).length;
  const allDone = bookedCount === totalHotels;

  html.push(`
    <div class="hotel-checklist-card" id="hotel-checklist">
      <div class="hotel-checklist-header">
        <div class="hotel-checklist-title">🏨 Hotel Bookings</div>
        <div class="hotel-checklist-progress ${allDone ? 'progress-done' : ''}">
          ${bookedCount}/${totalHotels} booked
        </div>
      </div>
      <div class="hotel-checklist-bar">
        <div class="hotel-checklist-fill" style="width:${Math.round(bookedCount/totalHotels*100)}%"></div>
      </div>
      ${allDone ? '<div class="hotel-checklist-done">✅ All hotels booked!</div>' : ''}
      <div class="hotel-checklist-list">
        ${data.hotels.map(h => {
          const isBooked = isHotelBooked(h.id);
          const checkinShort = fmtDate(h.checkin || h.check_in);
          const checkoutShort = fmtDate(h.checkout || h.check_out);
          const hasUrl = h.booking_url && h.booking_url.length > 0;
          return `
            <div class="hotel-checklist-row ${isBooked ? 'hcr-done' : ''}" data-hotel-id="${escHtml(h.id)}">
              <button class="hcr-checkbox ${isBooked ? 'hcr-checked' : ''}" data-hotel-id="${escHtml(h.id)}" aria-label="Mark ${escHtml(h.name)} as booked">
                ${isBooked ? '✓' : ''}
              </button>
              <div class="hcr-info">
                <div class="hcr-name">${escHtml(h.name)}</div>
                <div class="hcr-dates">${escHtml(h.city)} · ${checkinShort} – ${checkoutShort} · ${h.nights}n</div>
              </div>
              ${hasUrl ? `<a href="${escHtml(h.booking_url)}" target="_blank" rel="noopener" class="hcr-book-btn">Book →</a>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `);

  // ── TA-Q-BIN reminder banner (show if today is a forwarding day)
  const taqbinDays = data.hotels.filter(h => h.taqbin_day);
  taqbinDays.forEach(h => {
    if (h.taqbin_day === today) {
      html.push(`
        <div class="taqbin-banner">
          <span class="taqbin-banner-icon">📦</span>
          <div>
            <strong>TA-Q-BIN Forwarding Day!</strong>
            ${escHtml(h.taqbin_note)}
          </div>
        </div>
      `);
    }
  });

  html.push('<div class="section-heading">6 Hotels · May 12–25</div>');

  data.hotels.forEach(h => {
    const nights = h.nights;
    const isActive = (h.checkin || h.check_in) <= today && today < (h.checkout || h.check_out);
    const isTaqbinDay = h.taqbin_day === today;

    const checkinFmt  = fmtDate(h.checkin  || h.check_in);
    const checkoutFmt = fmtDate(h.checkout || h.check_out);

    html.push(`
      <div class="hotel-card">
        <div class="hotel-card-header">
          <div>
            <div class="hotel-name">${escHtml(h.name)}</div>
            <div class="hotel-city">📍 ${escHtml(h.city)}</div>
          </div>
          <div class="hotel-badges">
            ${isActive ? '<span class="badge badge-red">Staying here</span>' : ''}
            ${h.onsen ? '<span class="badge badge-navy">♨️ Onsen</span>' : ''}
          </div>
        </div>

        <div class="hotel-card-body">
          <!-- Dates row -->
          <div class="hotel-dates">
            <span class="badge badge-muted">✈ In ${checkinFmt}${h.checkin_time ? ' · ' + h.checkin_time : ''}</span>
            <span class="badge badge-muted">✈ Out ${checkoutFmt}${h.checkout_time ? ' · ' + h.checkout_time : ''}</span>
            <span class="badge badge-muted">${nights} night${nights !== 1 ? 's' : ''}</span>
          </div>

          ${h.checkin_note ? `
          <div class="hotel-checkin-note">
            <span>🔑</span>
            <span>${escHtml(h.checkin_note)}</span>
          </div>` : ''}

          ${h.onsen ? `
          <div class="hotel-info-row">
            <span class="hotel-info-icon">♨️</span>
            <span class="hotel-info-text">${escHtml(h.onsen_type || 'Onsen available')}</span>
          </div>` : ''}

          <div class="hotel-info-row">
            <span class="hotel-info-icon">🍽</span>
            <span class="hotel-info-text">${escHtml(h.meals)}</span>
          </div>

          <div class="hotel-info-row">
            <span class="hotel-info-icon">📍</span>
            <span class="hotel-info-text">${escHtml(h.address)}</span>
          </div>

          ${h.phone ? `
          <div class="hotel-info-row">
            <span class="hotel-info-icon">📞</span>
            <span class="hotel-info-text"><a href="tel:${escHtml(h.phone)}">${escHtml(h.phone)}</a></span>
          </div>` : ''}

          ${h.notes ? `<div class="hotel-note">💬 ${escHtml(h.notes)}</div>` : ''}

          ${isTaqbinDay || h.taqbin_note ? `
          <div class="taqbin-banner mt-8" style="margin-bottom:0">
            <span class="taqbin-banner-icon">📦</span>
            <div>
              <strong>TA-Q-BIN: ${escHtml(h.taqbin_day ? h.taqbin_day.slice(5) : '')}</strong>
              ${escHtml(h.taqbin_note)}
            </div>
          </div>` : ''}

          <div class="hotel-actions">
            <a href="${mapLink(h.map_query)}" target="_blank" rel="noopener" class="btn-secondary">🗺 Open in Maps</a>
            ${h.phone ? `<a href="tel:${escHtml(h.phone)}" class="btn-secondary">📞 Call</a>` : ''}
          </div>
        </div>
      </div>
    `);
  });

  container.innerHTML = html.join('');

  // Wire up checklist checkboxes
  container.querySelectorAll('.hcr-checkbox').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleHotelBooked(btn.dataset.hotelId);
      renderHotels();
    });
  });
}
