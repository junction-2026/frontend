(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const views = $$(".view");
  const navButtons = $$("[data-nav]");
  const textarea = $("#analyze-input");
  const charCount = $("#char-count");
  let analyzeTimer = null;

  function showView(name) {
    views.forEach((v) => v.classList.toggle("active", v.dataset.view === name));
    navButtons.forEach((b) => {
      const target = b.dataset.nav;
      const active =
        target === name ||
        (target === "analyze" && ["home", "analyzing", "results", "ask", "detail", "edges"].includes(name)) ||
        (target === "explore" && ["explore", "region"].includes(name)) ||
        (target === "history" && name === "history");
      b.classList.toggle("active", active);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    history.replaceState(null, "", `#${name}`);
  }

  function go(name) {
    if (analyzeTimer) {
      clearTimeout(analyzeTimer);
      analyzeTimer = null;
    }
    showView(name);
  }

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const map = {
        analyze: "home",
        explore: "explore",
        history: "history",
      };
      go(map[btn.dataset.nav] || btn.dataset.nav);
    });
  });

  $$("[data-go]").forEach((el) => {
    el.addEventListener("click", () => go(el.dataset.go));
  });

  $$(".mode-tabs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".mode-tabs button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  $$(".try-row button").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!textarea) return;
      textarea.value = btn.dataset.sample || btn.textContent;
      textarea.dispatchEvent(new Event("input"));
      textarea.focus();
    });
  });

  if (textarea && charCount) {
    const sync = () => {
      charCount.textContent = `${textarea.value.length} chars`;
    };
    textarea.addEventListener("input", sync);
    sync();
  }

  const analyzeBtn = $("#analyze-btn");
  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", () => {
      go("analyzing");
      analyzeTimer = setTimeout(() => go("results"), 2200);
    });
  }

  const cancelBtn = $("#cancel-analysis");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => go("home"));
  }

  $$(".filter-row button").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".filter-row button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  $$(".settings-tabs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".settings-tabs button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  const chatForm = $("#chat-form");
  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("#chat-input");
      if (!input || !input.value.trim()) return;
      const thread = $("#chat-thread");
      const bubble = document.createElement("div");
      bubble.className = "bubble-user";
      bubble.textContent = input.value.trim();
      thread.appendChild(bubble);
      input.value = "";
      thread.scrollTop = thread.scrollHeight;
    });
  }

  $$(".suggestions button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = $("#chat-input");
      if (!input) return;
      input.value = btn.textContent.replace(/→/g, "").trim();
      input.focus();
    });
  });

  const initial = (location.hash || "#home").slice(1) || "home";
  const known = views.map((v) => v.dataset.view);
  showView(known.includes(initial) ? initial : "home");

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      const historySearch = $("#history-search");
      if (historySearch && $(".view.active")?.dataset.view === "history") {
        e.preventDefault();
        historySearch.focus();
      }
    }
  });
})();
