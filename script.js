const canvas = document.querySelector("#fieldCanvas");
const ctx = canvas.getContext("2d", { alpha: true });
const header = document.querySelector("[data-elevate]");
const introHero = document.querySelector(".identity-hero");
const carousels = document.querySelectorAll("[data-carousel]");
const supportsCustomCursor = window.matchMedia("(pointer: fine)").matches;

let width = 0;
let height = 0;
let points = [];
let frame = 0;
let cursorX = 0;
let cursorY = 0;
let lastCursorMove = 0;
let cursorPixels = [];

function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = Math.max(42, Math.floor((width * height) / 23000));
  points = Array.from({ length: count }, (_, index) => ({
    x: (index * 131) % width,
    y: (index * 79) % height,
    phase: index * 0.47,
    speed: 0.25 + (index % 7) * 0.035,
  }));
}

function draw() {
  frame += 0.012;
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 1;

  points.forEach((point, index) => {
    const driftX = Math.sin(frame * point.speed + point.phase) * 34;
    const driftY = Math.cos(frame * 0.8 + point.phase) * 24;
    const x = (point.x + driftX + frame * 18) % width;
    const y = (point.y + driftY + frame * 9) % height;

    ctx.beginPath();
    ctx.arc(x, y, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = index % 3 === 0 ? "rgba(12, 107, 103, 0.28)" : "rgba(37, 79, 154, 0.16)";
    ctx.fill();

    if (index % 2 === 0) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(
        x + 60,
        y + Math.sin(frame + index) * 40,
        x + 140,
        y + Math.cos(frame + index) * 30,
        x + 210,
        y + Math.sin(frame * 1.4 + index) * 18,
      );
      ctx.strokeStyle = "rgba(21, 19, 17, 0.045)";
      ctx.stroke();
    }
  });

  requestAnimationFrame(draw);
}

function setHeaderState() {
  header.classList.toggle("is-elevated", window.scrollY > 12);
}

function setIntroBlur() {
  if (!introHero) return;

  const maxScroll = Math.max(introHero.offsetHeight * 0.82, 1);
  const progress = Math.min(window.scrollY / maxScroll, 1);
  const blur = progress * 12;

  introHero.style.setProperty("--intro-blur", `${blur.toFixed(1)}px`);
}

function setupCustomCursor() {
  if (!supportsCustomCursor) return;

  cursorX = window.innerWidth / 2;
  cursorY = window.innerHeight / 2;
  lastCursorMove = performance.now();
  document.body.classList.add("has-custom-cursor");

  cursorPixels = Array.from({ length: 11 }, (_, index) => {
    const pixel = document.createElement("span");
    pixel.className = "cursor-pixel";
    pixel.dataset.index = index;
    document.body.append(pixel);
    return {
      el: pixel,
      x: cursorX,
      y: cursorY,
      angle: (Math.PI * 2 * index) / 11,
      radius: 8 + (index % 4) * 5,
      speed: 0.018 + index * 0.0025,
    };
  });

  window.addEventListener(
    "mousemove",
    (event) => {
      cursorX = event.clientX;
      cursorY = event.clientY;
      lastCursorMove = performance.now();
    },
    { passive: true },
  );

  document.addEventListener(
    "mouseover",
    (event) => {
      document.body.classList.toggle("cursor-is-active", Boolean(event.target.closest("a, button, input, textarea, select, iframe")));
    },
    { passive: true },
  );

  window.addEventListener("mousedown", (event) => {
    const pulse = document.createElement("span");
    pulse.className = "cursor-click";
    pulse.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
    document.body.append(pulse);
    pulse.addEventListener("animationend", () => pulse.remove(), { once: true });
  });
}

function drawCustomCursor() {
  if (!cursorPixels.length) return;

  const idle = performance.now() - lastCursorMove > 180;

  cursorPixels.forEach((pixel, index) => {
    let targetX = cursorX;
    let targetY = cursorY;

    if (idle) {
      const offsets = [
        [-18, -10],
        [-8, -18],
        [6, -12],
        [18, -4],
        [-15, 6],
        [-3, 1],
        [11, 8],
        [22, 14],
        [-7, 18],
        [7, 22],
        [18, -18],
      ];
      const [offsetX, offsetY] = offsets[index % offsets.length];
      const drift = Math.sin(performance.now() * 0.002 + index * 1.7) * 2.4;
      targetX += offsetX + drift;
      targetY += offsetY + Math.cos(performance.now() * 0.0018 + index) * 2.4;
    } else {
      const trail = (index + 1) * 2.2;
      targetX -= Math.cos(pixel.angle) * trail;
      targetY -= Math.sin(pixel.angle) * trail;
      pixel.angle += 0.012;
    }

    const ease = idle ? 0.085 : 0.18;
    pixel.x += (targetX - pixel.x) * ease;
    pixel.y += (targetY - pixel.y) * ease;
    pixel.el.style.opacity = idle ? 0.9 : Math.max(0.25, 1 - index * 0.065);
    pixel.el.style.transform = `translate(${pixel.x}px, ${pixel.y}px) translate(-50%, -50%)`;
  });

  requestAnimationFrame(drawCustomCursor);
}

window.addEventListener("resize", resize);
window.addEventListener(
  "scroll",
  () => {
    setHeaderState();
    setIntroBlur();
  },
  { passive: true },
);

carousels.forEach((carousel, carouselIndex) => {
  const slides = Array.from(carousel.querySelectorAll("img"));
  if (!slides.length) return;

  let activeIndex = 0;
  slides[activeIndex].classList.add("is-active");

  if (slides.length < 2) return;

  const advanceSlide = () => {
    slides[activeIndex].classList.remove("is-active");
    activeIndex = (activeIndex + 1) % slides.length;
    slides[activeIndex].classList.add("is-active");
  };

  window.setTimeout(() => {
    advanceSlide();
    window.setInterval(advanceSlide, 5200);
  }, carouselIndex * 950);
});

resize();
setHeaderState();
setIntroBlur();
setupCustomCursor();
drawCustomCursor();
draw();
