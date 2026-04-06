(function () {
  console.log("Auto Split Input Filler v6 Loaded");

  document.addEventListener("paste", function (e) {
    const target = e.target;

    if (!isValidInput(target)) return;

    // safer clipboard access
    const pastedData = e.clipboardData?.getData("text") || "";
    if (!pastedData) return;

    const digits = pastedData.replace(/\D/g, "");

    // Always save history (Group + Individual)
    const type = digits.length >= 6 ? "Individual" : "Group";
    safeSaveHistory(`${pastedData} - ${type}`);

    // SAFE chrome.storage access (no crash)
    try {
      chrome.storage.local.get(["enabled"], function (result) {
        // If extension context is invalid → exit silently
        if (chrome.runtime?.lastError) {
          console.warn("Extension context invalidated");
          return;
        }

        // Toggle OFF → allow normal paste
        if (result.enabled === false) return;

        // Group → do not auto split
        if (digits.length < 6) return;

        // Now override paste
        e.preventDefault();

        const inputs = getNearbyInputs(target);
        if (!inputs.length) return;

        let index = 0;
        let lastFilled = null;

        for (let i = 0; i < inputs.length; i++) {
          const input = inputs[i];

          let maxLen = input.maxLength;
          if (!maxLen || maxLen <= 0) maxLen = 4;

          const chunk = digits.slice(index, index + maxLen);
          if (!chunk) break;

          typeIntoInput(input, chunk);

          lastFilled = input;
          index += maxLen;
        }

        if (lastFilled) lastFilled.focus();
      });
    } catch (err) {
      console.warn("Safe fail:", err);
    }
  });

  // simulate typing (works with masked / React inputs)
  function typeIntoInput(input, text) {
    input.focus();

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

  // SAFE HISTORY SAVE (no crash if context invalid)
  function safeSaveHistory(entry) {
    try {
      chrome.storage.local.get(["history"], function (result) {
        if (chrome.runtime?.lastError) return;

        let history = result.history || [];

        history = history.filter((item) => item !== entry);
        history.unshift(entry);
        history = history.slice(0, 3);

        chrome.storage.local.set({ history });
      });
    } catch (err) {
      console.warn("History save failed safely:", err);
    }
  }
})();
