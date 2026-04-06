document.addEventListener("DOMContentLoaded", async () => {
  const toggle = document.getElementById("toggle");
  const historyList = document.getElementById("historyList");

  const data = await chrome.storage.local.get(["enabled", "history"]);

  toggle.checked = data.enabled !== false;

  toggle.addEventListener("change", async () => {
    await chrome.storage.local.set({ enabled: toggle.checked });
  });

  renderHistory(data.history || []);

  function renderHistory(items) {
    historyList.innerHTML = "";

    items.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      historyList.appendChild(li);
    });
  }
});