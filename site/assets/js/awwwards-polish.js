const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
const body = document.body;

root.classList.add("aw-motion");

const progress = document.createElement("div");
progress.className = "aw-scroll-progress";
progress.setAttribute("aria-hidden", "true");
body.prepend(progress);

const sectionIndex = document.createElement("div");
sectionIndex.className = "aw-section-index";
sectionIndex.setAttribute("aria-hidden", "true");
sectionIndex.innerHTML = "<strong>01</strong><span>intro</span>";
body.append(sectionIndex);

let gsap = null;
if (!reduceMotion) {
  try {
    const module = await import("../../node_modules/gsap/index.js");
    gsap = module.default || module.gsap || null;
  } catch (error) {
    root.classList.add("aw-motion-fallback");
  }
}

const revealItems = Array.from(document.querySelectorAll("[data-aw-reveal]"));
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function revealElement(element) {
  if (element.classList.contains("is-visible")) return;
  element.classList.add("is-visible");

  if (!gsap || reduceMotion) return;
  const children = element.matches(".practice-entry")
    ? element.querySelectorAll(".practice-entry__meta, h3, p, .practice-entry__stack")
    : [];

  if (children.length) {
    gsap.from(children, {
      y: 14,
      opacity: 0,
      duration: 0.62,
      stagger: 0.055,
      ease: "power3.out",
      clearProps: "transform,opacity"
    });
  }
}

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach(revealElement);
} else {
  const revealObserver = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      revealElement(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });

  revealItems.forEach(function (element) {
    revealObserver.observe(element);
  });
}

const signalSequence = document.querySelector("[data-signal-sequence]");
const signalFrames = signalSequence
  ? Array.from(signalSequence.querySelectorAll("[data-signal-frame]"))
  : [];
const signalCount = signalSequence?.querySelector("[data-signal-count]");
let activeSignalFrame = -1;

const phaseShift = document.querySelector("[data-phase-shift]");
const phaseWords = phaseShift
  ? Array.from(phaseShift.querySelectorAll("[data-phase-word]"))
  : [];
const phaseCount = phaseShift?.querySelector("[data-phase-count]");
const phaseGlyphCanvas = phaseShift?.querySelector("[data-phase-glyphs]");
let activePhaseWord = -1;
let currentPhaseProgress = 0;

function setSignalFrame(index) {
  if (index === activeSignalFrame || !signalFrames.length) return;
  activeSignalFrame = index;

  signalFrames.forEach(function (frame, frameIndex) {
    const isActive = frameIndex === index;
    frame.classList.toggle("is-active", isActive);
    frame.setAttribute("aria-hidden", String(!isActive));
  });

  if (signalCount) signalCount.textContent = String(index + 1).padStart(2, "0") + " / 03";
  if (!gsap || reduceMotion) return;

  const activeFrame = signalFrames[index];
  gsap.fromTo(
    activeFrame.querySelectorAll(".signal-frame__eyebrow, h2, .signal-frame__copy > p, .signal-frame__copy > a, .signal-frame__media"),
    { y: 18, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.58, stagger: 0.045, ease: "power3.out", overwrite: true }
  );
}

function setPhaseWord(index) {
  if (index === activePhaseWord || !phaseWords.length) return;
  activePhaseWord = index;
  phaseWords.forEach(function (word, wordIndex) {
    word.classList.toggle("is-active", wordIndex === index);
  });
  if (phaseCount) phaseCount.textContent = String(index + 1).padStart(2, "0") + " / 03";
}

function sectionProgress(element) {
  const rect = element.getBoundingClientRect();
  const travel = Math.max(1, rect.height - window.innerHeight);
  return clamp(-rect.top / travel);
}

