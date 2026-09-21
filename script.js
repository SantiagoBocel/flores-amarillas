const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
let W, H, DPR;

const rand = (a, b) => a + Math.random() * (b - a);
const ease = t => 1 - Math.pow(1 - t, 3);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  makeStars();
}

/* ---------- Fondo ---------- */
let stars = [];
function makeStars() {
  stars = Array.from({ length: Math.floor(W / 8) }, () => ({
    x: rand(0, W), y: rand(0, H * 0.6), r: rand(0.4, 1.4), p: rand(0, 6.28)
  }));
}

function drawBackground(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#120d2b");
  g.addColorStop(0.55, "#3a1c5c");
  g.addColorStop(0.85, "#8a3a6a");
  g.addColorStop(1, "#c96a4a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  for (const s of stars) {
    ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.0012 + s.p));
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, 6.283);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // luna
  const mx = W * 0.85, my = H * 0.16, mr = Math.min(W, H) * 0.05;
  const mg = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 4);
  mg.addColorStop(0, "rgba(255,245,200,.35)");
  mg.addColorStop(1, "rgba(255,245,200,0)");
  ctx.fillStyle = mg;
  ctx.fillRect(mx - mr * 4, my - mr * 4, mr * 8, mr * 8);
  ctx.fillStyle = "#fff6cf";
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, 6.283);
  ctx.fill();

  // colina
  ctx.fillStyle = "#1a3a1f";
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 20) {
    ctx.lineTo(x, H - 30 - Math.sin(x * 0.006 + 1) * 22 - Math.sin(x * 0.015) * 8);
  }
  ctx.lineTo(W, H);
  ctx.fill();
}

/* ---------- Partículas ---------- */
const petals = [];   // pétalos que caen
const flies = [];    // luciérnagas / polen

function spawnFlies() {
  flies.length = 0;
  for (let i = 0; i < 45; i++) {
    flies.push({ x: rand(0, W), y: rand(H * 0.3, H), vx: rand(-.2, .2), vy: rand(-.3, -.05), p: rand(0, 6.28), r: rand(1, 2.6) });
  }
}

function drawFlies(t) {
  for (const f of flies) {
    f.x += f.vx + Math.sin(t * 0.001 + f.p) * 0.3;
    f.y += f.vy;
    if (f.y < -10) { f.y = H + 10; f.x = rand(0, W); }
    const a = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.002 + f.p));
    const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 6);
    g.addColorStop(0, `rgba(255,240,120,${a})`);
    g.addColorStop(1, "rgba(255,240,120,0)");
    ctx.fillStyle = g;
    ctx.fillRect(f.x - f.r * 6, f.y - f.r * 6, f.r * 12, f.r * 12);
  }
}

function drawPetals() {
  for (let i = petals.length - 1; i >= 0; i--) {
    const p = petals[i];
    p.x += p.vx + Math.sin(p.y * 0.02 + p.ph) * 0.6;
    p.y += p.vy;
    p.rot += p.vr;
    if (p.y > H + 20) { petals.splice(i, 1); continue; }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(1, Math.abs(Math.cos(p.rot * 1.3)) * 0.6 + 0.4);
    ctx.fillStyle = "#ffd21f";
    ctx.beginPath();
    ctx.ellipse(0, 0, p.s, p.s * 0.4, 0, 0, 6.283);
    ctx.fill();
    ctx.restore();
  }
}

/* ---------- Flores ---------- */
const flowers = [];

class Flower {
  constructor(x, delay = 0) {
    this.x = x;
    this.base = H - rand(5, 40);
    this.h = rand(H * 0.25, H * 0.62);
    this.size = rand(28, 58) * clamp(Math.min(W, H) / 700, 0.6, 1.3);
    this.n = Math.floor(rand(13, 20));
    this.bend = rand(-40, 40);
    this.phase = rand(0, 6.28);
    this.rot = rand(0, 6.28);
    this.tilt = rand(-0.25, 0.25);
    this.born = performance.now() + delay;
    this.leaves = [rand(0.25, 0.4), rand(0.5, 0.65)];
    this.dropAt = 0;
  }

  get growth() { return ease(clamp((performance.now() - this.born) / 3200)); }
  get bloom()  { return ease(clamp((performance.now() - this.born - 2600) / 2200)); }

  stemPoint(u, sway) {
    // curva cuadrática de la base (0,0) a la punta
    const g = this.growth;
    const tipX = this.x + this.bend * 0.5 + sway * g;
    const tipY = this.base - this.h * g;
    const cx = this.x + this.bend + sway * 0.3 * g, cy = this.base - this.h * g * 0.5;
    const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
    return { x: a * this.x + b * cx + c * tipX, y: a * this.base + b * cy + c * tipY };
  }

