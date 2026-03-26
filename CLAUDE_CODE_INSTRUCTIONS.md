# Japan Trip 2026 — PWA App Build Instructions for Claude Code

## What You Are Building

A **Progressive Web App (PWA)** travel companion for a Japan couples trip (May 11–25, 2026).
The app must work **100% offline**, be **installable on Android, iPhone, and Mac**, and serve
as the single source of truth for the entire trip. It replaces printed itineraries and
random bookmark folders with one clean, always-available app.

**All trip data lives in `japan_trip_data.json`** — read from there, never hardcode content.

---

## Core Requirements

### Must Have
- Works 100% offline with no internet (Service Worker + cache)
- Installable to home screen on Android (Chrome), iPhone (Safari), and Mac (Chrome/Safari)
- Reads all data from `japan_trip_data.json`
- Checkboxes persist across sessions using `localStorage`
- Responsive: optimized for mobile portrait first, also works on Mac desktop
- Fast load — no heavy frameworks, no external CDN dependencies at runtime

### Nice to Have
- "Today" screen that automatically shows the current day's itinerary
- Map deep-links (tap an address → opens Apple Maps or Google Maps)
- Dark mode toggle
- Subtle Japan-themed aesthetic

---

## App Structure — 5 Tabs

### Tab 1: Today / Itinerary
- **Default view**: automatically shows today's date schedule if the date matches a trip day
- If today is not a trip day, show the full day list and let user tap any day
- Each day card shows: date, city badge, day label, number of activities
- Tapping a day expands to show the full timed schedule table
- Early start warning badge if `early_start: true` (red alert)
- Luggage forwarding reminder if `luggage_forward: true` (orange badge)
- Mt Fuji view alert if `fuji_view_alert` exists (special highlighted banner)
- Last night city reminder if `last_night_city: true`
- Tips shown at bottom of each day as green callout cards

### Tab 2: Hotels
- Card per hotel showing: name, city, area, check-in, check-out, nights
- Onsen badge (highlighted) if `onsen: true` — show onsen description
- Address as a tappable deep-link to maps
- Phone number as tappable `tel:` link
- Special notes shown
- Highlight current night's hotel automatically if date matches

### Tab 3: Trains
- List of all 9 train rides in order
- Per train: date, route (from → to), train name, class, JR Pass badge
- Seat tip shown prominently (this is critical info)
- Gran Class and Green Car trains visually distinct (gold / green highlight)
- Mt Fuji view alert badge on trains 3 and 8
- Where to book info shown

### Tab 4: Onsens
- Visual tracker: 6 onsen cards with a checkmark when visited
- Per onsen: number, date, time, location, city, type description
- Included vs paid badge
- Special notes
- Tap to toggle as visited — persists in localStorage

### Tab 5: Checklists
- **Three sub-tabs**: Bookings | Experiences | Packing
- Each item has a checkbox that persists in localStorage
- Booking items show priority badge (URGENT = red, HIGH = orange, MEDIUM = gray)
- Booking items with URLs show a tappable link
- Packing split into categories: Documents | Essentials | Clothing | Tech
- Progress bar showing X of Y completed per section
- "Reset all" button per section (with confirmation)

---

## Visual Design

### Color Palette
```
--navy:       #1F4E79   (primary, headers, nav)
--crimson:    #C00000   (accents, alerts, Japan red)
--gold:       #B8860B   (Gran Class, premium, Mt Fuji alerts)
--green:      #375623   (tips, included items, onsen)
--teal:       #00695C   (onsen tab accent)
--purple:     #4A148C   (trains tab accent)
--bg:         #F5F5F5   (page background)
--card:       #FFFFFF   (card background)
--text:       #222222   (primary text)
--muted:      #666666   (secondary text)
```

### Typography
- System font stack for performance: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Headings: bold, navy
- Tab labels: medium weight

### Layout
- Bottom navigation bar with 5 tabs (mobile standard)
- Cards with subtle box shadow and border-radius: 10px
- Generous padding — thumbs need room on mobile
- Active tab has crimson underline/highlight