function updateCinematicState() {
  if (signalSequence && !reduceMotion) {
    const signalProgress = sectionProgress(signalSequence);
    const signalTravel = Math.max(1, signalSequence.offsetHeight - window.innerHeight);
    signalSequence.style.setProperty("--signal-sequence-progress", signalProgress.toFixed(4));
    signalSequence.style.setProperty("--signal-sticky-offset", (signalProgress * signalTravel).toFixed(1) + "px");
    setSignalFrame(Math.min(signalFrames.length - 1, Math.floor(signalProgress * signalFrames.length)));
  }

  if (phaseShift && !reduceMotion) {
    const phaseProgress = sectionProgress(phaseShift);
    currentPhaseProgress = phaseProgress;
    const phaseTravel = Math.max(1, phaseShift.offsetHeight - window.innerHeight);
    const phaseRect = phaseShift.getBoundingClientRect();
    phaseShift.style.setProperty("--phase-sticky-offset", (phaseProgress * phaseTravel).toFixed(1) + "px");
    phaseShift.style.setProperty("--phase-orange", clamp(phaseProgress / 0.34).toFixed(4));
    phaseShift.style.setProperty("--phase-teal", clamp((phaseProgress - 0.33) / 0.34).toFixed(4));
    phaseShift.style.setProperty("--phase-black", clamp((phaseProgress - 0.66) / 0.34).toFixed(4));
    body.classList.toggle("phase-shift-light", phaseRect.top <= 64 && phaseRect.bottom > 64 && phaseProgress < 0.34);
    setPhaseWord(Math.min(phaseWords.length - 1, Math.floor(phaseProgress * phaseWords.length)));
  }
}

if (reduceMotion) {
  signalFrames.forEach(function (frame) {
    frame.classList.add("is-active");
    frame.setAttribute("aria-hidden", "false");
  });
  phaseWords.forEach(function (word) { word.classList.add("is-active"); });
} else {
  setSignalFrame(0);
  setPhaseWord(0);
}

const stackNetworkDrawers = [];
let cinematicFrameId = 0;

function createPhaseGlyphField(canvas) {
  const context = canvas?.getContext("2d");
  if (!context) return function () {};

  const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-*/<>[]{}";
  let width = 0;
  let height = 0;
  let points = [];

  return function drawPhaseGlyphs() {
    if (width !== canvas.clientWidth || height !== canvas.clientHeight) {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.textAlign = "center";
      context.textBaseline = "middle";
      points = Array.from({ length: width < 700 ? 46 : 82 }, function (_, index) {
        return {
          x: ((index * 73) % 997) / 997,
          y: ((index * 137) % 991) / 991,
          phase: index * 0.71,
          speed: 0.12 + (index % 5) * 0.025,
          size: 7 + (index % 4)
        };
      });
    }

    context.clearRect(0, 0, width, height);
    const intensity = clamp((currentPhaseProgress - 0.62) / 0.26);
    if (intensity <= 0) return;

    const time = performance.now() * 0.001;
    points.forEach(function (point, index) {
      const pulse = 0.32 + (Math.sin(time * 2.1 + point.phase) + 1) * 0.34;
      const x = (point.x * width + time * point.speed * 18) % width;
      const y = point.y * height + Math.sin(time + point.phase) * 5;
      const glyphIndex = (index + Math.floor(time * point.speed * 9)) % glyphs.length;
      context.font = "700 " + point.size + "px 'Courier New', monospace";
      context.fillStyle = "rgba(255,255,255," + (intensity * pulse * 0.62).toFixed(3) + ")";
      context.fillText(glyphs[glyphIndex], x, y);
      if (index % 17 === 0) {
        context.fillRect(x + 8, y - 1, 18 + (index % 4) * 7, 1);
      }
    });
  };
}

const drawPhaseGlyphs = !reduceMotion && phaseGlyphCanvas
  ? createPhaseGlyphField(phaseGlyphCanvas)
  : function () {};

function runCinematicFrame() {
  updateCinematicState();
  drawPhaseGlyphs();
  stackNetworkDrawers.forEach(function (drawNetwork) { drawNetwork(); });
  cinematicFrameId = window.requestAnimationFrame(runCinematicFrame);
}

