// Popup controller: sends commands to service worker, reflects state in UI.
// Audio actually lives in the offscreen document so it persists after popup close.

const orb = document.getElementById('orb');
const orbLabel = document.getElementById('orbLabel');
const freqSlider = document.getElementById('freqSlider');
const freqValue = document.getElementById('freqValue');
const noteValue = document.getElementById('noteValue');
const breathIndicator = document.getElementById('breathIndicator');
const presetBtns = document.querySelectorAll('.preset-btn');

let isPlaying = false;
let breathTimeout = null;

function freqToNote(freq) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const semitones = Math.round(12 * Math.log2(freq / 440));
  const noteIndex = ((semitones % 12) + 12 + 9) % 12;
  const octave = Math.floor((semitones + 9) / 12) + 4;

  let range = '';
  if (freq < 110) range = 'deep chest';
  else if (freq < 145) range = 'low chest buzz';
  else if (freq < 180) range = 'mid chest-throat';
  else if (freq < 230) range = 'throat buzz';
  else range = 'head resonance';

  return `${noteNames[noteIndex]}${octave} · ${range}`;
}

function updateFreqDisplay(freq) {
  freqValue.textContent = freq;
  noteValue.textContent = freqToNote(freq);
  presetBtns.forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.freq) === freq);
  });
}

function setPlayingUI(playing) {
  isPlaying = playing;
  orb.classList.toggle('playing', playing);
  orbLabel.textContent = playing ? 'HUM' : 'TAP';
  if (playing) {
    startBreathGuide();
  } else {
    stopBreathGuide();
  }
}

function startBreathGuide() {
  let phase = 0;
  const phases = [
    { text: 'INHALE', duration: 4000 },
    { text: 'HUM OUT', duration: 8000 }
  ];
  function next() {
    breathIndicator.textContent = phases[phase].text;
    breathTimeout = setTimeout(() => {
      phase = (phase + 1) % 2;
      next();
    }, phases[phase].duration);
  }
  next();
}

function stopBreathGuide() {
  if (breathTimeout) {
    clearTimeout(breathTimeout);
    breathTimeout = null;
  }
  breathIndicator.innerHTML = '&nbsp;';
}

async function sendMessage(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (response) => {
      resolve(response);
    });
  });
}

async function startTone() {
  const freq = parseInt(freqSlider.value);
  await sendMessage({ type: 'START_TONE', frequency: freq });
  setPlayingUI(true);
}

async function stopTone() {
  await sendMessage({ type: 'STOP_TONE' });
  setPlayingUI(false);
}

async function updateFreq(freq) {
  updateFreqDisplay(freq);
  await chrome.storage.local.set({ lastFreq: freq });
  if (isPlaying) {
    await sendMessage({ type: 'UPDATE_FREQ', frequency: freq });
  }
}

// Event listeners
orb.addEventListener('click', async () => {
  if (isPlaying) {
    await stopTone();
  } else {
    await startTone();
  }
});

freqSlider.addEventListener('input', (e) => {
  updateFreq(parseInt(e.target.value));
});

presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const freq = parseInt(btn.dataset.freq);
    freqSlider.value = freq;
    updateFreq(freq);
  });
});

// Sync popup state with whatever's actually happening on open
(async function init() {
  // Restore saved frequency
  const { lastFreq } = await chrome.storage.local.get('lastFreq');
  const savedFreq = lastFreq || 120;
  freqSlider.value = savedFreq;
  updateFreqDisplay(savedFreq);

  // Check if audio is already playing (user reopened popup mid-session)
  const state = await sendMessage({ type: 'GET_STATE' });
  if (state && state.playing) {
    setPlayingUI(true);
  }
})();