---

## PWA Configuration

### manifest.json
```json
{
  "name": "Japan Trip 2026",
  "short_name": "Japan 2026",
  "description": "Couples trip itinerary May 11-25 2026",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#1F4E79",
  "theme_color": "#1F4E79",
  "orientation": "portrait",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker (sw.js)
- Cache-first strategy for all app files
- Pre-cache on install: index.html, app.js/css, japan_trip_data.json, manifest.json, icons
- No network calls needed at all — everything local

### Icons
- Generate simple icons using Canvas API or inline SVG:
  - Navy background (#1F4E79)
  - White torii gate or simple "JP 26" text
  - Export as PNG at 192x192 and 512x512

---

## File Structure

```
japan-trip-app/
├── index.html              # Single page app shell
├── app.js                  # All JS logic
├── styles.css              # All styles
├── sw.js                   # Service worker
├── manifest.json           # PWA manifest
├── japan_trip_data.json    # All trip data (source of truth)
├── icon-192.png            # PWA icon
└── icon-512.png            # PWA icon
```

Single HTML file approach is fine too (inline CSS + JS in index.html) if simpler.

---

## localStorage Keys

```javascript
'japan_checklist_bookings'    // object { item_index: true/false }
'japan_checklist_experiences' // object { exp_id: true/false }
'japan_checklist_packing'     // object { category_item: true/false }
'japan_onsens_visited'        // object { onsen_id: true/false }
'japan_dark_mode'             // boolean
'japan_active_tab'            // string: 'today'|'hotels'|'trains'|'onsens'|'checklists'
```

---

## Special Logic

### Suzuka Circuit Day (May 23)
- May 23 is now a **Suzuka day** — the day schedule goes: Takayama Morning Market → Wide View Hida to Nagoya → Kintetsu to Shiroko → shuttle to Suzuka Circuit → Super Formula + Pit Walk → back to Nagoya → evening Shinkansen → Tokyo
- The `suzuka_day: true` flag on the May 23 day object should trigger a special banner/callout in Tab 1
- Train 8b (Kintetsu Nagoya→Shiroko) is NOT covered by JR Pass — highlight this prominently with a warning badge
- The booking item for Suzuka has `sale_date_chicago` and `alert` fields — display the alert prominently in the Bookings checklist, ideally with a calendar reminder note

### Ticket Sale Reminder
The Suzuka booking has a special alert field. In Tab 5 (Checklists → Bookings), when this item is not yet `done`, display the alert text in a highlighted warning box:
```
"TICKETS ON SALE: Saturday April 11 at 9:00 PM Chicago CDT"
"Buy at suzukacircuit.jp - Race Day Special Passport + Pit Walk Pass for May 23"
```

### Today Detection
```javascript
const today = new Date().toISOString().split('T')[0]; // "2026-05-14"
const todayDay = tripData.days.find(d => d.date === today);
// If found, open that day expanded automatically on Tab 1
// If not found, show all days collapsed
```

### Maps Deep Links
```javascript
// iOS opens Apple Maps, Android opens Google Maps
function openMap(address) {
  const encoded = encodeURIComponent(address);
  // Try to detect platform:
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    window.open(`maps://maps.apple.com/?q=${encoded}`);
  } else {
    window.open(`https://maps.google.com/?q=${encoded}`);
  }
}
```

### JR Pass Badge
- Trains with `jr_pass: true` → blue "JR Pass" badge
- Trains with `supplement` → orange "Supplement Required" badge
- Gran Class → gold "GRAN CLASS" badge
- Green Car → green "GREEN CAR" badge

---

## Build Order (Recommended)

1. **PWA shell** — index.html, manifest.json, sw.js, icons (verify installable first)
2. **Data loading** — read and parse japan_trip_data.json
3. **Tab navigation** — bottom nav with 5 tabs switching content
4. **Tab 1: Today/Itinerary** — day list + expand/collapse + today detection
5. **Tab 2: Hotels** — hotel cards with onsen badges + map links
6. **Tab 3: Trains** — train list with seat tips and class badges
7. **Tab 4: Onsens** — 6 onsen cards with visited toggle
8. **Tab 5: Checklists** — bookings + experiences + packing with checkboxes
9. **Persistence** — wire up all localStorage save/load
10. **Polish** — dark mode, transitions, edge cases

---

## How to Run Locally

```bash
# Option 1 - Python (no install needed)
python3 -m http.server 8080
# Open http://localhost:8080 on your phone's browser (same WiFi)