if (!reduceMotion && (signalSequence || phaseShift)) {
  cinematicFrameId = window.requestAnimationFrame(runCinematicFrame);
  window.addEventListener("pagehide", function () {
    window.cancelAnimationFrame(cinematicFrameId);
  }, { once: true });
}

function createStackNetwork(field, tokens, canvas) {
  const context = canvas.getContext("2d");
  if (!context) return function () {};

  const links = [[0, 1], [0, 2], [0, 3], [0, 4], [4, 5], [5, 6], [6, 7], [6, 8], [8, 9], [9, 10]];
  let width = 0;
  let height = 0;
  let ratio = 1;
  let stars = [];

  return function drawNetwork() {
    const rect = field.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;

    if (width !== field.clientWidth || height !== field.clientHeight) {
      width = field.clientWidth;
      height = field.clientHeight;
      ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      stars = Array.from({ length: width < 700 ? 38 : 68 }, function (_, index) {
        return {
          x: ((index * 83) % 977) / 977 * width,
          y: ((index * 149) % 983) / 983 * height,
          phase: index * 0.63
        };
      });
    }

    context.clearRect(0, 0, width, height);
    const time = performance.now() * 0.00018;

    stars.forEach(function (star) {
      const alpha = 0.08 + (Math.sin(time * 12 + star.phase) + 1) * 0.08;
      context.fillStyle = "rgba(255,255,255," + alpha.toFixed(3) + ")";
      context.fillRect(star.x, star.y, 1.5, 1.5);
    });

    const nodes = tokens.map(function (token) {
      return {
        x: token.offsetLeft + (parseFloat(token.style.getPropertyValue("--drag-x")) || 0),
        y: token.offsetTop + (parseFloat(token.style.getPropertyValue("--drag-y")) || 0)
      };
    });
    const hubX = width / 2;
    const hubY = height / 2;

    [0, 2, 4, 6, 8, 10].forEach(function (nodeIndex, spokeIndex) {
      const node = nodes[nodeIndex];
      if (!node) return;
      context.beginPath();
      context.moveTo(hubX, hubY);
      context.lineTo(node.x, node.y);
      context.strokeStyle = spokeIndex % 2
        ? "rgba(74,213,217,0.12)"
        : "rgba(255,90,31,0.12)";
      context.lineWidth = 1;
      context.stroke();

      const spokeProgress = (time * 1.45 + spokeIndex * 0.19) % 1;
      context.fillStyle = spokeIndex % 2 ? "#4ad5d9" : "#ff5a1f";
      context.fillRect(
        hubX + (node.x - hubX) * spokeProgress - 1.5,
        hubY + (node.y - hubY) * spokeProgress - 1.5,
        3,
        3
      );
    });

    links.forEach(function (link, index) {
      const start = nodes[link[0]];
      const end = nodes[link[1]];
      const accent = index % 2 === 0 ? "255,90,31" : "74,213,217";
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.strokeStyle = "rgba(" + accent + ",0.22)";
      context.lineWidth = 1;
      context.stroke();

      const progress = (time + index * 0.137) % 1;
      const x = start.x + (end.x - start.x) * progress;
      const y = start.y + (end.y - start.y) * progress;
      context.fillStyle = "rgba(" + accent + ",0.9)";
      context.fillRect(x - 2, y - 2, 4, 4);
    });
  };
}

