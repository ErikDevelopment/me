/* =======================
   Config
======================= */
const USERNAME = "ErikDevelopment";
const API_REPOS = `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`;
const API_ORGS  = `https://api.github.com/users/${USERNAME}/orgs`;
const GH_HEADERS = { headers: { Accept: "application/vnd.github+json" } };

const CACHE_KEY = "gh-repos-v1";
const CACHE_TTL = 15 * 60 * 1000; // 15 Minuten

let activeOrga = "ALL";
let currentSort = "updated";

/* =======================
   DOM Elements
======================= */
const els = {
  grid: document.getElementById("grid"),
  loader: document.getElementById("loader"),
  error: document.getElementById("error"),
  stats: document.getElementById("stats"),
  search: document.getElementById("search"),
  hideForks: document.getElementById("hideForks"),
  sortSelect: document.getElementById("sortSelect"),
  orgaSelect: document.getElementById("orgaSelect"),
  orgaMenu: document.getElementById("orgaMenu"),
};

/* =======================
   Custom Select (Maus + Tastatur)
======================= */
const selects = [];

function setupSelect(root, onChange) {
  const trigger = root.querySelector(".select-trigger");
  const label   = trigger.querySelector("span");
  const menu    = root.querySelector(".select-menu");

  const options = () => [...menu.querySelectorAll('[role="option"]')];

  function open() {
    selects.forEach(s => s !== api && s.close());
    root.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
    const current = options().find(o => o.getAttribute("aria-selected") === "true");
    (current || options()[0])?.focus();
  }

  function close() {
    root.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
  }

  function choose(option) {
    options().forEach(o => {
      const selected = o === option;
      o.classList.toggle("active", selected);
      o.setAttribute("aria-selected", selected);
    });
    label.textContent = option.textContent.trim();
    close();
    trigger.focus();
    onChange(option.dataset.value);
  }

  trigger.addEventListener("click", () => {
    root.classList.contains("open") ? close() : open();
  });

  trigger.addEventListener("keydown", e => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      open();
    }
  });

  menu.addEventListener("click", e => {
    const option = e.target.closest('[role="option"]');
    if (option) choose(option);
  });

  menu.addEventListener("keydown", e => {
    const list = options();
    const i = list.indexOf(document.activeElement);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        list[Math.min(i + 1, list.length - 1)]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        list[Math.max(i - 1, 0)]?.focus();
        break;
      case "Home":
        e.preventDefault();
        list[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        list[list.length - 1]?.focus();
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (i >= 0) choose(list[i]);
        break;
      case "Escape":
        e.preventDefault();
        close();
        trigger.focus();
        break;
      case "Tab":
        close();
        break;
    }
  });

  const api = { root, close };
  selects.push(api);
  return api;
}

// Ein globaler Listener schließt alle offenen Selects bei Klick außerhalb
document.addEventListener("click", e => {
  selects.forEach(s => {
    if (!s.root.contains(e.target)) s.close();
  });
});

setupSelect(els.sortSelect, value => {
  currentSort = value;
  render();
});

setupSelect(els.orgaSelect, value => {
  activeOrga = value;
  render();
});

/* =======================
   State
======================= */
let allRepos = [];

/* =======================
   Helpers
======================= */
function fmtDate(iso) {
  const d = new Date(iso);
  return isNaN(d) ? escapeHtml(iso) : d.toLocaleDateString("de-DE");
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(url) {
  return /^https:\/\/github\.com\//.test(url ?? "") ? escapeHtml(url) : "#";
}

function scoreRepo(repo) {
  return (repo.stargazers_count || 0) * 2 + (repo.forks_count || 0);
}

function getRepoOrga(repo) {
  return repo.owner?.login ?? "unknown";
}

/* =======================
   Cache (localStorage, gilt über Tabs und Besuche hinweg)
======================= */
function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.time < CACHE_TTL) return cached.repos;
  } catch {
    // Storage nicht verfügbar oder kaputt → ignorieren
  }
  return null;
}

function writeCache(repos) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), repos }));
  } catch {
    // Storage voll oder blockiert → ohne Cache weiter
  }
}

// Nur die Felder behalten, die wir wirklich anzeigen (hält den Cache klein)
function slimRepo(r) {
  return {
    name: r.name,
    full_name: r.full_name,
    html_url: r.html_url,
    description: r.description,
    language: r.language,
    stargazers_count: r.stargazers_count,
    forks_count: r.forks_count,
    fork: r.fork,
    updated_at: r.updated_at,
    owner: { login: r.owner?.login },
  };
}

