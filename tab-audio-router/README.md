# Tab Audio Output Router

A Chrome extension (Manifest V3) that lets you route audio from individual browser tabs to different sound output devices simultaneously—for example, sending learning classes to wireless earbuds while playing YouTube videos on a TV or external speakers.

---

## Use Cases

* **Multi-Screen Home Setup (Monitor + TV):** Listen to online classes or lectures on a monitor tab through **pTron TWS / headphones**, while playing kids' videos or music on a **TV (HDMI / NVIDIA High Definition Audio)** from another Chrome tab.
* **Calls & Notifications vs. Media:** Keep background videos or music on one output device while routing a specific tab's audio to a headset or speaker.
* **Testing & Productivity:** Preview media or web audio on a specific speaker or headset without changing Windows' global default output device every time.

---

## How It Works

Standard websites and HTML5 media players generally play through Windows' default or per-application output rather than offering a per-tab speaker selector. This extension bridges that gap in three steps:

1. **Tab Audio Capture (`background.js` + `chrome.tabCapture`):** When you click **Route Active Tab**, the background service worker requests a media stream ID for the active tab and mutes the original tab so you do not hear duplicate audio.
2. **Offscreen Audio Playback (`offscreen.html` + `offscreen.js`):** Chrome Manifest V3 service workers cannot directly play `<audio>` elements, so the extension creates a hidden offscreen document, receives the captured tab stream via `navigator.mediaDevices.getUserMedia()`, and plays it through an `Audio` element.
3. **Device Routing (`setSinkId`):** The offscreen `Audio` element uses `setSinkId(deviceId)` to send that specific tab's audio stream to whichever output device you selected in the popup.

---

## First-Time Setup & Granting Permissions

### Step 1: Load the Extension in Chrome
1. Open Chrome and go to `chrome://extensions`.
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select your `tab-audio-router` project folder.

### Step 2: Unlock Audio Output Device Names (Important First-Time Step)
Chrome hides or anonymizes full audio device labels (such as `Headphones (PTRON TWS)` or `Mi TV (NVIDIA High Definition Audio)`) until microphone permission is granted to the extension. Because small extension popups can close or block permission prompts, this extension uses a dedicated setup page:

1. Click the **Tab Audio Router** extension icon in the Chrome toolbar.
2. If you see **"Device names locked"** or generic labels like `Audio Output 1`, click **Click here to allow access** to open `permissions.html` in a normal tab.
3. Click **Allow Audio Device Access** and select **Allow** in Chrome's permission prompt.
4. Once confirmed, close the permissions tab and reopen the extension popup—your output devices should now appear by name.

*(Tip: Check `chrome://settings/content/microphone` if the prompt does not appear and make sure microphone access is not blocked globally in Chrome.)*

---

## How to Use It Daily

1. **Open your tabs** (for example, Tab 1 for your learning class and Tab 2 for YouTube on your TV).
2. **Route Tab 1:** Click Tab 1, open the **Tab Audio Router** popup, select your **pTron** output device, and click **Route Active Tab**.
3. **Route Tab 2:** Switch to Tab 2, open the popup, select your **Mi TV** output device, and click **Route Active Tab**.
4. **Stop routing a tab:** Switch to the routed tab, open the popup, and click **Stop Routing Active Tab** to unmute the tab and release the capture stream.

---

## Project Structure

```text
tab-audio-router/
├── manifest.json     # Extension configuration, permissions, and service worker entry
├── background.js     # Coordinates tab capture, tab muting, and offscreen messages
├── offscreen.html    # Host page for background audio playback
├── offscreen.js      # Captures tab stream and routes it via setSinkId()
├── popup.html        # Extension popup UI
├── popup.js          # Lists output devices and triggers start/stop routing
├── permissions.html  # One-time setup page for granting audio device label access
├── permissions.js    # Requests audio permission and verifies detected outputs
└── README.md         # Project documentation