# Option 2 - Node
npx serve .
# Open the URL shown on your phone's browser (same WiFi)
```

### Install on Phone (same WiFi required for first install)

**Android (Chrome):**
1. Open the URL in Chrome
2. Tap the 3-dot menu
3. Tap "Add to Home screen"
4. Done — works offline from now on

**iPhone (Safari):**
1. Open the URL in Safari (must be Safari, not Chrome)
2. Tap the Share button (box with arrow)
3. Tap "Add to Home Screen"
4. Done — works offline from now on

**Mac (Chrome):**
1. Open the URL in Chrome
2. Click the install icon in the address bar (computer with arrow)
3. Or go to Chrome menu → "Install Japan Trip 2026..."

---

## Important Notes for Claude Code

- **No external APIs** — no Google Maps API key needed, just deep links
- **No npm build step** — plain HTML/CSS/JS, just open with a web server
- **No React/Vue/bundler needed** — vanilla JS is fine and simpler for offline PWA
- **Test offline** — after first load, turn off WiFi and reload. Everything must still work.
- **Test "Add to Home Screen"** — actually install it and verify it opens in standalone mode
- **All data from JSON** — never hardcode trip content in JS or HTML
- **localStorage** — do NOT use it for trip data (read-only from JSON), only for user state like checkboxes

---

## Future Features (Do NOT build yet — just be aware)

These may be requested later as updates:

- Photo journal — tap a day and add notes/photos from camera roll
- Weather widget — show forecast for current city (needs online)
- Currency converter — quick JPY/USD converter
- Phrasebook — common Japanese phrases with pronunciation
- Emergency contacts page
- Budget tracker (add expenses per day)
- Share mode — export a day's schedule as a text message

---

## Context: About This Trip

- **Who**: Couple traveling from Austin, Texas
- **Route**: Austin → Tokyo (4 nights) → Hakone (2 nights) → Kyoto (3 nights) → Osaka (1 night) → Takayama (2 nights) → Tokyo (2 nights) → Austin
- **Dates**: May 11–25, 2026 (15 days, 13 hotel nights)
- **Highlights**: Sumo tournament, Gran Class Shinkansen, 6 onsens, Mt Fuji views, JDM car shopping, Kimono, Tea Ceremony, Samurai Museum, **Super Formula live racing at Suzuka Circuit**
- **Special**: TA-Q-BIN luggage forwarding on May 15 and May 21 (travel with daypack only those days)
- **May 23 UPDATED**: Takayama → Wide View Hida → Nagoya → **Kintetsu to Suzuka Circuit** (Super Formula Rounds 4 & 5 + Pit Walk) → Nagoya → Evening Shinkansen → Tokyo. Kintetsu leg NOT covered by JR Pass.
- **May 24 UPDATED**: A-PIT Super Autobacs moved to May 24 morning (was May 23 evening), then Harajuku + Cat Street + Isetan afternoon as originally planned.
- **Suzuka ticket sale alert**: Tickets go on sale **Saturday April 11, 2026 at 9:00 PM Chicago CDT** (= Sunday April 12 11:00 AM Japan time). Buy Race Day Special Passport + Pit Walk Pass at suzukacircuit.jp
- **Mt Fuji views**: Train 2 (Romance Car right side), Train 3 (Gran Class right side 10:20 AM), Train 8 is now an evening train — no Fuji view
- **The app is for use IN Japan** — offline is not a nice-to-have, it is essential
