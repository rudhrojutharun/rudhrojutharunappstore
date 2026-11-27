async function ensureOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL("offscreen.html");
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl]
  });

  if (contexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["USER_MEDIA", "AUDIO_PLAYBACK"],
      justification: "Capture tab audio stream and route it to a selected audio output device."
    });
  }
}

async function getRoutedTabs() {
  const { routedTabs = {} } = await chrome.storage.session.get("routedTabs");
  return routedTabs;
}

async function setTabRoute(tabId, routeInfo) {
  const routedTabs = await getRoutedTabs();
  if (routeInfo) {
    routedTabs[String(tabId)] = routeInfo;
  } else {
    delete routedTabs[String(tabId)];
  }
  await chrome.storage.session.set({ routedTabs });
}

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const routedTabs = await getRoutedTabs();
  if (routedTabs[String(tabId)]) {
    await setTabRoute(tabId, null);
    chrome.runtime.sendMessage({ type: "OFFSCREEN_STOP", tabId }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_ROUTING") {
    (async () => {
      try {
        await ensureOffscreenDocument();
        const streamId = await chrome.tabCapture.getMediaStreamId({
          targetTabId: message.tabId
        });
        await chrome.tabs.update(message.tabId, { muted: true });
        await chrome.runtime.sendMessage({
          type: "OFFSCREEN_PLAY",
          tabId: message.tabId,
          streamId,
          deviceId: message.deviceId
        });

        await setTabRoute(message.tabId, {
          deviceId: message.deviceId,
          deviceLabel: message.deviceLabel || "Selected Output",
          startedAt: Date.now()
        });

        sendResponse({ ok: true });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.type === "STOP_ROUTING") {
    (async () => {
      try {
        await chrome.tabs.update(message.tabId, { muted: false });
        await chrome.runtime.sendMessage({
          type: "OFFSCREEN_STOP",
          tabId: message.tabId
        });
        await setTabRoute(message.tabId, null);
        sendResponse({ ok: true });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.type === "GET_TAB_STATUS") {
    (async () => {
      const routedTabs = await getRoutedTabs();
      sendResponse({ route: routedTabs[String(message.tabId)] || null });
    })();
    return true;
  }
});