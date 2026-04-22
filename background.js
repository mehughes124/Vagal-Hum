// Service worker: manages the offscreen document that plays audio,
// relays messages between popup and offscreen, and updates the badge.

const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

let creating; // avoid race condition when creating offscreen doc

async function hasOffscreenDocument() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
  });
  return contexts.length > 0;
}

async function ensureOffscreenDocument() {
  if (await hasOffscreenDocument()) return;

  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Generate a continuous sine tone for humming practice.'
    });
    await creating;
    creating = null;
  }
}

async function closeOffscreenDocument() {
  if (await hasOffscreenDocument()) {
    await chrome.offscreen.closeDocument();
  }
}

async function updateBadge(playing) {
  if (playing) {
    await chrome.action.setBadgeText({ text: '●' });
    await chrome.action.setBadgeBackgroundColor({ color: '#4a90d9' });
  } else {
    await chrome.action.setBadgeText({ text: '' });
  }
}

// Message router
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'START_TONE': {
          await ensureOffscreenDocument();
          await chrome.runtime.sendMessage({
            type: 'OFFSCREEN_START',
            target: 'offscreen',
            frequency: message.frequency
          });
          await updateBadge(true);
          sendResponse({ ok: true });
          break;
        }
        case 'STOP_TONE': {
          if (await hasOffscreenDocument()) {
            await chrome.runtime.sendMessage({
              type: 'OFFSCREEN_STOP',
              target: 'offscreen'
            });
            // Give the fade-out a moment, then tear down
            setTimeout(() => closeOffscreenDocument(), 400);
          }
          await updateBadge(false);
          sendResponse({ ok: true });
          break;
        }
        case 'UPDATE_FREQ': {
          if (await hasOffscreenDocument()) {
            await chrome.runtime.sendMessage({
              type: 'OFFSCREEN_UPDATE_FREQ',
              target: 'offscreen',
              frequency: message.frequency
            });
          }
          sendResponse({ ok: true });
          break;
        }
        case 'GET_STATE': {
          const playing = await hasOffscreenDocument();
          sendResponse({ playing });
          break;
        }
        default:
          sendResponse({ ok: false, error: 'unknown message' });
      }
    } catch (err) {
      console.error('[vagal-hum bg]', err);
      sendResponse({ ok: false, error: String(err) });
    }
  })();
  return true; // keep channel open for async sendResponse
});

// Clean up badge on install/update
chrome.runtime.onInstalled.addListener(() => updateBadge(false));
chrome.runtime.onStartup.addListener(() => updateBadge(false));
