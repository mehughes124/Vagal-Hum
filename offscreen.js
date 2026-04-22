// Offscreen document: owns the AudioContext so tone can persist after popup closes.

let audioCtx = null;
let oscillator = null;
let gainNode = null;

function startTone(frequency) {
  if (!audioCtx) {
    audioCtx = new (self.AudioContext || self.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  // Stop any existing oscillator first
  if (oscillator) {
    try { oscillator.stop(); } catch (e) {}
    oscillator = null;
  }

  oscillator = audioCtx.createOscillator();
  gainNode = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

  // Gentle fade-in
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.3);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
}

function stopTone() {
  if (oscillator && gainNode && audioCtx) {
    const now = audioCtx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
    oscillator.stop(now + 0.25);
  }
  oscillator = null;
  gainNode = null;
}

function updateFrequency(frequency) {
  if (oscillator && audioCtx) {
    // Smooth ramp to avoid clicks
    oscillator.frequency.linearRampToValueAtTime(
      frequency,
      audioCtx.currentTime + 0.05
    );
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') return false;

  switch (message.type) {
    case 'OFFSCREEN_START':
      startTone(message.frequency);
      sendResponse({ ok: true });
      break;
    case 'OFFSCREEN_STOP':
      stopTone();
      sendResponse({ ok: true });
      break;
    case 'OFFSCREEN_UPDATE_FREQ':
      updateFrequency(message.frequency);
      sendResponse({ ok: true });
      break;
  }
  return false;
});
