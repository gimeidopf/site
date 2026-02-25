const stamp = document.getElementById("date-stamp");
if (stamp) {
  const now = new Date();
  stamp.textContent = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

const leaves = [...document.querySelectorAll(".leaf")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const brand = document.querySelector(".brand");

if (brand && !reducedMotion) {
  const fullName = brand.textContent || "";
  let i = 0;
  brand.textContent = "";
  brand.classList.add("typing");

  const tick = () => {
    i += 1;
    brand.textContent = fullName.slice(0, i);
    if (i < fullName.length) {
      window.setTimeout(tick, 70);
    } else {
      window.setTimeout(() => brand.classList.remove("typing"), 450);
    }
  };

  window.setTimeout(tick, 140);
}

if (leaves.length && !reducedMotion) {
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const states = leaves.map((leaf) => ({
    leaf,
    base: Number(leaf.dataset.baseRotation || 0),
    x: 0,
    y: 0,
    r: Number(leaf.dataset.baseRotation || 0),
    anchorX: 0,
    anchorY: 0
  }));

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const recalcAnchors = () => {
    states.forEach((state) => {
      const rect = state.leaf.getBoundingClientRect();
      state.anchorX = rect.left + rect.width / 2;
      state.anchorY = rect.top + rect.height / 2;
    });
  };

  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });
  window.addEventListener("resize", recalcAnchors);
  recalcAnchors();

  const animate = () => {
    states.forEach((state) => {
      const dx = pointer.x - state.anchorX;
      const dy = pointer.y - state.anchorY;

      // Linear target rotation avoids angle-wrap jitter when cursor hovers nearby.
      const targetRotation = state.base + clamp(dx * 0.028, -10, 10) + clamp(dy * 0.012, -5, 5);
      const targetX = clamp(dx * 0.02, -10, 10);
      const targetY = clamp(dy * 0.02, -10, 10);

      const ease = 0.05;
      state.r += (targetRotation - state.r) * ease;
      state.x += (targetX - state.x) * ease;
      state.y += (targetY - state.y) * ease;

      state.leaf.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0) rotate(${state.r.toFixed(2)}deg)`;
    });

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

const navLinks = [...document.querySelectorAll(".nav-link")];
const sectionLinks = navLinks
  .map((link) => {
    const id = link.getAttribute("href") || "";
    if (!id.startsWith("#")) return null;
    const section = document.querySelector(id);
    if (!section) return null;
    return { link, id, section };
  })
  .filter(Boolean);

const aboutSection = document.getElementById("about");
const publicationsSection = document.getElementById("publications");
const topRow = document.querySelector(".top-row");
const topIds = new Set(["#about", "#publications"]);
let activeId = "";
let topRowChoice = "#about";

const randomTilt = () => {
  const sign = Math.random() > 0.5 ? 1 : -1;
  const magnitude = 6 + Math.random() * 9;
  return `${(sign * magnitude).toFixed(2)}deg`;
};

const setActiveLink = (targetId, animate = true) => {
  if (!targetId) return;
  if (targetId === activeId && !animate) return;

  sectionLinks.forEach(({ link, id }) => {
    const isActive = id === targetId;
    link.classList.toggle("selected-sprout", isActive);
    if (!isActive) {
      link.classList.remove("sprouting");
    }
  });

  const target = sectionLinks.find(({ id }) => id === targetId);
  if (!target) return;

  if (animate) {
    target.link.style.setProperty("--sprout-tilt", randomTilt());
    target.link.classList.remove("sprouting");
    void target.link.offsetWidth;
    target.link.classList.add("sprouting");
    window.setTimeout(() => target.link.classList.remove("sprouting"), 760);
  }

  activeId = targetId;
};

const setTopRowVisual = (focusedId) => {
  if (!aboutSection || !publicationsSection) return;

  const focusAbout = focusedId === "#about";
  const focusPublications = focusedId === "#publications";

  aboutSection.classList.toggle("is-focused", focusAbout);
  aboutSection.classList.toggle("is-dimmed", focusPublications);
  publicationsSection.classList.toggle("is-focused", focusPublications);
  publicationsSection.classList.toggle("is-dimmed", focusAbout);
};

const setSectionVisual = (focusedId) => {
  sectionLinks.forEach(({ id, section }) => {
    const isFocused = id === focusedId;
    section.classList.toggle("is-focused", isFocused);
    section.classList.toggle("is-dimmed", Boolean(focusedId) && !isFocused);
  });
};

const updateActiveFromScroll = () => {
  if (!sectionLinks.length) return;

  if (window.scrollY <= 6) {
    setActiveLink("#about", "#about" !== activeId);
    setTopRowVisual("#about");
    setSectionVisual("#about");
    return;
  }

  if (topRow) {
    const rect = topRow.getBoundingClientRect();
    const inTopRowBand = rect.top < window.innerHeight * 0.62 && rect.bottom > 120;
    if (inTopRowBand) {
      setActiveLink(topRowChoice, topRowChoice !== activeId);
      setTopRowVisual(topRowChoice);
      setSectionVisual(topRowChoice);
      return;
    }
  }

  // If we're at the bottom, force-select the last section (usually Contact).
  const bottomGap = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
  if (bottomGap <= 2) {
    const last = sectionLinks[sectionLinks.length - 1];
    setActiveLink(last.id, last.id !== activeId);
    setTopRowVisual(last.id);
    setSectionVisual(last.id);
    return;
  }

  const activationLine = 220;
  let current = sectionLinks[0].id;

  sectionLinks.forEach(({ id, section }) => {
    const top = section.getBoundingClientRect().top;
    if (top <= activationLine) {
      current = id;
    }
  });

  setActiveLink(current, current !== activeId);
  setTopRowVisual(current);
  setSectionVisual(current);
};

navLinks.forEach((link) => {
  const targetId = link.getAttribute("href") || "";
  link.addEventListener("click", () => {
    if (topIds.has(targetId)) {
      topRowChoice = targetId;
      setTopRowVisual(topRowChoice);
    }
    setSectionVisual(targetId);
    setActiveLink(targetId, true);
  });
});

sectionLinks.forEach(({ id, section }) => {
  section.addEventListener("click", (event) => {
    if (!section.classList.contains("is-dimmed")) return;
    event.preventDefault();

    if (topIds.has(id)) {
      topRowChoice = id;
      setTopRowVisual(topRowChoice);
    }

    setSectionVisual(id);
    setActiveLink(id, true);
  });
});

const bindTopRowPanelSelection = (sectionEl, id) => {
  if (!sectionEl) return;
  sectionEl.addEventListener("click", () => {
    topRowChoice = id;
    setTopRowVisual(topRowChoice);
    setSectionVisual(topRowChoice);
    setActiveLink(id, true);
  });
};

bindTopRowPanelSelection(aboutSection, "#about");
bindTopRowPanelSelection(publicationsSection, "#publications");

let ticking = false;
const handleScrollOrResize = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateActiveFromScroll();
    ticking = false;
  });
};

window.addEventListener("scroll", handleScrollOrResize, { passive: true });
window.addEventListener("resize", handleScrollOrResize);
setTopRowVisual(topRowChoice);
updateActiveFromScroll();