/* =======================
   Organization Select
======================= */
function buildOrgaSelect(repos) {
  // Alle Owner aus Repos sammeln (User + Orgas)
  const owners = new Set(repos.map(getRepoOrga));

  // Reihenfolge: ALL → User → Orgas
  const orgas = [
    "ALL",
    USERNAME,
    ...[...owners].filter(o => o !== USERNAME)
  ];

  els.orgaMenu.innerHTML = orgas.map(o => `
    <div
      role="option"
      tabindex="-1"
      data-value="${escapeHtml(o)}"
      aria-selected="${o === activeOrga}"
      class="${o === activeOrga ? "active" : ""}"
    >
      ${o === "ALL" ? "Alle Repos" : escapeHtml(o)}
    </div>
  `).join("");
}

/* =======================
   Filter + Sort
======================= */
function getFilteredSorted() {
  let list = allRepos.slice();
  const q = els.search.value.toLowerCase();

  if (activeOrga !== "ALL") {
    list = list.filter(r => getRepoOrga(r) === activeOrga);
  }

  if (els.hideForks.checked) {
    list = list.filter(r => !r.fork);
  }

  if (q) {
    list = list.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q) ||
      (r.language || "").toLowerCase().includes(q)
    );
  }

  if (currentSort === "name") {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (currentSort === "stars") {
    list.sort((a, b) => b.stargazers_count - a.stargazers_count);
  } else {
    list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }

  return list;
}

/* =======================
   Render
======================= */
function render() {
  const repos = getFilteredSorted();

  els.stats.textContent =
    `${repos.length} Repos angezeigt (gesamt ${allRepos.length})`;

  els.grid.innerHTML = renderRepoTiles(repos);
}

/* =======================
   Render – Repos
======================= */
function renderRepoTiles(repos) {
  if (!repos.length) {
    return `
      <div class="error">
        Keine Treffer. Filter oder Suche anpassen.
      </div>
    `;
  }

  return repos.map(repo => `
    <a class="card" href="${safeUrl(repo.html_url)}" target="_blank" rel="noopener noreferrer">
      <div class="card-top">
        <div class="title">${escapeHtml(repo.name)}</div>
        <div class="badge ${scoreRepo(repo) >= 10 ? "primary" : ""}">
          ${escapeHtml(getRepoOrga(repo))}
        </div>
      </div>

      <div class="desc">
        ${escapeHtml(repo.description || "Keine Beschreibung.")}
      </div>

      <div class="badges">
        <span class="badge">${escapeHtml(repo.language || "—")}</span>
        <span class="badge">★ ${Number(repo.stargazers_count) || 0}</span>
        <span class="badge">⑂ ${Number(repo.forks_count) || 0}</span>
        ${repo.fork ? `<span class="badge">fork</span>` : ``}
      </div>

      <div class="meta">
        <span>updated: ${fmtDate(repo.updated_at)}</span>
        <span class="sep">•</span>
        <span class="highlight">Open →</span>
      </div>
    </a>
  `).join("");
}

/* =======================
   Load Data
======================= */
async function fetchRepos() {
  const [repoRes, orgRes] = await Promise.all([
    fetch(API_REPOS, GH_HEADERS),
    fetch(API_ORGS, GH_HEADERS)
  ]);

  if (!repoRes.ok) {
    throw new Error(
      repoRes.status === 403 || repoRes.status === 429
        ? "GitHub API Rate-Limit erreicht. Bitte später erneut versuchen."
        : `GitHub API Fehler (${repoRes.status}).`
    );
  }

  const userRepos = (await repoRes.json()).filter(r => !r.disabled);
  const publicOrgs = orgRes.ok ? await orgRes.json() : [];

  const orgRepoPromises = publicOrgs.map(org =>
    fetch(`https://api.github.com/orgs/${encodeURIComponent(org.login)}/repos?per_page=100`, GH_HEADERS)
      .then(res => res.ok ? res.json() : [])
  );

  const orgRepos = (await Promise.all(orgRepoPromises))
    .flat()
    .filter(r => !r.disabled);

  const repoMap = new Map();
  [...userRepos, ...orgRepos].forEach(repo => {
    repoMap.set(repo.full_name, slimRepo(repo));
  });

  return [...repoMap.values()];
}

async function loadData() {
  try {
    allRepos = readCache();

    if (!allRepos) {
      allRepos = await fetchRepos();
      writeCache(allRepos);
    }

    buildOrgaSelect(allRepos);
    render();

    els.loader.remove();

  } catch (err) {
    els.loader.remove();
    els.error.hidden = false;
    els.error.textContent = err.message.startsWith("GitHub API")
      ? err.message
      : "Daten konnten nicht geladen werden.";
    console.error(err);
  }
}

/* =======================
   Events
======================= */
els.search.addEventListener("input", render);
els.hideForks.addEventListener("change", render);

/* =======================
   Init
======================= */
loadData();
