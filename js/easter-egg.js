/* =======================
   Console Easter Egg
======================= */
console.log(
  '%c👀 Pssst… neugierig?',
  'font-size: 22px; font-weight: bold; color: #22c55e;'
);

console.log(
  '%cDu hast gerade ein Easter Egg gefunden.',
  'font-size: 14px; color: #6b8f7a;'
);

console.log(
  '%cBonus-Punkte für Developer-Neugier 🧠✨',
  'font-size: 13px; color: #6b8f7a;'
);

/* =======================
   Page Detection
======================= */
function detectPage() {
  const path = window.location.pathname.toLowerCase();

  if (path.includes("blog")) return "blog";
  if (path.includes("project")) return "projects";
  if (path.includes("hub") || path.includes("index")) return "hub";

  return "default";
}

/* =======================
   Footer Quote Loader
======================= */
async function loadFooterQuote() {
  const footerText = document.querySelector(".footer p");
  if (!footerText) return;

  try {
    const res = await fetch("assets/footer-quotes.json");
    if (!res.ok) throw new Error("footer-quotes.json nicht gefunden");

    const quotesByPage = await res.json();
    const page = detectPage();

    const quotes =
      quotesByPage[page] || quotesByPage.default;

    if (!Array.isArray(quotes) || quotes.length === 0) {
      throw new Error("Keine Quotes für Seite");
    }

    const quote =
      quotes[Math.floor(Math.random() * quotes.length)];

    footerText.innerHTML = `<span class="highlight">$</span> ${quote}`;

  } catch (err) {
    // Fallback (hardcoded, falls JSON fehlt)
    footerText.innerHTML =
      `<span class="highlight">$</span> echo "write clean code"`;

    console.warn("Footer Quote Fallback aktiv:", err.message);
  }
}

/* =======================
   Init
======================= */
loadFooterQuote();
