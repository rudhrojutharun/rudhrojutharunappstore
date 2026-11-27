const grantBtn = document.getElementById("grantBtn");
const msg = document.getElementById("msg");

grantBtn.addEventListener("click", async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());

    const devices = await navigator.mediaDevices.enumerateDevices();
    const outputs = devices.filter((d) => d.kind === "audiooutput");
    msg.textContent = "Found outputs: " + outputs.map((o) => o.label || o.deviceId).join(", ");
  } catch (err) {
    msg.textContent = "Permission error: " + err.message;
  }
});