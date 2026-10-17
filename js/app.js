(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const textInput = $("textInput");
  const themeToggle = $("themeToggle");
  const wordTarget = $("wordTarget");
  const toast = $("toast");
  let toastTimer;

 
  const numberFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

  function countWords(text) {
    // A word is a non-empty token separated by one or more Unicode whitespace characters.
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/u).length : 0;
  }

  function countCharacters(text) {
    // Array.from counts Unicode code points, so many emoji are counted as one character.
    return Array.from(text).length;
  }

  function countCharactersWithoutWhitespace(text) {
    return countCharacters(text.replace(/\s/gu, ""));
  }

  function countParagraphs(text) {
    // Paragraphs are non-empty blocks separated by one or more blank lines.
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\r?\n[\t \u00A0]*\r?\n+/u)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean).length;
  }

  function countLines(text) {
    // Empty input has zero lines; otherwise count physical lines, including a final blank line.
    return text.length === 0 ? 0 : text.split(/\r\n|\r|\n/u).length;
  }

  function countSentences(text) {
    // Estimate sentences by terminal punctuation. Avoid counting repeated punctuation as multiple endings.
    // Abbreviations, initials, decimals, and some language conventions can affect this estimate.
    const normalized = text.replace(/\s+/gu, " ").trim();
    if (!normalized) return 0;
    const matches = normalized.match(/[.!?…。！？]+(?=(?:["'”’»)\]}]*)(?:\s|$))/gu);
    return matches ? matches.length : 0;
  }

  function formatDuration(minutes) {
    if (!Number.isFinite(minutes) || minutes <= 0) return "0 dtk";
    const totalSeconds = Math.max(1, Math.ceil(minutes * 60));
    if (totalSeconds < 60) return `${totalSeconds} dtk`;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins < 60) return secs ? `${mins} mnt ${secs} dtk` : `${mins} mnt`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins ? `${hours} jam ${remainingMins} mnt` : `${hours} jam`;
  }

  function updateTargetProgress(words) {
    let target = Number.parseInt(wordTarget.value, 10);
    if (!Number.isFinite(target) || target < 1) target = 1000;
    target = Math.min(target, 1000000);
    const percent = Math.min(100, Math.round((words / target) * 100));
    $("targetProgressFill").style.width = `${percent}%`;
    $("targetProgress").setAttribute("aria-valuenow", String(percent));
    $("targetMessage").textContent = `${numberFormat.format(words)} dari ${numberFormat.format(target)} kata`;
    $("targetPercent").textContent = `${percent}%`;
  }

  function analyze() {
    const text = textInput.value;
    const words = countWords(text);
    const characters = countCharacters(text);
    const sentences = countSentences(text);
    const paragraphs = countParagraphs(text);
    const lines = countLines(text);
    const readingMinutes = words / 200;
    const speakingMinutes = words / 130;

    $("words").textContent = numberFormat.format(words);
    $("characters").textContent = numberFormat.format(characters);
    $("charactersNoSpaces").textContent = numberFormat.format(countCharactersWithoutWhitespace(text));
    $("sentences").textContent = numberFormat.format(sentences);
    $("paragraphs").textContent = numberFormat.format(paragraphs);
    $("lines").textContent = numberFormat.format(lines);
    $("readingTime").textContent = formatDuration(readingMinutes);
    $("speakingTime").textContent = formatDuration(speakingMinutes);
    $("avgSentenceLength").textContent = sentences ? numberFormat.format(words / sentences) : "0";
    $("avgParagraphLength").textContent = paragraphs ? numberFormat.format(words / paragraphs) : "0";
    $("inputStatus").textContent = text.length ? `${numberFormat.format(characters)} karakter dianalisis` : "Ready when you are";
    updateTargetProgress(words);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const dark = theme === "dark";
    themeToggle.setAttribute("aria-label", dark ? "Ganti ke tema terang" : "Ganti ke tema gelap");
    themeToggle.title = dark ? "Ganti ke tema terang" : "Ganti ke tema gelap";
    const themeColor = dark ? "#0d111b" : "#f7f8fa";
    document.querySelector('meta[name="theme-color"]').setAttribute("content", themeColor);
    try { localStorage.setItem("text-analyzer-theme", theme); } catch (_) { /* Storage can be unavailable in private contexts. */ }
  }

  textInput.addEventListener("input", analyze);
  wordTarget.addEventListener("input", () => {
    if (wordTarget.value !== "" && Number(wordTarget.value) > 0) {
      if (Number(wordTarget.value) > 1000000) wordTarget.value = "1000000";
      updateTargetProgress(countWords(textInput.value));
    } else {
      $("targetProgressFill").style.width = "0%";
      $("targetProgress").setAttribute("aria-valuenow", "0");
      $("targetMessage").textContent = "Masukkan target minimal 1 kata";
      $("targetPercent").textContent = "0%";
    }
  });

  $("clearButton").addEventListener("click", () => {
    textInput.value = "";
    analyze();
    textInput.focus();
    showToast("Teks berhasil dihapus.");
  });

  $("sampleButton").addEventListener("click", () => {
    textInput.value = sampleText;
    analyze();
    textInput.focus();
    showToast("Contoh teks berhasil dimuat.");
  });

  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "light";
    setTheme(current === "dark" ? "light" : "dark");
  });

  // Initial render.
  setTheme(document.documentElement.dataset.theme || "light");
  analyze();
})();
