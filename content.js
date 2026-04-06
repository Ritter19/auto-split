(function () {
  console.log("Auto Split Input Filler v4 Loaded");

  document.addEventListener("paste", function (e) {
    const target = e.target;

    if (!isValidInput(target)) return;

    const pastedData = (e.clipboardData || window.clipboardData).getData(
      "text",
    );
    if (!pastedData) return;

    const digits = pastedData.replace(/\D/g, "");

    // Only process valid IDs
    if (digits.length < 6) return;

    // CHECK TOGGLE FIRST
    chrome.storage.local.get(["enabled", "history"], function (result) {
      // If OFF → allow normal paste
      if (result.enabled === false) {
        return;
      }

      // ONLY NOW block default paste
      e.preventDefault();

      const inputs = getNearbyInputs(target);
      if (!inputs.length) return;

      let index = 0;
      let lastFilled = null;

      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];

        // detect max length (fallback = 4)
        let maxLen = input.maxLength;
        if (!maxLen || maxLen <= 0) maxLen = 4;

        const chunk = digits.slice(index, index + maxLen);
        if (!chunk) break;

        // simulate typing (for masked inputs)
        typeIntoInput(input, chunk);

        lastFilled = input;
        index += maxLen;
      }

      if (lastFilled) lastFilled.focus();

      saveHistory(pastedData, result.history || []);
    });
  });

  // simulate real typing (fix for React/masked inputs)
  function typeIntoInput(input, text) {
    input.focus();

    // clear existing value
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    for (let char of text) {
      input.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: char,
          bubbles: true,
        }),
      );

      input.value += char;

      input.dispatchEvent(new Event("input", { bubbles: true }));

      input.dispatchEvent(
        new KeyboardEvent("keyup", {
          key: char,
          bubbles: true,
        }),
      );
    }
  }

  function isValidInput(el) {
    const validTypes = ["text", "tel", "number", "password"];
    return (
      el &&
      el.tagName === "INPUT" &&
      validTypes.includes(el.type) &&
      !el.disabled &&
      !el.readOnly
    );
  }

  function getNearbyInputs(startInput) {
    const parent = startInput.closest("form, div");

    let inputs = parent
      ? Array.from(parent.querySelectorAll("input"))
      : Array.from(document.querySelectorAll("input"));

    inputs = inputs.filter(
      (el) => isValidInput(el) && el.offsetParent !== null,
    );

    const startIndex = inputs.indexOf(startInput);
    if (startIndex === -1) return [startInput];

    return inputs.slice(startIndex, startIndex + 6);
  }

  function saveHistory(value, history) {
    history.unshift(value);
    history = history.slice(0, 3);

    chrome.storage.local.set({ history });
  }
})();