  draw(t) {
    const g = this.growth;
    if (g <= 0) return;
    const sway = Math.sin(t * 0.0012 + this.phase) * 14;

    // tallo
    ctx.strokeStyle = "#2f7d32";
    ctx.lineWidth = 4 + this.size * 0.06;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const p = this.stemPoint(i / 20, sway);
      i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
    }
    ctx.stroke();

    // hojas
    this.leaves.forEach((u, i) => {
      if (g < u) return;
      const lg = ease(clamp((g - u) / 0.25));
      const p = this.stemPoint(u, sway);
      const dir = i % 2 ? 1 : -1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(dir * 0.9 + Math.sin(t * 0.0015 + this.phase) * 0.05);
      ctx.scale(dir, 1);
      ctx.fillStyle = "#3d9a3f";
      ctx.beginPath();
      const L = this.size * 1.1 * lg;
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(L * 0.5, -L * 0.35, L, 0);
      ctx.quadraticCurveTo(L * 0.5, L * 0.3, 0, 0);
      ctx.fill();
      ctx.restore();
    });

    // cabeza
    const tip = this.stemPoint(1, sway);
    const bl = this.bloom;
    const budR = 6 + this.size * 0.25 * g;
    if (bl <= 0) {
      ctx.fillStyle = "#4aa84c";
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, budR, 0, 6.283);
      ctx.fill();
      return;
    }

    ctx.save();
    ctx.translate(tip.x, tip.y);
    ctx.rotate(this.tilt + sway * 0.008);

    // resplandor
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 2.2);
    glow.addColorStop(0, "rgba(255,220,60,.28)");
    glow.addColorStop(1, "rgba(255,220,60,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(-this.size * 2.2, -this.size * 2.2, this.size * 4.4, this.size * 4.4);

    // dos capas de pétalos
    for (let layer = 0; layer < 2; layer++) {
      const n = this.n;
      const len = this.size * (layer ? 0.85 : 1) * bl;
      const wid = len * 0.24;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.283 + this.rot + layer * (3.14159 / n);
        const breathe = 1 + Math.sin(t * 0.002 + i + this.phase) * 0.03;
        ctx.save();
        ctx.rotate(a);
        const grd = ctx.createLinearGradient(len * 0.2, 0, len * breathe, 0);
        grd.addColorStop(0, layer ? "#e8a800" : "#ffbf00");
        grd.addColorStop(1, layer ? "#ffd21f" : "#ffee5a");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(len * 0.15, 0);
        ctx.bezierCurveTo(len * 0.4, -wid * 1.3, len * 0.85 * breathe, -wid, len * breathe, 0);
        ctx.bezierCurveTo(len * 0.85 * breathe, wid, len * 0.4, wid * 1.3, len * 0.15, 0);
        ctx.fill();
        ctx.restore();
      }
    }

    // centro con semillas (espiral de Fibonacci)
    const cr = this.size * 0.36 * bl;
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, cr);
    cg.addColorStop(0, "#5a3311");
    cg.addColorStop(1, "#2d1808");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, 0, cr, 0, 6.283);
    ctx.fill();
    ctx.fillStyle = "#a0692a";
    for (let i = 1; i < 55; i++) {
      const r = Math.sqrt(i / 55) * cr * 0.92;
      const a = i * 2.39996;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r, Math.max(0.6, cr * 0.05), 0, 6.283);
      ctx.fill();
    }
    ctx.restore();

    // suelta pétalos de vez en cuando
    if (bl >= 1 && t > this.dropAt) {
      this.dropAt = t + rand(2500, 7000);
      if (petals.length < 60) {
        petals.push({ x: tip.x, y: tip.y, vx: rand(-.6, .6), vy: rand(.5, 1.2), rot: rand(0, 6.28), vr: rand(-.05, .05), s: rand(8, 14), ph: rand(0, 6.28) });
      }
    }
  }
}

function plant(x, delay) {
  flowers.push(new Flower(x, delay));
  if (flowers.length > 45) flowers.shift();
}

function init() {
  flowers.length = 0;
  petals.length = 0;
  const count = Math.max(6, Math.floor(W / 95));
  for (let i = 0; i < count; i++) {
    plant((i + 0.5) * (W / count) + rand(-25, 25), i * 350 + rand(0, 300));
  }
  spawnFlies();
}

/* ---------- Bucle ---------- */
function frame(t) {
  drawBackground(t);
  drawFlies(t);
  // las más altas primero para dar profundidad
  [...flowers].sort((a, b) => a.h - b.h).reverse().forEach(f => f.draw(t));
  drawPetals();
  requestAnimationFrame(frame);
}

canvas.addEventListener("pointerdown", e => plant(e.clientX, 0));
window.addEventListener("resize", () => { resize(); init(); });

resize();
init();
requestAnimationFrame(frame);
