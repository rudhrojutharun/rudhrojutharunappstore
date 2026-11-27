const deviceSelect = document.getElementById("deviceSelect");
const selectWrapper = document.getElementById("selectWrapper");
const routeBtn = document.getElementById("routeBtn");
const stopBtn = document.getElementById("stopBtn");
const statusEl = document.getElementById("status");
const statePill = document.getElementById("statePill");
const stateText = document.getElementById("stateText");
const activeBanner = document.getElementById("activeBanner");
const activeDeviceName = document.getElementById("activeDeviceName");

let currentRoute = null;

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function applyRoutingUI(route) {
  currentRoute = route;
  const options = Array.from(deviceSelect.options);

  options.forEach((opt) => {
    const baseLabel = opt.dataset.baseLabel || opt.textContent;
    opt.dataset.baseLabel = baseLabel;
    if (route && opt.value === route.deviceId) {
      opt.textContent = `● ${baseLabel} (Active)`;
    } else {
      opt.textContent = baseLabel;
    }
  });

  if (route) {
    statePill.classList.add("active");
    stateText.textContent = "Routed";
    activeBanner.classList.add("visible");
    activeDeviceName.textContent = route.deviceLabel;
    selectWrapper.classList.add("routed");
    routeBtn.textContent = "Switch Output Device";
    stopBtn.disabled = false;

    if (options.some((opt) => opt.value === route.deviceId)) {
      deviceSelect.value = route.deviceId;
    }
  } else {
    statePill.classList.remove("active");
    stateText.textContent = "Default Output";
    activeBanner.classList.remove("visible");
    activeDeviceName.textContent = "";
    selectWrapper.classList.remove("routed");
    routeBtn.textContent = "Route Active Tab";
    stopBtn.disabled = true;
  }
}

async function initPopup() {
  const tab = await getActiveTab();
  const statusResponse = await chrome.runtime.sendMessage({
    type: "GET_TAB_STATUS",
    tabId: tab.id
  });

  const devices = await navigator.mediaDevices.enumerateDevices();
  const outputs = devices.filter((d) => d.kind === "audiooutput");
  deviceSelect.innerHTML = "";

  const hasLabels = outputs.some((d) => d.label && d.label.trim().length > 0);

  if (!hasLabels) {
    statusEl.innerHTML =
      'Device names locked. <a href="#" id="openPerm">Click here to allow access</a>';
    document.getElementById("openPerm").addEventListener("click", (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: chrome.runtime.getURL("permissions.html") });
    });
  } else {
    statusEl.textContent = "";
  }

  outputs.forEach((dev, idx) => {
    const opt = document.createElement("option");
    const label = dev.label || `Audio Output ${idx + 1}`;
    opt.value = dev.deviceId;
    opt.dataset.baseLabel = label;
    opt.textContent = label;
    deviceSelect.appendChild(opt);
  });

  applyRoutingUI(statusResponse?.route || null);
}

deviceSelect.addEventListener("change", () => {
  if (currentRoute && deviceSelect.value === currentRoute.deviceId) {
    selectWrapper.classList.add("routed");
  } else {
    selectWrapper.classList.remove("routed");
  }
});

routeBtn.addEventListener("click", async () => {
  const tab = await getActiveTab();
  const selectedOption = deviceSelect.options[deviceSelect.selectedIndex];
  const deviceId = deviceSelect.value;
  const deviceLabel = selectedOption?.dataset.baseLabel || selectedOption?.textContent || "Selected Output";

  chrome.runtime.sendMessage(
    { type: "START_ROUTING", tabId: tab.id, deviceId, deviceLabel },
    (res) => {
      if (res?.ok) {
        applyRoutingUI({ deviceId, deviceLabel });
        statusEl.textContent = `Audio routed to ${deviceLabel}.`;
      } else {
        statusEl.textContent = `Error: ${res?.error || "Failed to route audio."}`;
      }
    }
  );
});

stopBtn.addEventListener("click", async () => {
  const tab = await getActiveTab();
  chrome.runtime.sendMessage({ type: "STOP_ROUTING", tabId: tab.id }, (res) => {
    if (res?.ok) {
      applyRoutingUI(null);
      statusEl.textContent = "Returned tab to Windows default output.";
    } else {
      statusEl.textContent = `Error: ${res?.error || "Failed to stop routing."}`;
    }
  });
});

initPopup();