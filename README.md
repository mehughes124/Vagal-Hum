# Vagal Hum — Chrome Extension

A minimal tone generator to hum along with, for vagal tone / parasympathetic reset.

## What it does

Plays a clean sine wave at a frequency you choose (80–260 Hz, covering the vagal-stimulation-useful range). You hum along, matching the pitch, and feel for the buzz in your chest and throat. A breath guide (4s inhale / 8s hum-out) paces you.

Tone keeps playing if you close the popup — audio runs in an offscreen document. The extension icon shows a blue dot while playing. Click the icon and tap the orb to stop.

## Install (unpacked, for local use)

1. Open `chrome://extensions` in Chrome.
2. Flip **Developer mode** on (top-right toggle).
3. Click **Load unpacked**.
4. Select this `vagal-hum` folder.
5. Pin the extension from the puzzle-piece menu for easy access.

## Use

- Click the extension icon to open the popup.
- Tap the orb to start/stop the tone.
- Drag the slider or hit a preset to change frequency.
- Hum along on the exhale, matching the pitch. Find the frequency where you feel the strongest buzz in your chest and throat — that's your personal vagal-stimulation sweet spot.
- Close the popup if you want; audio keeps playing. The badge dot means it's still running.

## Preset frequencies

- **Low M (110 Hz)** — low male chest buzz
- **Male (120 Hz)** — typical male speaking-range
- **Female (200 Hz)** — typical female chest-throat buzz
- **High F (220 Hz)** — higher female range

## Files

```
vagal-hum/
├── manifest.json       # MV3 manifest
├── background.js       # Service worker: routes messages, manages offscreen doc, badge
├── offscreen.html      # Offscreen document host
├── offscreen.js        # AudioContext lives here (survives popup close)
├── popup.html          # Extension popup UI
├── popup.css           # Styling (fixed 360x560 to fit popup constraints)
├── popup.js            # UI controller
└── icons/              # 16 / 32 / 48 / 128 px
```

## Permissions

- `offscreen` — required to run the AudioContext in a persistent offscreen document so tone survives popup close.
- `storage` — remembers your last-used frequency.

No host permissions. No tabs. No content scripts. No network.
