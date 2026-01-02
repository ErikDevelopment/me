/* =======================
   Config
======================= */
const USERNAME = "ErikDevelopment";
const API_URL = `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`;

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

/* =======================
   Custom Select (Sort)
======================= */
const sortTrigger = els.sortSelect.querySelector(".select-trigger");
const sortLabel = els.sortSelect.querySelector(".select-trigger span");
const sortOptions = els.sortSelect.querySelectorAll(".select-menu div");

let currentSort = "updated";

// Open / Close
sortTrigger.addEventListener("click", () => {
  els.sortSelect.classList.toggle("open");
});

// Select option
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

// Click outside → close
document.addEventListener("click", e => {
  if (!els.sortSelect.contains(e.target)) {
    els.sortSelect.classList.remove("open");
  }
});

/* =======================
   State
======================= */
let allRepos = [];

/* =======================
   Helpers
======================= */
function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
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
  const stars = repo.stargazers_count || 0;
  const forks = repo.forks_count || 0;
  return stars * 2 + forks;
}

/* =======================
   Filter + Sort
======================= */
function getFilteredSorted() {
  const q = (els.search.value || "").trim().toLowerCase();
  const hideForks = els.hideForks.checked;

  let list = allRepos.slice();

  if (hideForks) {
    list = list.filter(r => !r.fork);
  }

  if (q) {
    list = list.filter(r => {
      return (
        (r.name || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q) ||
        (r.language || "").toLowerCase().includes(q)
      );
    });
  }

  if (currentSort === "name") {
    list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  } else if (currentSort === "stars") {
    list.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
  } else {
    list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }

  return list;
}

/* =======================
   Render
======================= */
function render() {
  const list = getFilteredSorted();

  els.stats.textContent =
    `${list.length} Repos angezeigt` +
    (list.length !== allRepos.length ? ` (von ${allRepos.length})` : "");

  if (list.length === 0) {
    els.grid.innerHTML = `
      <div class="error">
        Keine Treffer. Versuch andere Suche oder deaktivier „Forks ausblenden“.
      </div>
    `;
    return;
  }

  els.grid.innerHTML = list.map(repo => {
    const name = escapeHtml(repo.name);
    const desc = escapeHtml(repo.description || "Keine Beschreibung.");
    const url = repo.html_url;
    const lang = repo.language ? escapeHtml(repo.language) : "—";
    const stars = repo.stargazers_count || 0;
    const forks = repo.forks_count || 0;
    const updated = fmtDate(repo.updated_at);
    const isFork = repo.fork;
    const featured = scoreRepo(repo) >= 10;

    return `
      <a class="card" href="${url}" target="_blank" rel="noopener noreferrer">
        <div class="card-top">
          <div class="title">${name}</div>
          <div class="badge ${featured ? "primary" : ""}">
            ${featured ? "featured" : "repo"}
          </div>
        </div>

        <div class="desc">${desc}</div>

        <div class="badges">
          <span class="badge">${lang}</span>
          <span class="badge">★ ${stars}</span>
          <span class="badge">⑂ ${forks}</span>
          ${isFork ? `<span class="badge">fork</span>` : ``}
        </div>

        <div class="meta">
          <span>updated: ${updated}</span>
          <span class="sep">•</span>
          <span class="highlight">Open →</span>
        </div>
      </a>
    `;
  }).join("");
}

/* =======================
   Load Repos
======================= */
async function loadRepos() {
  els.loader.hidden = false;
  els.error.hidden = true;

  try {
    const res = await fetch(API_URL, {
      headers: { Accept: "application/vnd.github+json" },
    });

    if (!res.ok) {
      throw new Error(`GitHub API Error ${res.status}`);
    }

    const repos = await res.json();
    allRepos = repos.filter(r => !r.disabled);

    render();

    els.loader.style.opacity = "0";
    setTimeout(() => els.loader.remove(), 300);

  } catch (err) {
    els.loader.hidden = true;
    els.error.hidden = false;
    els.error.textContent =
      `Konnte Repositories nicht laden. (${err.message})`;
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
loadRepos();
