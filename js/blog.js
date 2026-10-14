const grid = document.getElementById("blogGrid");
const tagFilterEl = document.getElementById("tagFilter");

let allPosts = [];
let activeTag = "ALL";

/* =======================
   Load Blog
======================= */
async function loadBlog() {
  try {
    const res = await fetch("assets/blog.json");
    if (!res.ok) throw new Error("blog.json nicht gefunden");

    const data = await res.json();
    if (!Array.isArray(data.posts)) throw new Error("Keine Posts");

    allPosts = data.posts;
    init();

  } catch (err) {
    console.error(err);
    renderMessage("Blogeinträge konnten nicht geladen werden.");
  }
}

/* =======================
   Init
======================= */
function init() {
  const urlPost = new URLSearchParams(location.search).get("post");

  renderTagFilter();

  if (urlPost) {
    const post = allPosts.find(p => p.id === urlPost);
    if (post) {
      renderSinglePost(post);
      return;
    }
  }

  renderPosts();
}

/* =======================
   Tag Filter
======================= */
function renderTagFilter() {
  const tags = ["ALL", ...new Set(allPosts.map(p => p.tag))];

  tagFilterEl.innerHTML = tags.map(tag => `
    <button
      type="button"
      class="${tag === activeTag ? "active" : ""}"
      aria-pressed="${tag === activeTag}"
      data-tag="${escapeHtml(tag)}"
    >
      ${escapeHtml(tag)}
    </button>
  `).join("");

  tagFilterEl.querySelectorAll("button").forEach(btn => {
    btn.onclick = () => {
      activeTag = btn.dataset.tag;
      renderTagFilter();
      renderPosts();
    };
  });
}

/* =======================
   Render Posts (Grid)
======================= */
function renderPosts() {
  const posts = activeTag === "ALL"
    ? allPosts
    : allPosts.filter(p => p.tag === activeTag);

  if (posts.length === 0) {
    renderMessage("Keine Blogposts für diesen Tag.");
    return;
  }

  grid.innerHTML = posts.map(post => {
    const id = escapeHtml(post.id);

    return `
      <article class="blog-card">
        <span class="tag">${escapeHtml(post.tag)}</span>
        <h2>${escapeHtml(post.title)}</h2>
        <p class="excerpt">${escapeHtml(post.excerpt)}</p>

        <div class="content" id="content-${id}">
          <div class="content-inner">
            ${renderMarkdown(post.content)}
          </div>
        </div>

        <button
          type="button"
          class="read-more"
          aria-expanded="false"
          aria-controls="content-${id}"
        >
          Weiterlesen →
        </button>

        <div class="meta">
          <span>📅 ${formatDate(post.date)}</span>
          <a href="?post=${encodeURIComponent(post.id)}" title="Direktlink zu diesem Post">🔗 Permalink</a>
        </div>
      </article>
    `;
  }).join("");

  setupReadMore();
}

/* =======================
   Single Post View
======================= */
function renderSinglePost(post) {
  tagFilterEl.innerHTML = "";
  document.title = `${post.title} | Erik's Blog`;

  grid.innerHTML = `
    <article class="blog-card expanded">
      <span class="tag">${escapeHtml(post.tag)}</span>
      <h2>${escapeHtml(post.title)}</h2>

      <div class="content">
        <div class="content-inner">
          ${renderMarkdown(post.content)}
        </div>
      </div>

      <div class="meta">
        <span>📅 ${formatDate(post.date)}</span>
        <a class="read-more" href="blog.html">← alle Posts</a>
      </div>
    </article>
  `;
}

/* =======================
   Read More
======================= */
function setupReadMore() {
  grid.querySelectorAll("button.read-more").forEach(btn => {
    btn.onclick = () => {
      const card = btn.closest(".blog-card");
      const expanded = card.classList.toggle("expanded");

      btn.setAttribute("aria-expanded", expanded);
      btn.textContent = expanded
        ? "Weniger anzeigen"
        : "Weiterlesen →";
    };
  });
}

/* =======================
   Markdown Renderer (light)
======================= */
function renderMarkdown(blocks = []) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return "<p>Kein Inhalt vorhanden.</p>";
  }

  return blocks.map(b => {
    if (typeof b === "string") {
      return `<p>${inlineMarkdown(b)}</p>`;
    }

    if (b.type === "list" && Array.isArray(b.items)) {
      return `
        ${b.title ? `<p><strong>${escapeHtml(b.title)}</strong></p>` : ""}
        <ul>${b.items.map(i => `<li>${inlineMarkdown(i)}</li>`).join("")}</ul>
      `;
    }

    return "";
  }).join("");
}

// Erst escapen, dann Markdown – so bleibt eingebettetes HTML wirkungslos
function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

/* =======================
   Helpers
======================= */
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(date) {
  const d = new Date(date);
  return isNaN(d) ? escapeHtml(date ?? "—") : d.toLocaleDateString("de-DE");
}

function renderMessage(msg) {
  grid.innerHTML = `
    <article class="blog-card">
      <p class="excerpt">${escapeHtml(msg)}</p>
    </article>
  `;
}

/* =======================
   Start
======================= */
loadBlog();
