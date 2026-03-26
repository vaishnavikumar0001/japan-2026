// auth.js — passphrase lock screen (client-side only, no network calls)
(function () {
  const HASH     = '6bb335571806f56ccb0f6b32e3184752887aa4b25107a92c1b312e574e33d310';
  const SALT     = 'japan2026trip';
  const AUTH_KEY = 'japan2026-unlocked';

  // Already unlocked on this device — skip straight to app
  if (localStorage.getItem(AUTH_KEY) === '1') return;

  // Inject lock screen overlay (covers everything)
  const overlay = document.createElement('div');
  overlay.id = 'lock-screen';
  overlay.innerHTML = `
    <div class="lock-card">
      <div class="lock-flag">🇯🇵</div>
      <div class="lock-title">Japan 2026</div>
      <div class="lock-sub">Enter your passphrase to continue</div>
      <input id="lock-input" type="password" class="lock-input"
             placeholder="Passphrase" autocomplete="off" autocorrect="off"
             autocapitalize="off" spellcheck="false" />
      <div id="lock-error" class="lock-error"></div>
      <button id="lock-submit" class="lock-btn">Unlock</button>
    </div>
  `;
  document.body.appendChild(overlay);

  // PBKDF2 hash via Web Crypto — passphrase never leaves the device
  async function verify(phrase) {
    const enc     = new TextEncoder();
    const keyMat  = await crypto.subtle.importKey(
      'raw', enc.encode(phrase), 'PBKDF2', false, ['deriveBits']
    );
    const bits    = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode(SALT), iterations: 100000, hash: 'SHA-256' },
      keyMat, 256
    );
    const hex = Array.from(new Uint8Array(bits))
                     .map(b => b.toString(16).padStart(2, '0')).join('');
    return hex === HASH;
  }

  async function attempt() {
    const input = document.getElementById('lock-input');
    const btn   = document.getElementById('lock-submit');
    const err   = document.getElementById('lock-error');
    const phrase = input.value;
    if (!phrase) return;

    btn.disabled    = true;
    btn.textContent = 'Checking…';
    err.textContent = '';

    const ok = await verify(phrase);
    if (ok) {
      localStorage.setItem(AUTH_KEY, '1');
      overlay.style.transition = 'opacity 0.35s';
      overlay.style.opacity    = '0';
      setTimeout(() => overlay.remove(), 380);
    } else {
      btn.disabled    = false;
      btn.textContent = 'Unlock';
      err.textContent = 'Wrong passphrase — try again.';
      input.value = '';
      input.focus();
    }
  }

  document.getElementById('lock-submit').addEventListener('click', attempt);
  document.getElementById('lock-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') attempt();
  });
})();