document.querySelectorAll("[data-stack-field]").forEach(function (field) {
  const tokens = Array.from(field.querySelectorAll("[data-stack-token]"));
  const network = field.querySelector("[data-stack-network]");
  if (network && !reduceMotion) stackNetworkDrawers.push(createStackNetwork(field, tokens, network));

  tokens.forEach(function (token) {
    const position = { x: 0, y: 0 };
    let drag = null;

    function moveTo(x, y) {
      const halfWidth = token.offsetWidth / 2;
      const halfHeight = token.offsetHeight / 2;
      const baseX = token.offsetLeft;
      const baseY = token.offsetTop;
      position.x = clamp(x, halfWidth - baseX, field.clientWidth - halfWidth - baseX);
      position.y = clamp(y, halfHeight - baseY, field.clientHeight - halfHeight - baseY);
      token.style.setProperty("--drag-x", position.x.toFixed(1) + "px");
      token.style.setProperty("--drag-y", position.y.toFixed(1) + "px");
    }

    token.addEventListener("pointerdown", function (event) {
      if (event.button !== 0) return;
      event.preventDefault();
      drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, startX: position.x, startY: position.y };
      token.setPointerCapture(event.pointerId);
      token.classList.add("is-dragging");
    });

    token.addEventListener("pointermove", function (event) {
      if (!drag || drag.pointerId !== event.pointerId) return;
      moveTo(drag.startX + event.clientX - drag.x, drag.startY + event.clientY - drag.y);
    });

    function release(event) {
      if (!drag || drag.pointerId !== event.pointerId) return;
      drag = null;
      token.classList.remove("is-dragging");
    }

    token.addEventListener("pointerup", release);
    token.addEventListener("pointercancel", release);
    token.addEventListener("keydown", function (event) {
      const distance = event.shiftKey ? 32 : 12;
      const offsets = {
        ArrowLeft: [-distance, 0],
        ArrowRight: [distance, 0],
        ArrowUp: [0, -distance],
        ArrowDown: [0, distance]
      };

      if (event.key === "Home") {
        event.preventDefault();
        moveTo(0, 0);
        return;
      }

      if (!offsets[event.key]) return;
      event.preventDefault();
      moveTo(position.x + offsets[event.key][0], position.y + offsets[event.key][1]);
    });
  });
});

const sectionCandidates = Array.from(document.querySelectorAll("[data-aw-section]"));
const footer = document.querySelector("#mats-appendix, .project-footer");
if (footer && !footer.hasAttribute("data-aw-section")) {
  footer.setAttribute("data-aw-section", "footer");
  sectionCandidates.push(footer);
}

function sectionName(element) {
  return element.getAttribute("data-aw-section") || element.id || "section";
}

let ticking = false;

function updateScrollState() {
  ticking = false;
  updateCinematicState();
  const documentHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const pageProgress = Math.min(1, Math.max(0, window.scrollY / documentHeight));
  progress.style.transform = "scaleX(" + pageProgress.toFixed(4) + ")";

  if (!sectionCandidates.length) return;

  const marker = window.innerHeight * 0.46;
  let currentIndex = 0;
  let bestDistance = Infinity;

  sectionCandidates.forEach(function (element, index) {
    const rect = element.getBoundingClientRect();
    const distance = rect.top <= marker && rect.bottom >= marker
      ? 0
      : Math.min(Math.abs(rect.top - marker), Math.abs(rect.bottom - marker));

    element.classList.toggle("is-current", rect.top <= marker && rect.bottom >= marker);
    if (distance < bestDistance) {
      bestDistance = distance;
      currentIndex = index;
    }
  });

  const current = sectionCandidates[currentIndex];
  const rect = current.getBoundingClientRect();
  const localProgress = Math.min(1, Math.max(0, (marker - rect.top) / Math.max(1, rect.height)));
  sectionIndex.querySelector("strong").textContent = String(currentIndex + 1).padStart(2, "0");
  sectionIndex.querySelector("span").textContent = sectionName(current);
  sectionIndex.style.setProperty("--section-progress", localProgress.toFixed(3));
}

function requestScrollUpdate() {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(updateScrollState);
}

window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate, { passive: true });
window.addEventListener("load", requestScrollUpdate, { once: true });
window.addEventListener("portfolio:projects-rendered", requestScrollUpdate);
updateScrollState();
