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
const sortLabel = els.sortSelect.querySelector(".select-trigger span");
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
  const orgas = ["ALL", ...new Set(repos.map(getRepoOrga))];

  orgaMenu.innerHTML = orgas.map(o => `
    <div data-orga="${o}">
      ${o === "ALL" ? "Alle Organizations" : o}
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

  els.grid.innerHTML = `
    ${renderOrgTiles()}
    ${renderRepoTiles(repos)}
  `;
}

/* =======================
   Render – Organizations
======================= */
function renderOrgTiles() {
  // Fallback: User-Profil
  if (!publicOrgs || publicOrgs.length === 0) {
    return `
      <a
        class="card"
        href="https://github.com/${USERNAME}"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div class="card-top" style="gap:.75rem;">
          <img
            src="https://github.com/${USERNAME}.png"
            alt="${USERNAME}"
            style="width:32px;height:32px;border-radius:50%;"
          />
          <div class="title">${USERNAME}</div>
          <div class="badge primary">profile</div>
        </div>

        <div class="desc">
          Persönliches GitHub-Profil
        </div>

        <div class="meta">
          <span class="highlight">Open Profile →</span>
        </div>
      </a>
    `;
  }

  // Normale Orga-Kacheln
  return publicOrgs.map(org => {
    const url = org.html_url || `https://github.com/${org.login}`;

    return `
      <a
        class="card"
        href="${url}"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div class="card-top" style="gap:.75rem;">
          <img
            src="${org.avatar_url}"
            alt="${org.login}"
            style="width:32px;height:32px;border-radius:50%;"
          />
          <div class="title">${org.login}</div>
          <div class="badge primary">organization</div>
        </div>

        <div class="desc">
          ${org.description || "Öffentliche GitHub Organization"}
        </div>

        <div class="meta">
          <span class="highlight">Open Organization →</span>
        </div>
      </a>
    `;
  }).join("");
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
    <a class="card" href="${repo.html_url}" target="_blank">
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

    allRepos   = (await repoRes.json()).filter(r => !r.disabled);
    publicOrgs = await orgRes.json();

    buildOrgaSelect(allRepos);
    render();

    els.loader.remove();

  } catch (err) {
    els.loader.remove();
    els.error.hidden = false;
    els.error.textContent = "Daten konnten nicht geladen werden.";
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
