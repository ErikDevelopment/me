/* =======================
   Config
======================= */
const USERNAME = "ErikDevelopment";
const API_REPOS = `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`;
const API_ORGS  = `https://api.github.com/users/${USERNAME}/orgs`;

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
};

const orgaSelect = document.getElementById("orgaSelect");
const orgaLabel  = orgaSelect.querySelector(".select-trigger span");
const orgaMenu   = document.getElementById("orgaMenu");

/* =======================
   Custom Select – Sort
======================= */
const sortTrigger = els.sortSelect.querySelector(".select-trigger");
const sortLabel   = els.sortSelect.querySelector(".select-trigger span");
const sortOptions = els.sortSelect.querySelectorAll(".select-menu div");

sortTrigger.addEventListener("click", () => {
  els.sortSelect.classList.toggle("open");
});

sortOptions.forEach(option => {
  option.addEventListener("click", () => {
    currentSort = option.dataset.value;
    sortLabel.textContent = option.textContent;

    sortOptions.forEach(o => o.classList.remove("active"));
    option.classList.add("active");

    els.sortSelect.classList.remove("open");
    render();
  });
});

document.addEventListener("click", e => {
  if (!els.sortSelect.contains(e.target)) {
    els.sortSelect.classList.remove("open");
  }
});

/* =======================
   Custom Select – Orga
======================= */
orgaSelect.querySelector(".select-trigger").addEventListener("click", () => {
  orgaSelect.classList.toggle("open");
});

document.addEventListener("click", e => {
  if (!orgaSelect.contains(e.target)) {
    orgaSelect.classList.remove("open");
  }
});

/* =======================
   State
======================= */
let allRepos = [];
let publicOrgs = [];

/* =======================
   Helpers
======================= */
function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("de-DE");
  } catch {
    return iso ?? "";
  }
}

function escapeHtml(str) {
  return (str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function scoreRepo(repo) {
  return (repo.stargazers_count || 0) * 2 + (repo.forks_count || 0);
}

function getRepoOrga(repo) {
  return repo.owner?.login ?? "unknown";
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

  orgaMenu.innerHTML = orgas.map(o => `
    <div data-orga="${o}">
      ${o === "ALL" ? "Alle Repositories" : o}
    </div>
  `).join("");

  orgaMenu.querySelectorAll("div").forEach(opt => {
    opt.addEventListener("click", () => {
      activeOrga = opt.dataset.orga;
      orgaLabel.textContent = opt.textContent;
      orgaSelect.classList.remove("open");
      render();
    });
  });
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
    <a class="card" href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
      <div class="card-top">
        <div class="title">${escapeHtml(repo.name)}</div>
        <div class="badge ${scoreRepo(repo) >= 10 ? "primary" : ""}">
          ${getRepoOrga(repo)}
        </div>
      </div>

      <div class="desc">
        ${escapeHtml(repo.description || "Keine Beschreibung.")}
      </div>

      <div class="badges">
        <span class="badge">${repo.language || "—"}</span>
        <span class="badge">★ ${repo.stargazers_count}</span>
        <span class="badge">⑂ ${repo.forks_count}</span>
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
async function loadData() {
  try {
    const [repoRes, orgRes] = await Promise.all([
      fetch(API_REPOS, { headers: { Accept: "application/vnd.github+json" }}),
      fetch(API_ORGS,  { headers: { Accept: "application/vnd.github+json" }})
    ]);

    const userRepos = (await repoRes.json()).filter(r => !r.disabled);
    publicOrgs = await orgRes.json();

    const orgRepoPromises = publicOrgs.map(org =>
      fetch(`https://api.github.com/orgs/${org.login}/repos?per_page=100`, {
        headers: { Accept: "application/vnd.github+json" }
      }).then(res => res.ok ? res.json() : [])
    );

    const orgRepos = (await Promise.all(orgRepoPromises))
      .flat()
      .filter(r => !r.disabled);

    const repoMap = new Map();
    [...userRepos, ...orgRepos].forEach(repo => {
      repoMap.set(repo.full_name, repo);
    });

    allRepos = [...repoMap.values()];

    buildOrgaSelect(allRepos);
    render();

    els.loader.remove();

  } catch (err) {
    els.loader.remove();
    els.error.hidden = false;
    els.error.textContent = "Daten konnten nicht geladen werden.";
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
