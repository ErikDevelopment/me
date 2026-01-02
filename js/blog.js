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
    <button class="${tag === activeTag ? "active" : ""}" data-tag="${tag}">
      ${tag}
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

  grid.innerHTML = posts.map(post => `
    <article class="blog-card">
      <span class="tag">${post.tag}</span>
      <h2>${post.title}</h2>
      <p class="excerpt">${post.excerpt ?? ""}</p>

      <div class="content">
        ${renderMarkdown(post.content)}
      </div>

      <div class="read-more" data-id="${post.id}">
        Weiterlesen →
      </div>

      <div class="meta">
        <span>📅 ${formatDate(post.date)}</span>
      </div>
    </article>
  `).join("");

  setupReadMore();
}

/* =======================
   Single Post View
======================= */
function renderSinglePost(post) {
  tagFilterEl.innerHTML = "";

  grid.innerHTML = `
    <article class="blog-card">
      <span class="tag">${post.tag}</span>
      <h2>${post.title}</h2>

      <div class="content">
        ${renderMarkdown(post.content)}
      </div>

      <div class="meta">
        <span>📅 ${formatDate(post.date)}</span>
        <a class="read-more" href="blog.html">← zurück</a>
      </div>
    </article>
  `;
}

/* =======================
   Read More
======================= */
function setupReadMore() {
  grid.querySelectorAll(".read-more").forEach(btn => {
    btn.onclick = () => {
      const card = btn.closest(".blog-card");
      const expanded = card.classList.toggle("expanded");

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

    if (b.type === "list") {
      return `
        ${b.title ? `<p><strong>${b.title}</strong></p>` : ""}
        <ul>${b.items.map(i => `<li>${inlineMarkdown(i)}</li>`).join("")}</ul>
      `;
    }

    return "";
  }).join("");
}

function inlineMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

/* =======================
   Helpers
======================= */
function formatDate(date) {
  try {
    return new Date(date).toLocaleDateString("de-DE");
  } catch {
    return date ?? "—";
  }
}

function renderMessage(msg) {
  grid.innerHTML = `
    <article class="blog-card">
      <p class="excerpt">${msg}</p>
    </article>
  `;
}

/* =======================
   Start
======================= */
loadBlog();
