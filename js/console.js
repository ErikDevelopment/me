/* Elements */
const terminal = document.getElementById("terminal");
const restartBtn = document.getElementById("restartBtn");

/* Script Lines */
const script = [
  { cmd: "whoami", out: "Erik – Full-Stack Developer from Germany 🇩🇪" },
  { cmd: "pwd", out: "/home/erik/portfolio" },
  { cmd: "ls", out: "projects  skills  blog  contact  README.md" },
  { cmd: "cat README.md", out: "Hi 👋 I'm Erik. I build modern web apps, APIs and automations." },
  { cmd: "skills", out: "JavaScript, TypeScript, React, Python, Docker, Linux, SQL" },
  { cmd: "stack", out: "Frontend: React | Backend: Node.js, Python | DB: PostgreSQL, MongoDB" },
  { cmd: "cat projects.txt", out: "APIs, Dashboards, Discord Bots, Web Apps, Automations" },
  { cmd: "git status", out: "On branch main\nYour portfolio is clean ✔️" },
  { cmd: "git log --oneline", out: "a1c3d9f initial commit\nb7f4e21 add console\nc9e8a33 polish UI" },
  { cmd: "docker ps", out: "portfolio_app   running   0.0.0.0:3000->3000" },
  { cmd: "npm run build", out: "✔ Build successful\n✔ No errors found" },
  { cmd: "npm test", out: "All tests passed ✔️" },
  { cmd: "uptime", out: "up 365 days, 24/7 learning mode 🚀" },
  { cmd: "neofetch", out: "OS: Developer OS\nShell: zsh\nEditor: VS Code\nTheme: Dark + Neon" },
  { cmd: "echo \"coffein --level\"", out: "☕☕☕☕☕ (critical)" },
  { cmd: "sudo rm -rf /", out: "Permission denied 😈 nice try" },
  { cmd: "ping google.com", out: "pong 🏓 internet is alive" },
  { cmd: "fortune", out: "Talk is cheap. Show me the code. – Linus Torvalds" },
  { cmd: "date", out: new Date().toLocaleString("de-DE") },
  { cmd: "echo \"Open for freelance\"", out: "Yes. Let's build something cool 💚" },
  { cmd: "exit", out: "Session closed. Thanks for visiting 👋" }
];

/* State */
let line = 0;
let char = 0;
let timeout = null;

/* Reset Terminal */
function resetTerminal() {
  clearTimeout(timeout);
  terminal.innerHTML = "";
  line = 0;
  char = 0;
  typeCommand();
}

/* Typing Logic */
function typeCommand() {
  if (line >= script.length) return;

  const entry = script[line];

  // Create new command line
  if (char === 0) {
    const el = document.createElement("div");
    el.className = "line";
    el.innerHTML = `<span class="prompt">$</span> <span class="cmd"></span>`;
    terminal.appendChild(el);
  }

  // Type command character by character
  const current = terminal.lastChild.querySelector(".cmd");
  current.textContent += entry.cmd[char] || "";
  char++;

  if (char <= entry.cmd.length) {
    timeout = setTimeout(typeCommand, 60);
  } else {
    // Print output after command
    timeout = setTimeout(() => {
      const out = document.createElement("div");
      out.className = "output";
      out.textContent = entry.out;
      terminal.appendChild(out);

      char = 0;
      line++;
      timeout = setTimeout(typeCommand, 600);
    }, 300);
  }

  // Auto-scroll
  terminal.scrollTop = terminal.scrollHeight;
}

/* Restart Button */
if (restartBtn) {
  restartBtn.addEventListener("click", resetTerminal);
}

/* Start on Load */
typeCommand();
