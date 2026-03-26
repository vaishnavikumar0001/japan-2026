// learn.js — Learn tab: topic list + full-screen overlay reader

const LEARN_TOPICS = [
  {
    id:       'sumo',
    emoji:    '🏆',
    title:    'Sumo Wrestling Guide',
    subtitle: 'Natsu Basho · May 14 · Day 3',
    desc:     'Ranks, rituals, key moves, wrestlers to watch & your Day 5 schedule',
    src:      'sumo_explainer.html'
  }
  // Add more topics here — e.g. onsen etiquette, train guide, temple customs
];

// ── Persistence helpers ─────────────────────────────────────────
function isLearned(id) {
  try { return !!localStorage.getItem('learned_' + id); } catch(e) { return false; }
}
function setLearned(id, val) {
  try {
    if (val) localStorage.setItem('learned_' + id, '1');
    else     localStorage.removeItem('learned_' + id);
  } catch(e) {}
}

// ── Full-screen overlay ─────────────────────────────────────────
window.openLearnTopic = function(id) {
  const topic = LEARN_TOPICS.find(t => t.id === id);
  if (!topic) return;

  // Remove any existing overlay
  const existing = document.getElementById('learn-overlay');
  if (existing) existing.remove();

  const learned = isLearned(id);

  const overlay = document.createElement('div');
  overlay.id = 'learn-overlay';
  overlay.className = 'learn-overlay';
  overlay.innerHTML = `
    <div class="learn-overlay-bar">
      <button class="learn-back-btn" id="learn-back-btn">← Back</button>
      <span class="learn-overlay-label">${topic.emoji} ${topic.title}</span>
      <button class="learn-mark-btn ${learned ? 'marked' : ''}" id="learn-mark-btn">
        ${learned ? '✓ Learned' : 'Mark Learned'}
      </button>
    </div>
    <iframe src="${topic.src}" class="learn-iframe" id="learn-iframe"></iframe>
  `;
  document.body.appendChild(overlay);

  // Back — close overlay, re-render list
  overlay.querySelector('#learn-back-btn').addEventListener('click', () => {
    overlay.remove();
    renderLearn();
  });

  // Mark as learned toggle
  overlay.querySelector('#learn-mark-btn').addEventListener('click', function() {
    const now = !isLearned(id);
    setLearned(id, now);
    this.textContent = now ? '✓ Learned' : 'Mark Learned';
    this.classList.toggle('marked', now);
  });
};

// ── Main render ─────────────────────────────────────────────────
function renderLearn() {
  const container = document.getElementById('learn-content');
  if (!container) return;

  const total   = LEARN_TOPICS.length;
  const learned = LEARN_TOPICS.filter(t => isLearned(t.id)).length;
  const pct     = total ? Math.round((learned / total) * 100) : 0;

  let html = `
    <div class="learn-header">
      <div class="learn-header-title">📚 Pre-Trip Learning</div>
      <div class="learn-header-count">${learned} of ${total} completed</div>
    </div>
    <div class="learn-progress-bar">
      <div class="learn-progress-fill" style="width:${pct}%"></div>
    </div>
    <div class="learn-list">
  `;

  LEARN_TOPICS.forEach(topic => {
    const done = isLearned(topic.id);
    html += `
      <div class="learn-card ${done ? 'learned' : ''}" data-id="${topic.id}">
        <div class="learn-card-emoji">${topic.emoji}</div>
        <div class="learn-card-body">
          <div class="learn-card-title">${topic.title}</div>
          <div class="learn-card-sub">${topic.subtitle}</div>
          <div class="learn-card-desc">${topic.desc}</div>
        </div>
        <div class="learn-card-arrow">${done ? '✓' : '›'}</div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;

  container.querySelectorAll('.learn-card').forEach(card => {
    card.addEventListener('click', () => {
      window.openLearnTopic(card.dataset.id);
    });
  });
}
