const SVG_NS = "http://www.w3.org/2000/svg";
const links = [...document.querySelectorAll(".nav a")];
const sections = links.map((link) => document.querySelector(link.getAttribute("href")));
const rand = (min, max) => min + Math.random() * (max - min);
const f = (n) => n.toFixed(2);

// A hand-drawn frame around the link: four slightly crooked sides that overshoot or
// miss at the corners, short grass growing outward from the edges, and a few sprouts
// on top. Rebuilt on every activation so it never sits the same way twice.
const PX = 16;
const PY = 12;

function buildFrame(link) {
  link.querySelector(".frame")?.remove();

  const w = link.offsetWidth;
  const h = link.offsetHeight;
  const W = w + PX * 2;
  const H = h + PY * 2;
  const x0 = PX - 9;
  const y0 = PY - 2;
  const x1 = PX + w + 9;
  const y1 = PY + h + 2;
  const jit = () => rand(-0.9, 0.9);
  const corners = [
    [x0 + jit(), y0 + jit()],
    [x1 + jit(), y0 + jit()],
    [x1 + jit(), y1 + jit()],
    [x0 + jit(), y1 + jit()]
  ];

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "frame");
  svg.setAttribute("width", W);
  svg.setAttribute("height", H);
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("aria-hidden", "true");
  svg.style.left = `${-PX}px`;
  svg.style.top = `${-PY}px`;

  let markup = "";
  // top, right, bottom, left; each with its outward normal and tuft height range
  const sides = [
    { a: 0, b: 1, n: [0, -1], tall: [3.8, 6] },
    { a: 1, b: 2, n: [1, 0], tall: [3.6, 5.6] },
    { a: 2, b: 3, n: [0, 1], tall: [3.6, 5.4] },
    { a: 3, b: 0, n: [-1, 0], tall: [3.6, 5.6] }
  ];

  sides.forEach((side, i) => {
    const [ax, ay] = corners[side.a];
    const [bx, by] = corners[side.b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;
    // Overshoot or stop short at each end, like a quick pen stroke.
    const s0 = rand(-1, 2.6);
    const s1 = rand(-1, 2.6);
    const bow = rand(-0.7, 0.7);
    const sx = ax - ux * s0;
    const sy = ay - uy * s0;
    const ex = bx + ux * s1;
    const ey = by + uy * s1;
    const mx = (sx + ex) / 2 + side.n[0] * bow;
    const my = (sy + ey) / 2 + side.n[1] * bow;
    markup +=
      `<path class="edge" pathLength="1" style="--d:${i * 70}ms" ` +
      `d="M${f(sx)} ${f(sy)}Q${f(mx)} ${f(my)} ${f(ex)} ${f(ey)}"/>`;

    // Grass grows in small tufts of tapered, curving blades with gaps between them.
    for (let t = rand(2, 4); t < len - 2; t += rand(3.5, 6)) {
      const blades = Math.round(rand(2, 4));
      const tall = rand(...side.tall);
      for (let b = 0; b < blades; b += 1) {
        const spread = blades > 1 ? b / (blades - 1) - 0.5 : 0;
        const angle = spread * rand(0.35, 0.6) + rand(-0.12, 0.12);
        const hgt = tall * (1 - Math.abs(spread) * rand(0.2, 0.45));
        const along = t + spread * 1.2;
        const px = ax + ux * along + side.n[0] * bow * 0.5;
        const py = ay + uy * along + side.n[1] * bow * 0.5;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dx2 = side.n[0] * cos + ux * sin;
        const dy2 = side.n[1] * cos + uy * sin;
        const qx = ux * cos - side.n[0] * sin;
        const qy = uy * cos - side.n[1] * sin;
        const bw = rand(0.6, 0.8);
        const curl = (angle * 0.6 + rand(-0.15, 0.15)) * hgt;
        const tipx = px + dx2 * hgt + qx * curl;
        const tipy = py + dy2 * hgt + qy * curl;
        const c1x = px + dx2 * hgt * 0.55 + qx * (curl * 0.4 - bw * 0.4);
        const c1y = py + dy2 * hgt * 0.55 + qy * (curl * 0.4 - bw * 0.4);
        const c2x = px + dx2 * hgt * 0.5 + qx * (curl * 0.4 + bw * 0.6);
        const c2y = py + dy2 * hgt * 0.5 + qy * (curl * 0.4 + bw * 0.6);
        const delay = Math.round(280 + i * 40 + (t / len) * 90 + rand(0, 30));
        markup +=
          `<path class="blade${Math.random() < 0.4 ? " light" : ""}" style="--d:${delay}ms;transform-origin:${f(px)}px ${f(py)}px" ` +
          `d="M${f(px - qx * bw)} ${f(py - qy * bw)}Q${f(c1x)} ${f(c1y)} ${f(tipx)} ${f(tipy)}` +
          `Q${f(c2x)} ${f(c2y)} ${f(px + qx * bw)} ${f(py + qy * bw)}Z"/>`;
      }
    }
  });

  // Sprouts along the top edge only.
  const sproutSides = [{ a: 0, b: 1, turn: 0, count: w > 70 ? 6 : 4, stem: [5, 7.5], leaf: [2.2, 3] }];
  let order = 0;
  sproutSides.forEach((side) => {
    const [ax, ay] = corners[side.a];
    const [bx, by] = corners[side.b];
    const slot = 1 / side.count;
    for (let i = 0; i < side.count; i += 1) {
      const k = slot * i + rand(slot * 0.3, slot * 0.7);
      const x = ax + (bx - ax) * k;
      const base = ay + (by - ay) * k;
      const stem = rand(...side.stem);
      const top = base - stem;
      const leaf = rand(...side.leaf);
      const bend = rand(-0.6, 0.6);
      const delay = Math.round(420 + order * 35 + rand(0, 40));
      const turn = side.turn + rand(-12, 12);
      order += 1;
      markup +=
        `<g class="sprout" style="--d:${delay}ms;--r:${f(turn)}deg;transform-origin:${f(x)}px ${f(base)}px">` +
        `<path class="stem" d="M${f(x)} ${f(base)}q${f(bend)} ${f(-stem / 2)} 0 ${f(-stem)}"/>` +
        `<path class="leaf" d="M${f(x)} ${f(top)}c${f(-leaf * 0.35)} ${f(-leaf * 0.1)} ${f(-leaf)} ${f(-leaf * 0.45)} ${f(-leaf * 1.05)} ${f(-leaf * 0.95)}c${f(leaf * 0.55)} 0 ${f(leaf * 1)} ${f(leaf * 0.4)} ${f(leaf * 1.05)} ${f(leaf * 0.95)}z"/>` +
        `<path class="leaf" d="M${f(x)} ${f(top + 0.6)}c${f(leaf * 0.3)} ${f(-leaf * 0.1)} ${f(leaf * 0.85)} ${f(-leaf * 0.4)} ${f(leaf * 0.9)} ${f(-leaf * 0.8)}c${f(-leaf * 0.5)} 0 ${f(-leaf * 0.85)} ${f(leaf * 0.35)} ${f(-leaf * 0.9)} ${f(leaf * 0.8)}z"/>` +
        `</g>`;
    }
  });

  svg.innerHTML = markup;
  link.append(svg);
  return svg;
}

