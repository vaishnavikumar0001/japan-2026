// hotels.js — Hotels tab

function renderHotels() {
  const data = window.TripData;
  const container = document.getElementById('hotels-content');
  if (!container || !data) return;

  const today = new Date().toISOString().slice(0, 10);
  const html = [];

  // TA-Q-BIN reminder banner (show if today is a forwarding day)
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

  html.push('<div class="section-heading">7 Hotels · May 12–25</div>');

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
            <span class="badge badge-muted">✈ In ${checkinFmt}</span>
            <span class="badge badge-muted">✈ Out ${checkoutFmt}</span>
            <span class="badge badge-muted">${nights} night${nights !== 1 ? 's' : ''}</span>
          </div>

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
}
