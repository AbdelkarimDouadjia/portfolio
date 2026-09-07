/**
 * Dotted footer force field with live text targets for current footer labels.
 */
(function () {
  "use strict";

  var ORIGINAL_ANCHORING_STRENGTH = 0.05;
  var ORIGINAL_NEIGHBOR_REPULSION_STRENGTH = 6;
  var ORIGINAL_NEIGHBOR_REPULSION_DISTANCE_F = 10;
  var ORIGINAL_CURSOR_STRENGTH = -20;

  var root = document.getElementById("mats-appendix");
  if (!root) return;

  var canvas = root.querySelector(".mats-dot-canvas");
  var container = root.querySelector(".mats-pixi-wrap");
  if (!canvas || !container || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  var vw = 1,
    vh = 1;
  var scale = 1;
  var offsetX = 0;
  var imgW = 1,
    imgH = 1;
  var pixels = null;

  var particles = [];
  var gridCols = 1,
    gridRows = 1;
  var spatial = [];

  var mouseX = -99999,
    mouseY = -99999;
  var mouseOverCanvas = false;
  var paused = false;
  var pauseTimer = null;
  var raf = 0;
  var running = false;
  var activeNav = "none";
  var activeLabel = "";
  var leaveTimer = null;

  var settings = {
    dotRadius: 2,
    spacing: 12,
    cursorStrength: 0,
    anchoringStrength: ORIGINAL_ANCHORING_STRENGTH,
    maskForceMultiplier: 8,
    neighborRepulsionStrength: ORIGINAL_NEIGHBOR_REPULSION_STRENGTH,
    neighborRepulsionDistance: ORIGINAL_NEIGHBOR_REPULSION_DISTANCE_F,
  };

  var forceBase = "assets/img/mats-force/";
  var FORCE_MAPS = {
    instagram: "force_map_instagram.webp",
    linkedin: "force_map_linkedin.webp",
    x: "force_map_x.webp",
    email: "force_map_email.webp",
    mats: "force_map_mats.webp",
    web: "force_map_web.webp",
    products: "force_map_products.webp",
    writings: "force_map_writings.webp",
  };

  function loadPixels(url, cb) {
    var im = new Image();
    im.onload = function () {
      var oc = document.createElement("canvas");
      oc.width = im.naturalWidth;
      oc.height = im.naturalHeight;
      var ox = oc.getContext("2d");
      ox.drawImage(im, 0, 0);
      imgW = oc.width;
      imgH = oc.height;
      pixels = ox.getImageData(0, 0, imgW, imgH).data;
      updateScale();
      if (cb) cb();
    };
    im.onerror = function () {
      pixels = null;
      if (cb) cb();
    };
    im.src = url;
  }

  function updateScale() {
    scale = 1246 / Math.max(vw, 320) - 0.02;
    if (pixels && imgW > 0) offsetX = (vw - imgW / scale) / 2;
    else offsetX = 0;
  }

  function sampleForce(qx, qy) {
    if (!pixels) return { fx: 0, fy: 0, force: 0 };
    var q = qx - offsetX;
    var Z = qy - 60;
    q = Math.round(q * scale);
    Z = Math.round(Z * scale);
    if (q < 0 || Z < 0 || q >= imgW || Z >= imgH) {
      return { fx: 0, fy: Math.sign(-Z) || 0, force: 2 };
    }
    var i = (Z * imgW + q) * 4;
    var R = pixels[i];
    var Gch = pixels[i + 1];
    var Bch = pixels[i + 2];
    var fx = (R - 128) / 128;
    var fy = (Gch - 128) / 128;
    var fo = (Bch / 256) * -settings.maskForceMultiplier;
    return { fx: fx, fy: fy, force: fo };
  }

  function shuffle(points) {
    for (var i = points.length - 1; i > 0; i--) {
      var j = Math.floor(((i * 9301 + 49297) % 233280) / 233280 * (i + 1));
      var tmp = points[i];
      points[i] = points[j];
      points[j] = tmp;
    }
    return points;
  }

  function buildTextTargets(label) {
    if (!particles.length || !label) return;

    var text = String(label).replace(/\s+/g, " ").trim().toUpperCase();
    var oc = document.createElement("canvas");
    var ow = Math.max(320, Math.floor(vw));
    var oh = Math.max(180, Math.floor(vh * 0.62));
    oc.width = ow;
    oc.height = oh;

    var ox = oc.getContext("2d");
    var size = Math.min(118, Math.max(34, ow / Math.max(4.5, text.length * 0.58), oh * 0.36));
    ox.clearRect(0, 0, ow, oh);
    ox.fillStyle = "#fff";
    ox.textAlign = "center";
    ox.textBaseline = "middle";
    ox.font = "900 " + size + "px Arial Black, Impact, sans-serif";

    var y = Math.min(oh * 0.55, Math.max(size * 0.9, oh * 0.46));
    ox.fillText(text, ow / 2, y, ow * 0.9);

    var data = ox.getImageData(0, 0, ow, oh).data;
    var points = [];
    var step = Math.max(5, Math.round(settings.spacing * 0.62));
    for (var py = step; py < oh; py += step) {
      for (var px = step; px < ow; px += step) {
        if (data[(py * ow + px) * 4 + 3] > 24) {
          points.push({ x: px, y: py + Math.max(12, vh * 0.08) });
        }
      }
    }

    if (!points.length) return;
    points = shuffle(points);
    for (var p = 0; p < particles.length; p++) {
      var target = points[p % points.length];
      particles[p].targetX = target.x + ((p % 5) - 2) * 0.8;
      particles[p].targetY = target.y + (((p + 2) % 5) - 2) * 0.8;
    }
  }

  function clearTextTargets() {
    for (var p = 0; p < particles.length; p++) {
      particles[p].targetX = null;
      particles[p].targetY = null;
    }
  }

  function allocSpatial() {
    var D = settings.neighborRepulsionDistance;
    gridCols = Math.ceil(vw / D);
    gridRows = Math.ceil(vh / D);
    spatial = [];
    for (var gx = 0; gx < gridCols; gx++) {
      spatial[gx] = [];
      for (var gy = 0; gy < gridRows; gy++) spatial[gx][gy] = [];
    }
  }

  function buildParticles() {
    particles = [];
    var sp = settings.spacing;
    var S = vh * 0.1;
    for (var q = sp; q < vw; q += sp) {
      for (var Z = sp; Z < vh * 0.6; Z += sp) {
        particles.push({
          x: q,
          y: Z + S,
          vx: 0,
          vy: 0,
          originalX: q,
          originalY: Z + S,
          gridX: 0,
          gridY: 0,
          alpha: 0.85,
        });
      }
    }
  }

  function resize() {
    var rect = container.getBoundingClientRect();
    vw = Math.max(1, Math.floor(rect.width));
    vh = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(vw * dpr);
    canvas.height = Math.floor(vh * dpr);
    canvas.style.width = vw + "px";
    canvas.style.height = vh + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    updateScale();
    if (activeNav !== "none" && activeLabel) buildTextTargets(activeLabel);
  }

  function reduceNeighborStrength(x) {
    if (x < 1e-6) return;
    function step() {
      if (activeNav === "none") return;
      if (settings.neighborRepulsionStrength < 0.005) {
        settings.neighborRepulsionStrength = 0.005;
        return;
      }
      settings.neighborRepulsionStrength -= x;
      if (settings.neighborRepulsionStrength > x * 2) {
        requestAnimationFrame(step);
      } else {
        reduceNeighborStrength(x / 50);
      }
    }
    requestAnimationFrame(step);
  }

  function reduceAnchoringStrength(x) {
    if (x < 1e-6) return;
    function step() {
      if (activeNav === "none") return;
      settings.anchoringStrength -= x;
      if (settings.anchoringStrength > x * 2) {
        requestAnimationFrame(step);
      } else {
        settings.anchoringStrength = 0;
      }
    }
    requestAnimationFrame(step);
  }

  function setActiveForce(key) {
    var file = FORCE_MAPS[key];
    if (!file) file = FORCE_MAPS.mats;
    loadPixels(forceBase + file, function () {});
  }

  function onHoverKey(key, label) {
    if (!key || key === "none") {
      activeNav = "none";
      activeLabel = "";
      clearTextTargets();
      settings.anchoringStrength = ORIGINAL_ANCHORING_STRENGTH;
      settings.neighborRepulsionStrength = ORIGINAL_NEIGHBOR_REPULSION_STRENGTH;
      settings.cursorStrength = mouseOverCanvas ? ORIGINAL_CURSOR_STRENGTH : 0;
      loadPixels(forceBase + FORCE_MAPS.mats, function () {});
      return;
    }
    activeNav = key;
    activeLabel = label || key;
    buildTextTargets(activeLabel);
    settings.anchoringStrength = ORIGINAL_ANCHORING_STRENGTH;
    settings.cursorStrength = 0;
    settings.neighborRepulsionStrength = 10;
    reduceAnchoringStrength(0.01);
    reduceNeighborStrength(0.25);
    setActiveForce(key);
  }

  function bindTriggers() {
    var nodes = root.querySelectorAll("[data-mats-force]");
    function clearL() {
      if (leaveTimer) {
        clearTimeout(leaveTimer);
        leaveTimer = null;
      }
    }
    function getLabel(node) {
      var label = node.getAttribute("data-mats-label");
      var labelNode = node.querySelector(".mats-row-label");
      var navNode = node.querySelector("div");
      if (!label && labelNode) label = labelNode.textContent;
      if (!label && navNode) label = navNode.textContent;
      if (!label) label = node.textContent;
      return (label || "").replace(/\s+/g, " ").trim();
    }
    function enter() {
      clearL();
      var k = this.getAttribute("data-mats-force");
      if (k) onHoverKey(k, getLabel(this));
    }
    function leave() {
      clearL();
      leaveTimer = setTimeout(function () {
        onHoverKey("none");
        leaveTimer = null;
      }, 50);
    }
    function blurEv(e) {
      var rel = e.relatedTarget;
      if (rel && root.contains(rel) && rel.getAttribute("data-mats-force"))
        return;
      leave();
    }
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].addEventListener("mouseenter", enter);
      nodes[i].addEventListener("mouseleave", leave);
      nodes[i].addEventListener("focus", enter);
      nodes[i].addEventListener("blur", blurEv);
      nodes[i].addEventListener(
        "touchstart",
        function () {
          clearL();
          var k = this.getAttribute("data-mats-force");
          if (k) onHoverKey(k, getLabel(this));
        },
        { passive: true }
      );
      nodes[i].addEventListener(
        "touchend",
        function () {
          clearL();
          leaveTimer = setTimeout(function () {
            onHoverKey("none");
            leaveTimer = null;
          }, 450);
        },
        { passive: true }
      );
    }
  }

  function tick() {
    if (!running) return;
    if (paused || !particles.length) {
      raf = requestAnimationFrame(tick);
      return;
    }

    var D = settings.neighborRepulsionDistance;
    var Za = settings.anchoringStrength;
    var nStr = settings.neighborRepulsionStrength;
    var Cdist = settings.neighborRepulsionDistance;
    var Xcs = settings.cursorStrength;
    var P = gridCols;
    var I = gridRows;

    var gx, gy, j, B, ie, ne, de, be, fe, ye, me, De, Qe;
    var Le, Ce, pe, xe, mi, Di, mIdx, dr, lt, ht, ds, spd;

    for (gx = 0; gx < P; gx++) {
      for (gy = 0; gy < I; gy++) {
        spatial[gx][gy].length = 0;
      }
    }

    for (j = 0; j < particles.length; j++) {
      B = particles[j];
      B.gridX = Math.floor(B.x / D);
      B.gridY = Math.floor(B.y / D);
      if (B.gridX >= 0 && B.gridX < P && B.gridY >= 0 && B.gridY < I) {
        spatial[B.gridX][B.gridY].push(B);
      }
    }

    for (j = 0; j < particles.length; j++) {
      B = particles[j];
      ie = mouseX - B.x;
      ne = mouseY - B.y;
      de = Za * (B.originalX - B.x);
      be = Za * (B.originalY - B.y);
      fe = 0;
      ye = 0;

      if (activeNav !== "none") {
        if (B.targetX != null && B.targetY != null) {
          fe += (B.targetX - B.x) * 0.018;
          ye += (B.targetY - B.y) * 0.018;
        } else {
          Qe = sampleForce(Math.round(B.x), Math.round(B.y));
          fe += Qe.fx * Qe.force;
          ye += Qe.fy * Qe.force;
        }
      } else {
        me = Math.pow(ie * ie + ne * ne, 0.8);
        if (me < 1e-6) me = 1e-6;
        De = Xcs / me;
        fe += De * ie;
        ye += De * ne;
      }

      Le = Math.max(B.gridX - 1, 0);
      Ce = Math.min(B.gridX + 1, P - 1);
      pe = Math.max(B.gridY - 1, 0);
      xe = Math.min(B.gridY + 1, I - 1);
      for (mi = Le; mi <= Ce; mi++) {
        for (Di = pe; Di <= xe; Di++) {
          var cell = spatial[mi][Di];
          for (mIdx = 0; mIdx < cell.length; mIdx++) {
            Qe = cell[mIdx];
            if (Qe !== B) {
              dr = Qe.x - B.x;
              lt = Qe.y - B.y;
              ht = Math.sqrt(dr * dr + lt * lt);
              if (ht < Cdist) {
                ds = nStr / (ht * ht + 1e-4);
                fe -= ds * dr;
                ye -= ds * lt;
              }
            }
          }
        }
      }

      B.vx += de + fe;
      B.vy += be + ye;
      B.x += Math.min(Math.max(B.vx, -16), 16);
      B.y += Math.min(Math.max(B.vy, -16), 16);
      B.vx *= 0.75;
      B.vy *= 0.75;
      spd = Math.sqrt(B.vx * B.vx + B.vy * B.vy);
      B.alpha = Math.max(0.1, Math.min(1, 0.8 + spd / 48));
    }

    ctx.clearRect(0, 0, vw, vh);
    var r0 = settings.dotRadius;
    var buckets = {};
    for (j = 0; j < particles.length; j++) {
      B = particles[j];
      var key = Math.round(B.alpha * 20);
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(B);
    }
    for (var k in buckets) {
      ctx.globalAlpha = k / 20;
      ctx.fillStyle = "#ebebeb";
      ctx.beginPath();
      var arr = buckets[k];
      for (j = 0; j < arr.length; j++) {
        ctx.moveTo(arr[j].x + r0, arr[j].y);
        ctx.arc(arr[j].x, arr[j].y, r0, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    raf = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(tick);
  }

  function stopLoop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function syncMouse(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    mouseX = clientX - rect.left;
    mouseY = clientY - rect.top;
  }

  function init() {
    resize();
    allocSpatial();
    buildParticles();
    if (activeNav !== "none" && activeLabel) buildTextTargets(activeLabel);
    loadPixels(forceBase + FORCE_MAPS.mats, function () {});
  }

  function onResize() {
    stopLoop();
    init();
    var r2 = root.getBoundingClientRect();
    if (r2.bottom > 0 && r2.top < window.innerHeight) startLoop();
  }

  window.addEventListener("mousemove", function (e) {
    if (mouseOverCanvas) syncMouse(e.clientX, e.clientY);
  });

  container.addEventListener("mouseenter", function () {
    mouseOverCanvas = true;
    settings.cursorStrength = ORIGINAL_CURSOR_STRENGTH;
  });
  container.addEventListener("mousemove", function (e) {
    mouseOverCanvas = true;
    syncMouse(e.clientX, e.clientY);
  });
  container.addEventListener("mouseleave", function () {
    mouseOverCanvas = false;
    settings.cursorStrength = 0;
    mouseX = -99999;
    mouseY = -99999;
  });

  document.addEventListener("mousedown", function () {
    settings.anchoringStrength = 0.05;
    if (settings.cursorStrength < 0) settings.cursorStrength = 20;
  });
  document.addEventListener("mouseup", function () {
    settings.anchoringStrength = ORIGINAL_ANCHORING_STRENGTH;
    settings.neighborRepulsionStrength = ORIGINAL_NEIGHBOR_REPULSION_STRENGTH;
    if (settings.cursorStrength > 0)
      settings.cursorStrength = ORIGINAL_CURSOR_STRENGTH;
  });

  canvas.addEventListener(
    "touchmove",
    function (e) {
      if (e.touches.length) {
        mouseOverCanvas = true;
        syncMouse(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    { passive: true }
  );

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          if (pauseTimer) {
            clearTimeout(pauseTimer);
            pauseTimer = null;
          }
          paused = false;
          startLoop();
        } else {
          pauseTimer = setTimeout(function () {
            paused = true;
            pauseTimer = null;
          }, 2000);
        }
      });
    },
    { root: null, rootMargin: "80px", threshold: 0 }
  );

  bindTriggers();
  init();
  window.addEventListener("resize", onResize);
  io.observe(container);
  if (root.getBoundingClientRect().top < window.innerHeight + 120) startLoop();
})();
