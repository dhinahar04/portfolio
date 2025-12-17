(() => {
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

  const html = document.documentElement;
  const toast = qs("#toast");

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => toast.classList.remove("is-visible"), 1700);
  }

  function getPreferredTheme() {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  }

  function setTheme(theme) {
    html.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }

  // Theme init (early as possible)
  setTheme(getPreferredTheme());

  // Theme toggle
  const themeToggle = qs("#themeToggle");
  themeToggle?.addEventListener("click", () => {
    const current = html.getAttribute("data-theme") || "dark";
    setTheme(current === "dark" ? "light" : "dark");
  });

  // Mobile nav
  const navToggle = qs(".nav-toggle");
  const navMenu = qs("#nav-menu");
  const navLinks = qsa(".nav-link");

  function setNavOpen(open) {
    if (!navToggle || !navMenu) return;
    navToggle.setAttribute("aria-expanded", String(open));
    navMenu.classList.toggle("is-open", open);
    if (open) navLinks[0]?.focus?.();
  }

  navToggle?.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    setNavOpen(!expanded);
  });

  // Close nav on link click (mobile)
  navLinks.forEach((a) => {
    a.addEventListener("click", () => setNavOpen(false));
  });

  // Close nav on outside click / escape
  document.addEventListener("click", (e) => {
    if (!navMenu || !navToggle) return;
    const isOpen = navMenu.classList.contains("is-open");
    if (!isOpen) return;
    const target = e.target;
    if (target instanceof Node && !navMenu.contains(target) && !navToggle.contains(target)) {
      setNavOpen(false);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setNavOpen(false);
  });

  // Smooth scrolling (native, but ensure focus)
  navLinks.forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href") || "";
      if (!href.startsWith("#")) return;
      const id = href.slice(1);
      const target = qs(`#${CSS.escape(id)}`);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      window.setTimeout(() => target.removeAttribute("tabindex"), 800);
    });
  });

  // Scroll spy (active nav link) - stable calculation (fixes "Education always active" issue)
  const header = qs(".site-header");
  const sections = qsa("main section[id]");
  const navById = new Map(
    navLinks
      .map((a) => {
        const href = a.getAttribute("href") || "";
        return [href.startsWith("#") ? href.slice(1) : "", a];
      })
      .filter(([id]) => id)
  );

  let activeId = "";
  let spyTicking = false;

  function setActiveNav(id) {
    if (!id || id === activeId) return;
    activeId = id;
    navLinks.forEach((a) => a.classList.remove("is-active"));
    navById.get(id)?.classList.add("is-active");
  }

  function computeActiveSection() {
    const headerH = header?.offsetHeight ?? 80;
    const y = headerH + 18;
    let chosen = sections[0]?.id || "";

    for (const s of sections) {
      const r = s.getBoundingClientRect();
      const top = r.top;
      const bottom = r.bottom;
      // If the section crosses the "reading line" just under the sticky header, it's the active one
      if (top <= y && bottom > y) {
        chosen = s.id;
        break;
      }
      // If we've scrolled past a section, keep it as the candidate
      if (top <= y) chosen = s.id;
    }
    setActiveNav(chosen);
  }

  function onSpyScroll() {
    if (spyTicking) return;
    spyTicking = true;
    requestAnimationFrame(() => {
      computeActiveSection();
      spyTicking = false;
    });
  }

  window.addEventListener("scroll", onSpyScroll, { passive: true });
  window.addEventListener("resize", onSpyScroll);
  computeActiveSection();

  // Reveal animations
  const revealEls = qsa("[data-reveal]");
  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          reveal.unobserve(e.target);
        }
      });
    },
    { threshold: 0.18 }
  );
  revealEls.forEach((el) => reveal.observe(el));

  // Premium "spotlight" hover on cards (desktop / fine pointer only)
  if (window.matchMedia?.("(pointer: fine)")?.matches) {
    qsa(".card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        card.style.setProperty("--mx", `${x}%`);
        card.style.setProperty("--my", `${y}%`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.removeProperty("--mx");
        card.style.removeProperty("--my");
      });
    });
  }

  // Copy chips
  qsa("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-copy") || "";
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        showToast("Copied!");
      } catch {
        // Fallback
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        showToast("Copied!");
      }
    });
  });

  // Back to top
  const toTop = qs("#toTop");
  function setToTop() {
    const y = window.scrollY || 0;
    toTop?.classList.toggle("is-visible", y > 600);
  }
  setToTop();
  window.addEventListener("scroll", setToTop, { passive: true });
  toTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  // Print
  qs("#printResumeBtn")?.addEventListener("click", () => window.print());

  // Footer year
  const year = qs("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Contact form: mailto
  const form = qs("#contactForm");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const message = String(fd.get("message") || "").trim();

    const subject = encodeURIComponent(`Portfolio Contact — ${name || "Someone"}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\n— Sent from portfolio website`
    );

    window.location.href = `mailto:dhinaharmurugesan@gmail.com?subject=${subject}&body=${body}`;
    showToast("Opening email…");
    form.reset();
  });

  // Project modal
  const modal = qs("#modal");
  const modalTitle = qs("#modalTitle");
  const modalBody = qs("#modalBody");
  let lastFocusedEl = null;

  const modalData = {
    phishing: {
      title: "Phishing Email Detection",
      repo: "https://github.com/dhinahar04/phishing_email_detector",
      bullets: [
        "Extracted features from email content and URLs to classify phishing attempts.",
        "Trained and evaluated multiple models to improve accuracy and reliability.",
        "Deployed the model as a lightweight web app for real‑time predictions.",
      ],
      tags: ["ML", "NLP", "Deployment"],
    },
    vehicle: {
      title: "Vehicle Service & Maintenance Booking System",
      repo: "https://github.com/dhinahar04/Vehicle-Service-Maintenance-Booking-System",
      bullets: [
        "User booking flow: select service, schedule, and track appointment status.",
        "Service history view and status updates for customers.",
        "Admin/workshop dashboards to manage appointments and customer records.",
      ],
      tags: ["Full‑Stack", "Auth", "CRUD"],
    },
    flood: {
      title: "Flood Detection System",
      repo: "https://github.com/dhinahar04/flood_detection",
      bullets: [
        "React-based web UI focused on responsiveness and cross‑browser compatibility.",
        "Deployed as a web app with attention to performance and UX.",
        "Project repository contains implementation details (model, experiments, and/or app code).",
      ],
      tags: ["React", "UI", "Deployment"],
    },
  };

  function openModal(key) {
    if (!modal || !modalTitle || !modalBody) return;
    const data = modalData[key];
    if (!data) return;

    lastFocusedEl = document.activeElement;
    modalTitle.textContent = data.title;
    modalBody.innerHTML = `
      <div class="tag-row" aria-label="Project tags">
        ${data.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
      </div>
      <div class="project-links" aria-label="Project links">
        <a class="mini-link" href="${escapeHtml(data.repo)}" target="_blank" rel="noreferrer noopener">GitHub Repo</a>
      </div>
      <ul>
        ${data.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
      </ul>
    `;

    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    qs(".modal-panel [data-modal-close]")?.focus?.();
  }

  function closeModal() {
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
      lastFocusedEl.focus();
    }
    lastFocusedEl = null;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  qsa("[data-modal-open]").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.getAttribute("data-modal-open")));
  });

  qsa("[data-modal-close]").forEach((el) => el.addEventListener("click", closeModal));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
})();


