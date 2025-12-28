/* Config */
const USERNAME = "ErikDevelopment";
const API_URL = `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`;

/* DOM Elements */
const els = {
  grid: document.getElementById("grid"),
  loader: document.getElementById("loader"),
  error: document.getElementById("error"),
  stats: document.getElementById("stats"),
  search: document.getElementById("search"),
  sort: document.getElementById("sort"),
  hideForks: document.getElementById("hideForks"),
};

/* State */
let allRepos = [];

/* Format Date (DE) */
function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  } catch {
    return iso ?? "";
  }
}

/* Escape HTML (XSS-safe) */
function escapeHtml(str) {
  return (str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* Repo Score (optische Gewichtung) */
function scoreRepo(repo) {
  const stars = repo.stargazers_count || 0;
  const forks = repo.forks_count || 0;
  return stars * 2 + forks;
}

/* Filter + Sort Logic */
function getFilteredSorted() {
  const q = (els.search.value || "").trim().toLowerCase();
  const hideForks = els.hideForks.checked;

  let list = allRepos.slice();

  if (hideForks) {
    list = list.filter(r => !r.fork);
  }

  if (q) {
    list = list.filter(r => {
      const name = (r.name || "").toLowerCase();
      const desc = (r.description || "").toLowerCase();
      const lang = (r.language || "").toLowerCase();
      return name.includes(q) || desc.includes(q) || lang.includes(q);
    });
  }

  const sort = els.sort.value;

  if (sort === "name") {
    list.sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  } else if (sort === "stars") {
    list.sort((a, b) =>
      (b.stargazers_count || 0) - (a.stargazers_count || 0)
    );
  } else {
    // updated
    list.sort((a, b) =>
      new Date(b.updated_at) - new Date(a.updated_at)
    );
  }

  return list;
}

/* Render Grid */
function render() {
  const list = getFilteredSorted();

  els.stats.textContent =
    `${list.length} Repos angezeigt` +
    (allRepos.length !== list.length
      ? ` (von ${allRepos.length})`
      : "");

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
          <div>
            <div class="title">${name}</div>
          </div>
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

  if (list.length === 0) {
    els.grid.innerHTML = `
      <div class="error">
        Keine Treffer. Versuch andere Suche oder deaktivier „Forks ausblenden“.
      </div>
    `;
  }
}

/* Load Repositories */
async function loadRepos() {
  els.loader.hidden = false;
  els.error.hidden = true;

  try {
    const res = await fetch(API_URL, {
      headers: { "Accept": "application/vnd.github+json" }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub API Error ${res.status}: ${text}`);
    }

    const repos = await res.json();
    allRepos = repos.filter(r => !r.disabled);

    render();

    // Fade out loader
    els.loader.style.opacity = "0";
    setTimeout(() => els.loader.remove(), 300);

  } catch (err) {
    els.loader.hidden = true;
    els.error.hidden = false;
    els.error.textContent =
      `Konnte Repositories nicht laden. (${err.message})`;
  }
}

/* Events */
els.search.addEventListener("input", render);
els.sort.addEventListener("change", render);
els.hideForks.addEventListener("change", render);

/* Init */
loadRepos();
