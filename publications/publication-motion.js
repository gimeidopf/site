(() => {
  const field = document.querySelector(".leaf-field");
  if (!field) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5, active: false };
  const cells = [];
  const radius = 240;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const NS = "http://www.w3.org/2000/svg";
  const lightTone = [184, 198, 174];
  const darkTone = [132, 155, 116];
  const mixTone = (t) => {
    const r = Math.round(lerp(lightTone[0], darkTone[0], t));
    const g = Math.round(lerp(lightTone[1], darkTone[1], t));
    const b = Math.round(lerp(lightTone[2], darkTone[2], t));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const makeLeafNode = () => {
    const holder = document.createElement("div");
    holder.className = "leaf-cell";

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");

    const outline = document.createElementNS(NS, "path");
    outline.setAttribute("class", "leaf-outline");
    outline.setAttribute("d", "M9 18c6.218 0 10.5 -3.288 11 -12v-2h-4.014c-9 0 -11.986 4 -12 9c0 1 0 3 2 5h3z");

    const vein = document.createElementNS(NS, "path");
    vein.setAttribute("class", "leaf-vein");
    vein.setAttribute("d", "M5 21c.5 -4.5 2.5 -8 7 -10");

    svg.append(outline, vein);
    holder.appendChild(svg);
    return holder;
  };

  const buildGrid = () => {
    field.innerHTML = "";
    cells.length = 0;

    const spacing = window.innerWidth < 760 ? 42 : 48;
    const cols = Math.ceil(window.innerWidth / spacing) + 2;
    const rows = Math.ceil(window.innerHeight / spacing) + 2;
    const startX = -(spacing * 0.5);
    const startY = -(spacing * 0.5);

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const x = startX + (col * spacing) + ((row % 2) * spacing * 0.25);
        const y = startY + (row * spacing);
        const node = makeLeafNode();
        field.appendChild(node);
        cells.push({
          node,
          x,
          y,
          base: 18 + ((Math.random() * 2) - 1),
          currentRot: 0,
          currentScale: 1,
          currentOpacity: 0.22 + Math.random() * 0.04,
          currentTone: 0
        });
      }
    }
  };

  const update = (timeMs) => {
    const t = timeMs * 0.001;
    const idleAmp = reducedMotion ? 0 : 0.9;

    cells.forEach((cell, index) => {
      const dx = pointer.x - cell.x;
      const dy = pointer.y - cell.y;
      const dist = Math.hypot(dx, dy);
      const influence = clamp(1 - (dist / radius), 0, 1);
      const falloff = influence * influence;
      const angleToPointer = Math.atan2(dy, dx) * (180 / Math.PI);
      const pulse = Math.sin((t * 1.4) + (index * 0.08));
      const drift = Math.sin((t * 0.9) + (index * 0.04));

      const pointerTilt = clamp((angleToPointer - cell.base) * 0.02 * falloff, -2, 2);
      const targetRot = cell.base + pointerTilt + (pulse * 0.08 * idleAmp);
      const targetScale = 0.96 + (falloff * 0.26) + (drift * 0.006 * idleAmp);
      const targetOpacity = 0.2 + (falloff * 0.24);
      const targetTone = falloff * 0.92;

      cell.currentRot = lerp(cell.currentRot, targetRot, reducedMotion ? 0.16 : 0.11);
      cell.currentScale = lerp(cell.currentScale, targetScale, reducedMotion ? 0.16 : 0.11);
      cell.currentOpacity = lerp(cell.currentOpacity, targetOpacity, reducedMotion ? 0.18 : 0.12);
      cell.currentTone = lerp(cell.currentTone, targetTone, reducedMotion ? 0.2 : 0.14);

      cell.node.style.left = `${cell.x}px`;
      cell.node.style.top = `${cell.y}px`;
      cell.node.style.opacity = cell.currentOpacity.toFixed(3);
      cell.node.style.color = mixTone(cell.currentTone);
      cell.node.style.transform = `translate(-50%, -50%) rotate(${cell.currentRot.toFixed(2)}deg) scale(${cell.currentScale.toFixed(3)})`;
    });

    requestAnimationFrame(update);
  };

  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  });

  window.addEventListener("pointerleave", () => {
    pointer.active = false;
    pointer.x = window.innerWidth * 0.5;
    pointer.y = window.innerHeight * 0.5;
  });

  window.addEventListener("resize", buildGrid);

  buildGrid();
  requestAnimationFrame(update);
})();
