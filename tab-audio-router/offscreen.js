const activePlayers = new Map();

async function startPlayer(tabId, streamId, deviceId) {
  stopPlayer(tabId);

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId
      }
    },
    video: false
  });

  const audioEl = new Audio();
  audioEl.srcObject = stream;
  audioEl.autoplay = true;

  if (deviceId && typeof audioEl.setSinkId === "function") {
    await audioEl.setSinkId(deviceId);
  }

  await audioEl.play();
  activePlayers.set(tabId, { audioEl, stream });
}

function stopPlayer(tabId) {
  const entry = activePlayers.get(tabId);
  if (entry) {
    entry.audioEl.pause();
    entry.audioEl.srcObject = null;
    entry.stream.getTracks().forEach((track) => track.stop());
    activePlayers.delete(tabId);
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "OFFSCREEN_PLAY") {
    startPlayer(message.tabId, message.streamId, message.deviceId).catch(console.error);
  } else if (message.type === "OFFSCREEN_STOP") {
    stopPlayer(message.tabId);
  }
});