let current = null;

function setActive(link) {
  if (link === current) return;
  current?.classList.remove("active");
  current?.removeAttribute("aria-current");
  current = link;
  if (!link) return;
  // Force a style flush so the new frame starts undrawn and draws in.
  buildFrame(link).getBoundingClientRect();
  link.classList.add("active");
  link.setAttribute("aria-current", "true");
}

function sectionInView() {
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  if (atBottom) return links[links.length - 1];
  const line = window.innerHeight * 0.35;
  let match = links[0];
  sections.forEach((section, i) => {
    if (section && section.getBoundingClientRect().top <= line) match = links[i];
  });
  return match;
}

let clickLock = 0;
links.forEach((link) =>
  link.addEventListener("click", () => {
    setActive(link);
    // Hold the clicked item while the page smooth-scrolls past other sections.
    clickLock = Date.now() + 900;
  })
);

let ticking = false;
window.addEventListener(
  "scroll",
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateLeaf();
      if (Date.now() > clickLock) setActive(sectionInView());
    });
  },
  { passive: true }
);

window.addEventListener("resize", () => {
  updateLeaf();
  if (current) buildFrame(current);
});

// Wait for the web font so the frame matches the final size of the word.
document.fonts.ready.then(() => setActive(sectionInView()));

// Decellularize the leaf as the page scrolls: 0 at the top, 1 at the bottom.
const leaf = document.querySelector(".leaf-mark");

function updateLeaf() {
  if (!leaf) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  leaf.style.setProperty("--p", p.toFixed(3));
}

updateLeaf();
