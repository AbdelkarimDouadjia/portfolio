    (function () {
      const canvas = document.getElementById("ascii-canvas");
      const hero = document.getElementById("hero");
      if (!canvas || !hero) {
        return;
      }
      const ctx = canvas.getContext("2d");
      const offscreen = document.createElement("canvas");
      const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
      if (!ctx || !offCtx) {
        return;
      }
      const BRAND_NAME = "abdelkarim";
      const headerLogo = document.querySelector("#header .site-logo");
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const ARTEFAKT_REFERENCE_WIDTH = 166;
      const ARTEFAKT_REFERENCE_HEIGHT = 24;
      const WORDMARK_FONT_FAMILY = '"Arial Black", Impact, "Trebuchet MS", Arial, sans-serif';
      const WORDMARK_FONT_WEIGHT = 900;
      const WORDMARK_SLANT = -0.16;
      const WORDMARK_BOX_PAD = 8;

      if (headerLogo) {
        headerLogo.setAttribute("aria-label", BRAND_NAME);
      }

      if (headerLogo && !headerLogo.querySelector("img") && !headerLogo.querySelector(".adcker-wordmark")) {
        headerLogo.textContent = BRAND_NAME;
      }

      function setWordmarkFont(targetCtx, size) {
        targetCtx.font =
          WORDMARK_FONT_WEIGHT +
          " " +
          Math.round(size) +
          "px " +
          WORDMARK_FONT_FAMILY;
        targetCtx.textAlign = "left";
        targetCtx.textBaseline = "alphabetic";
      }

      function measureWordmark(size) {
        setWordmarkFont(offCtx, size);
        const metrics = offCtx.measureText(BRAND_NAME);
        const ascent = metrics.actualBoundingBoxAscent || size * 0.74;
        const descent = metrics.actualBoundingBoxDescent || size * 0.22;
        const left = Math.max(0, metrics.actualBoundingBoxLeft || 0);
        const right = Math.max(metrics.width, metrics.actualBoundingBoxRight || metrics.width);
        const shifts = [WORDMARK_SLANT * -ascent, WORDMARK_SLANT * descent, 0];
        const minShift = Math.min.apply(null, shifts);
        const maxShift = Math.max.apply(null, shifts);

        return {
          width: left + right + maxShift - minShift + WORDMARK_BOX_PAD * 2,
          height: ascent + descent + WORDMARK_BOX_PAD * 2,
          textWidth: left + right,
          ascent: ascent,
          descent: descent,
          left: left,
          right: right,
          minShift: minShift,
          maxShift: maxShift,
          fontSize: size
        };
      }

      function drawWordmarkMask(targetCtx, x, y, size) {
        const metrics = measureWordmark(size);
        const baseline = y + WORDMARK_BOX_PAD + metrics.ascent;
        const textX = x + WORDMARK_BOX_PAD + metrics.left - metrics.minShift;

        setWordmarkFont(targetCtx, size);
        targetCtx.save();
        targetCtx.fillStyle = "#ffffff";
        targetCtx.translate(textX, baseline);
        targetCtx.transform(1, 0, WORDMARK_SLANT, 1, 0, 0);
        targetCtx.fillText(BRAND_NAME, 0, 0);
        targetCtx.restore();

        return metrics;
      }

      /**
       * Edge ignition / “CRT fire” hero tuning. Adjust calmness vs activity without hunting literals.
       * - gridDensity: 1 = default column count; values above 1 = denser micro-grid (smaller cells).
       * - calmness: 0 = more bursts, 1 = long quiet + fewer activations.
       * - edgeIgnitionStrength: scales how far characters peel off the contour during a burst.
       */
      const HERO_CRT = {
        gridDensity: 1.02,
        gridCharWMin: 5.8,
        /** Small screens use fewer columns (coarser) — same breakpoint as before. */
        gridColumnsNarrow: 118,
        gridColumnsWide: 208,
        /** Global motion budget: 0 = busy edge fire, 1 = very still. */
        calmness: 0.38,
        maxConcurrentBursts: 3,
        /** Per-frame try probability after cooldown (scaled by 1 - calmness). */
        baseBurstSpawn: 0.012,
        /** ms between *attempt* windows (actual spawns are still probabilistic). */
        burstCooldownMs: [400, 1600],
        /** Lifetime of one localized cluster (edge-spark that travels a few cells). */
        burstDurationMs: [360, 920],
        burstMinCells: 5,
        burstMaxCells: 20,
        /** How many grid steps the cluster can wander along / into the fill. */
        maxCrawlDepth: 4,
        /** How often a burst starts from a counter (inner cutout) vs outer contour. */
        innerContourWeight: 0.16,
        /** Peak nudge in cell units (multiplied by charW/H). */
        edgeIgnitionStrength: 0.36,
        /** Extra chaos along contour vs interior pulls. */
        crawlInwardWeight: 0.22,
        /** Fine positional jitter in px while a cell is “hot”. */
        microJitterPx: 0.42,
        /** Rare idle glyph twinkle when not in a burst (keep near zero for readability). */
        idleGlyphShuffle: 0.0011,
        /** Swaps + glitch glyphs scale with burst “heat” (0–1) per cell. */
        burstGlyphShuffle: 0.2,
        /** 0.06–0.2: how fast hover/ambient drift eases back to the static grid. */
        settleSpeed: 0.1,
        /** Subtle line shimmer (0–1) — whole-text phosphor, very low. */
        globalLuminanceFlicker: 0.055,
        /**
         * Micro-typography pools for the main logo fill. Edit to change the “terminal” look.
         * - dense: solid cores of each letter; - mid: mid-weight; - light: fringes; - hotGlitch: edge-burst swap chars.
         */
        glyphPools: {
          dense: "444444RRRRTTTTFFFF333333###@@%%88",
          mid: "444RRTTFF333##@@%8+=*",
          light: "4RTF3#@=+:.",
          hotGlitch: "!<>?/\\\\|+=-*#_:;"
        }
      };

      // Center word uses mostly symbols / noise (like artefakt.mov), not readable “normal” text.
      const SYMBOL_CHARS = ".:+=-*#@";
      const DENSE_CHARS = HERO_CRT.glyphPools.dense;
      const MID_DENSE_CHARS = HERO_CRT.glyphPools.mid;
      const LIGHT_DENSE_CHARS = HERO_CRT.glyphPools.light;
      const SPARSE_CHARS = ".:-=+*#";
      const SCRAMBLE_CHARS = "@#%FTR31i|=-+*K04[]{}\\\\/";
      const GLITCH_CHARS = HERO_CRT.glyphPools.hotGlitch;

      let width = 0;
      let height = 0;
      let charW = 0;
      let charH = 0;
      let fontSize = 0;
      let cols = 0;
      let rows = 0;
      let denseCells = [];
      let insideLookup = new Uint8Array(0);
      let denseIndexLookup = new Int32Array(0);
      let fringeLookup = new Float32Array(0);
      let sparseCells = [];
      let particles = [];
      let holes = [];
      /** Precomputed origin indices for localized edge/cavity ignition bursts. */
      let contourSeeds = [];
      let cavitySeeds = [];
      /** Short-lived { t0, duration, phase, members: [{ i, w, depth, inwardLeans }] } */
      let edgeBursts = [];
      let nextBurstAt = 0;
      /** Per-frame accumulated offsets for dense cells; avoids O(bursts×cells) full clears beyond fill(0). */
      let burstAccX = new Float32Array(0);
      let burstAccY = new Float32Array(0);
      /** 0–1 “heat” per dense cell: drives glyph swap + micro-flicker this frame. */
      let burstHeat = new Float32Array(0);
      let pointer = { x: -1, y: -1, inside: false, active: false };
      let animationFrame = 0;
      let heroVisible = true;
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          heroVisible = entries[0].isIntersecting;
        }).observe(hero);
      }
      let frameCount = 0;
      let resizeTimer = 0;
      let lastDamageFrame = -999;
      let logoDraw = { offsetX: 0, offsetY: 0, targetWidth: 0, targetHeight: 0 };
      let wordMaskPixels = null;
      let wordMaskWidth = 0;
      let wordMaskHeight = 0;
      let t0 = performance.now();

      function randomBetween(min, max) {
        return min + Math.random() * (max - min);
      }

      function randomInt(min, max) {
        return Math.floor(randomBetween(min, max));
      }

      function randomChar(pool) {
        return pool.charAt(Math.floor(Math.random() * pool.length));
      }

      function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
      }

      function lerp(a, b, t) {
        return a + (b - a) * t;
      }

      function pickDenseChar(strength) {
        if (strength > 0.78) {
          return Math.random() < 0.9
            ? randomChar(DENSE_CHARS)
            : randomChar("+=#@");
        }

        if (strength > 0.52) {
          return Math.random() < 0.84
            ? randomChar(MID_DENSE_CHARS)
            : randomChar(".:+=-");
        }

        return Math.random() < 0.76
          ? randomChar(LIGHT_DENSE_CHARS)
          : randomChar(".:-=+");
      }

      function pickOutsideCell(options) {
        options = options || {};
        const total = cols * rows;

        if (!total) {
          return { col: 0, row: 0, index: 0 };
        }

        const preferFringe = !!options.preferFringe;
        const avoidFringe = !!options.avoidFringe;
        const tries = options.tries || 84;
        let best = null;
        let bestScore = -Infinity;

        for (let attempt = 0; attempt < tries; attempt += 1) {
          const index = randomInt(0, total);

          if (insideLookup[index]) continue;

          const col = index % cols;
          const row = Math.floor(index / cols);
          const fringe = fringeLookup[index] || 0;
          let score = Math.random();

          score += fringe * (preferFringe ? 1.9 : 0.55);
          if (avoidFringe) {
            score -= fringe * 1.1;
          }

          if (score > bestScore) {
            bestScore = score;
            best = {
              col: col,
              row: row,
              index: index,
              fringe: fringe,
              band: 0
            };
          }
        }

        if (best) {
          return best;
        }

        for (let attempt = 0; attempt < total; attempt += 1) {
          const index = randomInt(0, total);

          if (!insideLookup[index]) {
            return {
              col: index % cols,
              row: Math.floor(index / cols),
              index: index,
              fringe: fringeLookup[index] || 0,
              band: 0
            };
          }
        }

        return { col: 0, row: 0, index: 0, fringe: 0, band: 0 };
      }

      function buildWordMask() {
        denseCells = [];
        insideLookup = new Uint8Array(cols * rows);
        denseIndexLookup = new Int32Array(cols * rows);
        denseIndexLookup.fill(-1);

        offCtx.clearRect(0, 0, width, height);
        const referenceWidth = Math.min(
          width * (width < 720 ? 0.9 : width < 900 ? 0.84 : 0.77),
          Math.max(0, width - (width < 720 ? 44 : 160))
        );
        const referenceHeight =
          referenceWidth * (ARTEFAKT_REFERENCE_HEIGHT / ARTEFAKT_REFERENCE_WIDTH);
        const baseMetrics = measureWordmark(100);
        const baseVisualHeight = Math.max(1, baseMetrics.ascent + baseMetrics.descent);
        const maxWordWidth =
          width < 720 ? width - 44 : Math.max(220, width - 160);
        let targetFontSize = (referenceHeight / baseVisualHeight) * 100;
        let metrics = measureWordmark(targetFontSize);

        if (metrics.width > maxWordWidth) {
          targetFontSize *= maxWordWidth / metrics.width;
          metrics = measureWordmark(targetFontSize);
        }

        const offsetX = (width - metrics.width) * 0.5;
        const offsetY = height * (width < 720 ? 0.44 : width < 900 ? 0.34 : 0.315) - WORDMARK_BOX_PAD;
        metrics = drawWordmarkMask(offCtx, offsetX, offsetY, targetFontSize);

        logoDraw.offsetX = offsetX;
        logoDraw.offsetY = offsetY;
        logoDraw.targetWidth = metrics.width;
        logoDraw.targetHeight = metrics.height;

        const pixels = offCtx.getImageData(0, 0, width, height).data;
        wordMaskPixels = pixels;
        wordMaskWidth = width;
        wordMaskHeight = height;

        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < cols; col += 1) {
            const startX = Math.floor(col * charW);
            const startY = Math.floor(row * charH);
            const endX = Math.min(width, Math.ceil(startX + charW));
            const endY = Math.min(height, Math.ceil(startY + charH));
            let strongest = 0;
            let hits = 0;
            let samples = 0;

            for (let y = startY; y < endY; y += 2) {
              for (let x = startX; x < endX; x += 2) {
                const alpha = pixels[(y * width + x) * 4 + 3];
                samples += 1;

                if (alpha > 0) {
                  hits += 1;
                }

                if (alpha > strongest) {
                  strongest = alpha;
                }
              }
            }

            const coverage = samples ? hits / samples : 0;

            // Keep the silhouette crisp, but allow enough interior occupation to avoid a hollow outline.
            if (strongest > 14 && coverage > 0.04) {
              const index = row * cols + col;
              insideLookup[index] = strongest;
              const denseIndex = denseCells.length;
              denseIndexLookup[index] = denseIndex;
              denseCells.push({
                col: col,
                row: row,
                strength: Math.max(strongest / 255, coverage),
                char: pickDenseChar(Math.max(strongest / 255, coverage)),
                alpha: clamp(0.76 + coverage * 0.46 + (strongest / 255) * 0.08, 0.7, 1),
                flickerRate: randomInt(18, 42),
                densityBias: randomBetween(-0.05, 0.12),
                dx: 0,
                dy: 0,
                vx: 0,
                vy: 0,
                escapeLife: 0,
                tearBias: randomBetween(-0.12, 0.12),
                edge: 0,
                edgeStrength: 0,
                waveSeed: randomBetween(0, Math.PI * 2),
                tip: 0,
                serifEnd: 0,
                normalX: 0,
                normalY: 0,
                corner: 0,
                cavity: 0,
                frontier: 0,
                horizontalTerminal: 0,
                verticalTerminal: 0
              });
            }
          }
        }
      }

      function computeEdges() {
        if (!denseCells.length) return;
        const sample = function (col, row) {
          if (col < 0 || col >= cols || row < 0 || row >= rows) return 0;
          return insideLookup[row * cols + col] > 0 ? 1 : 0;
        };

        fringeLookup = new Float32Array(cols * rows);

        for (let i = 0; i < denseCells.length; i += 1) {
          const cell = denseCells[i];
          const c = cell.col;
          const r = cell.row;
          const n0 = sample(c - 1, r);
          const n1 = sample(c + 1, r);
          const n2 = sample(c, r - 1);
          const n3 = sample(c, r + 1);
          const n4 = sample(c - 1, r - 1);
          const n5 = sample(c + 1, r - 1);
          const n6 = sample(c - 1, r + 1);
          const n7 = sample(c + 1, r + 1);
          const insideNeighbors = n0 + n1 + n2 + n3 + n4 + n5 + n6 + n7;
          const g0 = 1 - n0;
          const g1 = 1 - n1;
          const g2 = 1 - n2;
          const g3 = 1 - n3;
          const g4 = 1 - n4;
          const g5 = 1 - n5;
          const g6 = 1 - n6;
          const g7 = 1 - n7;
          const cardinalGap = g0 + g1 + g2 + g3;
          const diagonalGap = g4 + g5 + g6 + g7;
          const edgeStrength = clamp(
            (cardinalGap * 1.15 + diagonalGap * 0.65) / 6.2,
            0,
            1
          );
          const normalX =
            g1 -
            g0 +
            ((g5 + g7) - (g4 + g6)) * 0.65;
          const normalY =
            g3 -
            g2 +
            ((g6 + g7) - (g4 + g5)) * 0.65;
          const normalLength = Math.sqrt(normalX * normalX + normalY * normalY) || 1;
          const corner =
            Math.max(g0 * g2, g1 * g2, g0 * g3, g1 * g3) *
              0.82 +
            diagonalGap * 0.045;
          const horizontalTerminal = clamp(
            Math.max(g0 * (1 - g1 * 0.45), g1 * (1 - g0 * 0.45)) *
              (0.55 + (1 - Math.min(1, g2 + g3)) * 0.45),
            0,
            1
          );
          const verticalTerminal = clamp(
            Math.max(g2 * (1 - g3 * 0.45), g3 * (1 - g2 * 0.45)) *
              (0.55 + (1 - Math.min(1, g0 + g1)) * 0.45),
            0,
            1
          );
          const cavity =
            edgeStrength > 0.14 && insideNeighbors >= 5
              ? clamp(edgeStrength * 0.72 + cardinalGap * 0.08, 0, 1)
              : 0;

          cell.edgeStrength = edgeStrength;
          cell.edge = edgeStrength > 0.01 ? 1 : 0;
          cell.normalX = normalX / normalLength;
          cell.normalY = normalY / normalLength;
          cell.corner = clamp(corner, 0, 1);
          cell.cavity = cavity;
          cell.horizontalTerminal = horizontalTerminal;
          cell.verticalTerminal = verticalTerminal;
          // Sharp corners / serif tips / cut-ins.
          cell.tip =
            cell.edge &&
            (insideNeighbors <= 2 || cell.corner > 0.54 || (edgeStrength > 0.62 && insideNeighbors <= 4))
              ? 1
              : 0;
          // Softer terminals and crossbar ends still get ribbon motion, but less explosive.
          cell.serifEnd =
            cell.edge &&
            !cell.tip &&
            (horizontalTerminal > 0.28 || verticalTerminal > 0.28)
              ? 1
              : 0;
          cell.frontier = clamp(
            edgeStrength * 0.72 +
              cell.corner * 0.4 +
              Math.max(horizontalTerminal, verticalTerminal) * 0.26 +
              cavity * 0.18,
            0,
            1
          );
        }

        for (let i = 0; i < denseCells.length; i += 1) {
          const cell = denseCells[i];
          if (!cell.edge) continue;

          const radius = cell.tip ? 4 : cell.serifEnd ? 3.5 : 3;
          const span = Math.ceil(radius);
          const baseInfluence =
            0.28 +
            cell.edgeStrength * 0.44 +
            cell.corner * 0.36 +
            cell.cavity * 0.16 +
            (cell.serifEnd ? 0.18 : 0);

          for (let dr = -span; dr <= span; dr += 1) {
            for (let dc = -span; dc <= span; dc += 1) {
              const col = cell.col + dc;
              const row = cell.row + dr;
              if (col < 0 || col >= cols || row < 0 || row >= rows) continue;

              const index = row * cols + col;
              if (insideLookup[index]) continue;

              const dist = Math.sqrt(dc * dc + dr * dr * 0.92);
              if (dist > radius) continue;

              const alignment =
                dc * cell.normalX + dr * cell.normalY;
              let influence =
                (1 - dist / radius) * baseInfluence;

              if (alignment > 0.22) {
                influence *= 1.12;
              } else if (alignment < -0.35) {
                influence *= 0.72;
              }

              if (influence > fringeLookup[index]) {
                fringeLookup[index] = influence;
              }
            }
          }
        }

        buildBurstOrigins();
      }

      function buildBurstOrigins() {
        contourSeeds = [];
        cavitySeeds = [];
        for (let i = 0; i < denseCells.length; i += 1) {
          const c = denseCells[i];
          if (c.frontier > 0.2 && c.edge) {
            contourSeeds.push(i);
          }
          if (c.cavity > 0.12) {
            cavitySeeds.push(i);
          }
        }
      }

      function pickBurstOriginIndex() {
        if (!contourSeeds.length) {
          return -1;
        }
        if (
          cavitySeeds.length &&
          Math.random() < HERO_CRT.innerContourWeight
        ) {
          return cavitySeeds[randomInt(0, cavitySeeds.length)];
        }
        return contourSeeds[randomInt(0, contourSeeds.length)];
      }

      /**
       * Grows a small irregular cluster: starts on the contour, then “walks” a few steps
       * into the fill so motion feels like a brief re-sampling of the glyph, not a full-word wave.
       */
      function buildBurstClusterMembers(seedIdx) {
        const target = randomInt(
          HERO_CRT.burstMinCells,
          HERO_CRT.burstMaxCells + 1
        );
        const members = new Map();
        const queue = [[seedIdx, 0]];
        const visited = new Set();
        const dirs = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ];

        while (queue.length && members.size < target) {
          const pick = randomInt(0, queue.length);
          const item = queue[pick];
          queue[pick] = queue[queue.length - 1];
          queue.length -= 1;
          const idx = item[0];
          const depth = item[1];
          if (visited.has(idx) || depth > HERO_CRT.maxCrawlDepth * 2) {
            continue;
          }
          visited.add(idx);
          const cell = denseCells[idx];
          if (!cell) {
            continue;
          }
          const inward = cell.edge ? 0 : 1;
          const w =
            depth === 0
              ? 1
              : (0.42 + 0.48 * Math.random()) * Math.exp(-depth * 0.31) * (0.75 + 0.25 * (1 - inward * 0.4));
          if (w < 0.1) {
            continue;
          }
          members.set(idx, { w: w, d: depth, inward: inward });
          if (members.size >= target) {
            break;
          }
          for (let k = 0; k < dirs.length; k += 1) {
            if (queue.length + members.size > target * 3 && Math.random() < 0.2) {
              continue;
            }
            const dcc = dirs[k][0];
            const drr = dirs[k][1];
            const ni = (cell.row + drr) * cols + (cell.col + dcc);
            const di = denseIndexLookup[ni];
            if (di < 0 || visited.has(di)) {
              continue;
            }
            const ncell = denseCells[di];
            if (!ncell) {
              continue;
            }
            if (depth < 2 && ncell.frontier < 0.04 && !ncell.edge && Math.random() < 0.35) {
              continue;
            }
            queue.push([di, depth + 1]);
          }
        }
        return members;
      }

      function ensureBurstBuffers() {
        const n = denseCells.length;
        if (burstAccX.length !== n) {
          burstAccX = new Float32Array(n);
          burstAccY = new Float32Array(n);
          burstHeat = new Float32Array(n);
        }
      }

      function updateEdgeBursts(now) {
        if (!denseCells.length) {
          return;
        }
        ensureBurstBuffers();
        burstAccX.fill(0);
        burstAccY.fill(0);
        burstHeat.fill(0);

        if (reduceMotion) {
          edgeBursts.length = 0;
          return;
        }

        const calm = HERO_CRT.calmness;
        edgeBursts = edgeBursts.filter(function (b) {
          return now - b.t0 < b.duration;
        });

        if (
          contourSeeds.length &&
          now >= nextBurstAt &&
          edgeBursts.length < HERO_CRT.maxConcurrentBursts
        ) {
          const p =
            HERO_CRT.baseBurstSpawn *
            (1 - calm * 0.9) *
            (1 - edgeBursts.length * 0.12) *
            (0.4 + 0.6 * Math.random());
          if (Math.random() < p) {
            const origin = pickBurstOriginIndex();
            if (origin >= 0) {
              const cluster = buildBurstClusterMembers(origin);
              if (cluster.size > 2) {
                const members = [];
                cluster.forEach(function (meta, denseIdx) {
                  members.push({
                    i: denseIdx,
                    w: meta.w,
                    d: meta.d,
                    inward: meta.inward
                  });
                });
                edgeBursts.push({
                  t0: now,
                  duration: randomBetween(
                    HERO_CRT.burstDurationMs[0],
                    HERO_CRT.burstDurationMs[1]
                  ),
                  phase: randomBetween(0, Math.PI * 2),
                  members: members
                });
                nextBurstAt =
                  now +
                  randomBetween(HERO_CRT.burstCooldownMs[0], HERO_CRT.burstCooldownMs[1]);
              }
            }
          }
        }

        for (let b = 0; b < edgeBursts.length; b += 1) {
          const burst = edgeBursts[b];
          const u = (now - burst.t0) / burst.duration;
          if (u >= 1) {
            continue;
          }
          const env = Math.sin(u * Math.PI) * (1 - u * 0.12);
          const ig = HERO_CRT.edgeIgnitionStrength;
          for (let m = 0; m < burst.members.length; m += 1) {
            const mem = burst.members[m];
            const cell = denseCells[mem.i];
            if (!cell) {
              continue;
            }
            const str = mem.w * env;
            const flutter =
              0.58 +
              0.42 *
                Math.sin(now * 0.0072 + burst.phase + mem.i * 0.19 + mem.d * 0.31);
            const h = str * ig * flutter;
            const nx = cell.normalX;
            const ny = cell.normalY;
            const inPull =
              mem.d > 0
                ? HERO_CRT.crawlInwardWeight * (0.2 + 0.8 * (mem.inward || 0))
                : 0;
            const jx = (Math.random() - 0.5) * HERO_CRT.microJitterPx;
            const jy = (Math.random() - 0.5) * HERO_CRT.microJitterPx;
            burstAccX[mem.i] += nx * charW * h - nx * charW * inPull * h * 0.35 + jx * h;
            burstAccY[mem.i] += ny * charH * h - ny * charH * inPull * h * 0.22 + jy * h;
            if (mem.d > 0) {
              burstAccX[mem.i] += -ny * charW * 0.14 * h * 0.18 * (mem.d * 0.1);
              burstAccY[mem.i] += nx * charH * 0.12 * h * 0.16 * (mem.d * 0.1);
            }
            burstHeat[mem.i] = Math.max(burstHeat[mem.i], str * env);
          }
        }
      }

      function isInsideAt(x, y) {
        const offsetX = logoDraw.offsetX || 0;
        const offsetY = logoDraw.offsetY || 0;

        // quick bbox reject (+padding)
        const pad = Math.max(10, charW * 1.25);
        const w = (logoDraw.targetWidth || 0) + pad * 2;
        const h = (logoDraw.targetHeight || 0) + pad * 2;
        if (x < offsetX - pad || x > offsetX - pad + w) return false;
        if (y < offsetY - pad || y > offsetY - pad + h) return false;

        if (!wordMaskPixels || !wordMaskWidth || !wordMaskHeight) {
          return false;
        }

        const px = Math.round(x);
        const py = Math.round(y);
        const radius = Math.max(1, Math.round(Math.min(charW, charH) * 0.35));

        for (let yy = py - radius; yy <= py + radius; yy += 1) {
          if (yy < 0 || yy >= wordMaskHeight) continue;
          for (let xx = px - radius; xx <= px + radius; xx += 1) {
            if (xx < 0 || xx >= wordMaskWidth) continue;
            if (wordMaskPixels[(yy * wordMaskWidth + xx) * 4 + 3] > 8) {
              return true;
            }
          }
        }

        return false;
      }

      function pushHole(x, y, strength) {
        // Hover “gape”: large organic void (~ellipse), heals in ~1s (reference frames).
        const base =
          randomBetween(charW * 3.6, charW * 6.4) * clamp(0.96 + strength * 0.08, 0.96, 1.1);
        const maxLife = randomInt(54, 72);
        holes.push({
          x: x + randomBetween(-charW * 0.14, charW * 0.14),
          y: y + randomBetween(-charH * 0.14, charH * 0.14),
          r: base,
          bx: randomBetween(0.82, 1.22),
          by: randomBetween(0.82, 1.22),
          rot: randomBetween(-0.55, 0.55),
          life: maxLife,
          maxLife: maxLife,
          power: clamp(0.82 + strength * 0.16, 0.82, 1)
        });

        if (holes.length > 8) holes.shift();
      }

      function holeInfluenceAt(px, py) {
        if (!holes.length) return 0;
        let influence = 0;
        for (let i = 0; i < holes.length; i += 1) {
          const h = holes[i];
          const dx = px - h.x;
          const dy = py - h.y;
          const cr = Math.cos(h.rot || 0);
          const sr = Math.sin(h.rot || 0);
          const rx = dx * cr - dy * sr;
          const ry = dx * sr + dy * cr;
          const ex = Math.abs(rx) / Math.max(0.001, h.r * (h.bx || 1));
          const ey = Math.abs(ry) / Math.max(0.001, h.r * (h.by || 1));
          // Softer superellipse: not a perfect circle, reads closer to reference.
          const d = Math.pow(Math.pow(ex, 2.15) + Math.pow(ey, 2.15), 0.46);
          if (d >= 1) continue;
          const t = 1 - d;
          const fade = clamp(h.life / h.maxLife, 0, 1);
          const bump = Math.pow(t, 1.22) * (0.32 + 0.68 * fade) * h.power;
          if (bump > influence) influence = bump;
        }
        return influence;
      }

      function repelNearPointer(px, py, intensity) {
        const hoverR = charW * randomBetween(6.2, 9.8) * intensity;
        const c0 = Math.floor(px / charW);
        const r0 = Math.floor(py / charH);
        const span = Math.ceil(hoverR / Math.min(charW, charH)) + 4;
        let n = 0;

        for (let dr = -span; dr <= span; dr += 1) {
          for (let dc = -span; dc <= span; dc += 1) {
            const col = c0 + dc;
            const row = r0 + dr;
            if (col < 0 || col >= cols || row < 0 || row >= rows) continue;
            const index = row * cols + col;
            const denseIndex = denseIndexLookup[index];
            if (denseIndex < 0) continue;

            const cx = (col + 0.5) * charW;
            const cy = (row + 0.5) * charH;
            const dx = cx - px;
            const dy = cy - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > hoverR) continue;

            const cell = denseCells[denseIndex];
            if (!cell) continue;
            const falloff = 1 - dist / hoverR;
            const dirx = dist > 0.001 ? dx / dist : randomBetween(-1, 1);
            const diry = dist > 0.001 ? dy / dist : randomBetween(-1, 1);
            const wobble = 0.88 + Math.sin((col * 0.71 + row * 0.53) * 2.1) * 0.12;
            const push = falloff * falloff * randomBetween(0.48, 0.95) * wobble;

            cell.vx += dirx * push * randomBetween(0.62, 1.18);
            cell.vy += diry * push * randomBetween(0.52, 1.05);
            cell.escapeLife = Math.max(cell.escapeLife, randomInt(28, 64));
            n += 1;
            if (n > 620) return;
          }
        }
      }

      function updateHoles() {
        if (!holes.length) return;
        for (let i = holes.length - 1; i >= 0; i -= 1) {
          holes[i].life -= 1;
          if (holes[i].life <= 0) holes.splice(i, 1);
        }
      }

      function updateDenseDynamics() {
        if (!denseCells.length) return;
        // Ambient border micro-motion + short frontier “escapes” (pointer-independent).
        // No global TV band / sine wave — localized bursts are handled in `updateEdgeBursts`.
        const ambientChance = reduceMotion ? 0.0005 : 0.0018;
        const escapeChance = reduceMotion ? 0.0003 : 0.0009;

        for (let i = 0; i < denseCells.length; i += 1) {
          const cell = denseCells[i];
          const frontier = cell.edge ? (0.24 + cell.frontier * 0.92) : 0;
          const tipBoost = cell.tip ? 1.24 : cell.serifEnd ? 1.09 : 1;

          if (cell.escapeLife > 0) {
            cell.escapeLife -= 1;
            cell.dx += cell.vx;
            cell.dy += cell.vy;
            cell.vx *= 0.9;
            cell.vy *= 0.9;
          } else {
            // relax back into the original shape
            const st = HERO_CRT.settleSpeed;
            cell.dx = lerp(cell.dx, 0, cell.edge ? st : st * 1.35);
            cell.dy = lerp(cell.dy, 0, cell.edge ? st : st * 1.35);
            cell.vx *= 0.84;
            cell.vy *= 0.84;

            if (cell.edge && Math.random() < ambientChance * (0.45 + frontier * 1.2)) {
              const outward =
                randomBetween(0.06, 0.22) *
                frontier *
                (0.82 + cell.corner * 0.52) *
                tipBoost;
              cell.vx +=
                cell.normalX * outward +
                randomBetween(-0.07, 0.07) * (0.4 + cell.cavity * 0.4);
              cell.vy +=
                cell.normalY * outward +
                randomBetween(-0.05, 0.05) * (0.35 + cell.cavity * 0.42);
            }

            // Frontier-driven escapes: mostly silhouette borders, counters, crossbar tips, and serif ends.
            if (
              cell.edge &&
              Math.random() <
                escapeChance *
                  (0.34 + frontier * 1.72 + cell.corner * 0.7 + cell.cavity * 0.28)
            ) {
              const outward =
                randomBetween(0.24, 0.72) *
                (0.58 + frontier * 0.84) *
                tipBoost;
              cell.escapeLife = randomInt(cell.tip ? 14 : 8, cell.tip ? 44 : 34);
              cell.vx +=
                cell.normalX * outward +
                randomBetween(-0.18, 0.18) * (0.35 + cell.horizontalTerminal * 0.55);
              cell.vy +=
                cell.normalY * outward +
                randomBetween(-0.2, 0.2) * (0.32 + cell.verticalTerminal * 0.55);
            }
          }

          // Wider clamp so large hover repulsion can clear a big ring around the cursor.
          const maxDx = charW * 2.45;
          const maxDy = charH * 1.78;
          cell.dx = clamp(cell.dx, -maxDx, maxDx);
          cell.dy = clamp(cell.dy, -maxDy, maxDy);
        }
      }

      function spawnSparseCell(existing) {
        const now = performance.now();
        const spot = pickOutsideCell({
          now: now,
          preferFringe: Math.random() < 0.7,
          tries: 80
        });
        const cell = existing || {};
        const scanMode = spot.fringe > 0.12 && Math.random() < 0.16;
        const fringe = spot.fringe || 0;

        cell.col = spot.col;
        cell.row = spot.row;
        cell.index = spot.index;
        cell.fringe = fringe;
        cell.band = 0;
        cell.mode = scanMode ? "scan" : fringe > 0.18 && Math.random() < 0.34 ? "ghost" : "dust";
        cell.char = randomChar(scanMode ? GLITCH_CHARS : SPARSE_CHARS);
        cell.alpha =
          randomBetween(0.03, scanMode ? 0.11 : 0.16) *
          (0.76 + fringe * 1.12);
        cell.targetAlpha = cell.alpha * randomBetween(0.9, 1.35);
        cell.life = scanMode ? randomInt(8, 28) : randomInt(22, 104);
        cell.twinkle = randomBetween(0.72, 1.24);
        cell.offsetX = 0;
        cell.offsetY = 0;
        cell.driftX = scanMode ? randomBetween(-1.15, 1.15) : randomBetween(-0.06, 0.06);
        cell.driftY = scanMode ? randomBetween(-0.08, 0.08) : randomBetween(-0.04, 0.04);
        cell.stretch = scanMode ? randomInt(1, fringe > 0.28 ? 3 : 2) : 0;
        cell.hold = randomInt(4, 10);

        return cell;
      }

      function initSparseCells() {
        const target = Math.max(56, Math.round(cols * rows * 0.0054));
        sparseCells = [];

        for (let index = 0; index < target; index += 1) {
          sparseCells.push(spawnSparseCell());
        }
      }

      function updateSparseCells() {
        for (let index = 0; index < sparseCells.length; index += 1) {
          const cell = sparseCells[index];
          cell.life -= 1;
          cell.band = 0;

          if (cell.life <= 0 || Math.random() < 0.03) {
            spawnSparseCell(cell);
            continue;
          }

          if (cell.life < (cell.mode === "scan" ? 5 : 20)) {
            cell.targetAlpha = 0;
          }

          if (cell.fringe > 0.14 && Math.random() < 0.02) {
            cell.mode = "scan";
            cell.life = Math.max(cell.life, randomInt(8, 24));
            cell.driftX = randomBetween(-1.25, 1.25);
            cell.driftY = randomBetween(-0.06, 0.06);
            cell.stretch = Math.max(cell.stretch || 0, randomInt(1, 3));
            cell.char = randomChar(GLITCH_CHARS);
            cell.targetAlpha = Math.max(cell.targetAlpha, randomBetween(0.08, 0.18));
          }

          if (Math.random() < (cell.mode === "scan" ? 0.26 : 0.12)) {
            cell.char = randomChar(cell.mode === "scan" ? GLITCH_CHARS : SPARSE_CHARS);
          }

          if (cell.mode === "scan") {
            cell.offsetX += cell.driftX * 0.75;
            cell.offsetY += cell.driftY;
            cell.hold -= 1;
            if (cell.hold <= 0) {
              cell.hold = randomInt(3, 9);
              cell.driftX = randomBetween(-1.25, 1.25);
              cell.driftY = randomBetween(-0.08, 0.08);
            }
          } else {
            cell.offsetX = lerp(cell.offsetX, 0, 0.24);
            cell.offsetY = lerp(cell.offsetY, 0, 0.24);
            cell.offsetX += randomBetween(-0.08, 0.08) * cell.fringe * 0.3;
            cell.offsetY += randomBetween(-0.06, 0.06) * (0.18 + cell.fringe * 0.22);
          }

          const twinkleTarget =
            0.74 +
            cell.fringe * 0.32 +
            (cell.mode === "scan" ? 0.18 : 0);
          cell.twinkle += (twinkleTarget - cell.twinkle) * 0.12;
          cell.alpha += (cell.targetAlpha - cell.alpha) * 0.16;
          cell.alpha = Math.max(0.015, Math.min(0.24, cell.alpha));
        }
      }

      function spawnParticle(existing) {
        const particle = existing || {};
        const burstMode = Math.random() < 0.12;
        const spot = burstMode
          ? pickOutsideCell({
              preferFringe: true,
              tries: 96
            })
          : null;

        particle.mode = burstMode ? (Math.random() < 0.58 ? "scan" : "spark") : "float";
        particle.x = spot
          ? (spot.col + randomBetween(-0.35, 1.2)) * charW
          : randomBetween(0, width);
        particle.y = spot
          ? (spot.row + randomBetween(-0.28, 1.15)) * charH
          : randomBetween(-height * 0.08, height * 1.04);
        particle.char = randomChar(
          particle.mode === "scan" ? GLITCH_CHARS : SPARSE_CHARS
        );
        particle.alpha = randomBetween(0.02, particle.mode === "scan" ? 0.12 : 0.18);
        particle.targetAlpha =
          randomBetween(0.04, particle.mode === "scan" ? 0.16 : 0.22) +
          (spot ? (spot.fringe || 0) * 0.06 : 0);
        particle.driftX =
          particle.mode === "scan"
            ? randomBetween(-1.6, 1.6)
            : particle.mode === "spark"
              ? randomBetween(-0.28, 0.28)
              : randomBetween(-0.05, 0.05);
        particle.driftY =
          particle.mode === "scan"
            ? randomBetween(-0.06, 0.06)
            : particle.mode === "spark"
              ? randomBetween(-0.12, 0.12)
              : randomBetween(0.01, 0.07);
        particle.life =
          particle.mode === "scan"
            ? randomInt(10, 34)
            : particle.mode === "spark"
              ? randomInt(18, 64)
              : randomInt(120, 280);
        particle.trail =
          particle.mode === "scan" ? randomInt(1, 4) : particle.mode === "spark" ? 1 : 0;
        particle.fringe = spot ? spot.fringe || 0 : 0;
        particle.band = spot ? spot.band || 0 : 0;
        particle.flip = randomBetween(0.02, 0.08);

        return particle;
      }

      function initParticles() {
        const count = width < 720 ? 28 : 42;
        particles = [];

        for (let index = 0; index < count; index += 1) {
          particles.push(spawnParticle());
        }
      }

      function updateParticles() {
        for (let index = 0; index < particles.length; index += 1) {
          const particle = particles[index];
          particle.life -= 1;
          particle.band = 0;

          if (particle.life < (particle.mode === "scan" ? 6 : 48)) {
            particle.targetAlpha = 0;
          }

          if (Math.random() < particle.flip) {
            particle.char = randomChar(
              particle.mode === "scan" ? GLITCH_CHARS : SPARSE_CHARS
            );
          }

          if (
            particle.mode === "float" &&
            particle.fringe > 0.1 &&
            Math.random() < 0.015
          ) {
            particle.mode = "scan";
            particle.life = Math.max(particle.life, randomInt(10, 24));
            particle.driftX = randomBetween(-1.45, 1.45);
            particle.driftY = randomBetween(-0.05, 0.05);
            particle.trail = randomInt(1, 3);
            particle.char = randomChar(GLITCH_CHARS);
            particle.targetAlpha = Math.max(particle.targetAlpha, randomBetween(0.08, 0.16));
          }

          if (particle.mode === "scan") {
            particle.alpha += (particle.targetAlpha - particle.alpha) * 0.18;
            particle.x += particle.driftX * 0.9;
            particle.y += particle.driftY;
          } else if (particle.mode === "spark") {
            particle.alpha += (particle.targetAlpha - particle.alpha) * 0.14;
            particle.x += particle.driftX + randomBetween(-0.18, 0.18) * (0.18 + particle.fringe * 0.3);
            particle.y += particle.driftY + randomBetween(-0.12, 0.12) * 0.18;
          } else {
            particle.alpha += (particle.targetAlpha - particle.alpha) * 0.08;
            particle.x += particle.driftX;
            particle.y += particle.driftY;
          }

          if (particle.life <= 0 || particle.alpha <= 0.01 || particle.y > height + 24) {
            spawnParticle(particle);
          }
        }
      }

      function resizeCanvas() {
        width = window.innerWidth;
        height = hero.clientHeight || window.innerHeight;
        const colDiv =
          (width < 720 ? HERO_CRT.gridColumnsNarrow : HERO_CRT.gridColumnsWide) *
          HERO_CRT.gridDensity;
        charW = Math.max(width < 720 ? 2.3 : HERO_CRT.gridCharWMin, width / colDiv);
        charH = charW * 1.2;
        fontSize = Math.max(width < 720 ? 3 : 8, Math.round(charH * 1.02));
        cols = Math.floor(width / charW);
        rows = Math.floor(height / charH);

        canvas.width = width;
        canvas.height = height;
        offscreen.width = width;
        offscreen.height = height;

        buildWordMask();
        computeEdges();
        initSparseCells();
        initParticles();
        holes.length = 0;
        edgeBursts.length = 0;
        nextBurstAt = 0;
      }

      function renderDenseCells() {
        const now = performance.now();
        const t = (now - t0) * 0.001;
        const phosphor =
          1 +
          Math.sin(t * 2.1 + frameCount * 0.03) * HERO_CRT.globalLuminanceFlicker;

        for (let index = 0; index < denseCells.length; index += 1) {
          const cell = denseCells[index];
          const strength = cell.strength;
          const baseX = cell.col * charW;
          const baseY = cell.row * charH;
          const holeHit = holeInfluenceAt(baseX + charW * 0.5, baseY + charH * 0.55);
          const heat = burstHeat.length > index ? burstHeat[index] : 0;
          const bdx = burstAccX.length > index ? burstAccX[index] : 0;
          const bdy = burstAccY.length > index ? burstAccY[index] : 0;

          const hotShuffle = heat * HERO_CRT.burstGlyphShuffle;
          if (Math.random() < hotShuffle) {
            cell.char =
              Math.random() < 0.55
                ? pickDenseChar(strength)
                : randomChar(GLITCH_CHARS);
          } else if (
            frameCount % cell.flickerRate === 0 &&
            Math.random() < HERO_CRT.idleGlyphShuffle
          ) {
            cell.char = pickDenseChar(strength);
            cell.alpha = clamp(
              0.76 + strength * 0.2 + randomBetween(-0.018, 0.028),
              0.7,
              1
            );
          }

          // when "torn", skip blocks more aggressively (frame-001 has real missing chunks)
          const escapeTear = cell.escapeLife > 0 ? 0.06 : 0;
          const tear = clamp(holeHit * 0.88 + escapeTear + cell.tearBias * 0.05, 0, 1);
          const interiorHold = cell.edge ? 0 : 0.12 + strength * 0.06;
          const drawChance = clamp(
            0.69 +
              strength * 0.25 +
              (cell.edge ? 0.03 + cell.frontier * 0.04 : 0.13) +
              interiorHold +
              cell.densityBias * 0.34 -
              tear * 0.74,
            cell.edge ? 0.28 : 0.78,
            0.996
          );

          if (Math.random() > drawChance) {
            continue;
          }

          if (
            tear > (cell.edge ? 0.38 : 0.56) &&
            Math.random() < tear * (cell.edge ? 0.46 : 0.14)
          ) {
            continue;
          }

          const alpha = clamp(
            cell.alpha * (1 - tear * 0.56) * (0.95 + heat * 0.12) * phosphor,
            0,
            1
          );
          if (alpha <= 0.01) continue;

          // glitch: partial slices + alternate glyphs only when a burst is heating this cell (or hover tear).
          const glitchiness = clamp(
            0.015 + strength * 0.02 + tear * 0.14 + heat * 0.2,
            0,
            0.2
          );
          const drawChar = Math.random() < glitchiness ? randomChar(GLITCH_CHARS) : cell.char;
          ctx.fillStyle = "rgba(255, 255, 255, " + alpha.toFixed(3) + ")";

          const drawX = Math.round(baseX + cell.dx + bdx);
          const drawY = Math.round(baseY + cell.dy + bdy);

          if (Math.random() < glitchiness * 0.18) {
            const sliceY = Math.round(drawY + randomBetween(0.12, 0.62) * charH);
            const sliceH = Math.round(clamp(randomBetween(0.24, 0.36) * charH, 2, charH * 0.48));
            ctx.save();
            ctx.beginPath();
            ctx.rect(drawX, sliceY, Math.round(charW), sliceH);
            ctx.clip();
            ctx.fillText(drawChar, drawX, drawY);
            ctx.restore();
          } else {
            ctx.fillText(drawChar, drawX, drawY);
          }
        }
      }

      function renderSparseCells() {
        for (let index = 0; index < sparseCells.length; index += 1) {
          const cell = sparseCells[index];
          const alpha = clamp(
            cell.alpha * cell.twinkle * (0.72 + cell.fringe * 0.82) * (cell.mode === "scan" ? 0.88 : 1),
            0.02,
            0.2
          );
          const drawX = cell.col * charW + (cell.offsetX || 0);
          const drawY = cell.row * charH + (cell.offsetY || 0);

          ctx.fillStyle = "rgba(255, 255, 255, " + alpha.toFixed(3) + ")";
          if (cell.mode === "scan" && cell.stretch > 0) {
            const direction = cell.driftX >= 0 ? 1 : -1;
            for (let s = 0; s <= cell.stretch; s += 1) {
              const decay = 1 - s / (cell.stretch + 1.35);
              ctx.fillStyle =
                "rgba(255, 255, 255, " + (alpha * decay).toFixed(3) + ")";
              ctx.fillText(cell.char, drawX + direction * s * charW * 0.82, drawY);
            }
          } else {
            ctx.fillText(cell.char, drawX, drawY);
          }
        }
      }

      function renderParticles() {
        for (let index = 0; index < particles.length; index += 1) {
          const particle = particles[index];
          const alpha = clamp(
            particle.alpha * (0.72 + particle.fringe * 0.5 + particle.band * 0.95),
            0.012,
            0.18
          );

          if (particle.mode === "scan" && particle.trail > 0) {
            const direction = particle.driftX >= 0 ? 1 : -1;
            for (let s = 0; s <= particle.trail; s += 1) {
              const decay = 1 - s / (particle.trail + 1.2);
              ctx.fillStyle =
                "rgba(255, 255, 255, " + (alpha * decay).toFixed(3) + ")";
              ctx.fillText(
                particle.char,
                particle.x - direction * s * charW * 0.78,
                particle.y
              );
            }
          } else {
            ctx.fillStyle = "rgba(255, 255, 255, " + alpha.toFixed(3) + ")";
            ctx.fillText(particle.char, particle.x, particle.y);
          }
        }
      }

      function render() {
        if (!reduceMotion && (!heroVisible || document.hidden)) {
          animationFrame = window.requestAnimationFrame(render);
          return;
        }
        frameCount += 1;
        ctx.clearRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = false;
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
        ctx.textBaseline = "top";

        const now = performance.now();
        if (!reduceMotion) {
          updateDenseDynamics();
          updateHoles();
        } else if (frameCount % 4 === 0) {
          updateDenseDynamics();
          updateHoles();
        }

        updateEdgeBursts(now);
        ctx.font =
          "700 " +
          Math.round(fontSize) +
          'px "Courier New", Courier, monospace';
        renderDenseCells();
        ctx.font =
          "400 " +
          Math.round(fontSize) +
          'px "Courier New", Courier, monospace';
        renderSparseCells();
        renderParticles();

        if (!reduceMotion) {
          if (frameCount % 4 === 0) {
            updateSparseCells();
            updateParticles();
          }
        } else if (frameCount % 10 === 0) {
          updateSparseCells();
          updateParticles();
        }

        if (!reduceMotion) animationFrame = window.requestAnimationFrame(render);
      }

      function scheduleResize() {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(function () {
          window.cancelAnimationFrame(animationFrame);
          resizeCanvas();
          render();
        }, 60);
      }

      function scramble(element) {
        const original = element.dataset.original || element.textContent;

        if (reduceMotion) {
          element.textContent = original;
          return;
        }

        window.clearInterval(element._scrambleTimer);
        let iterations = 0;

        element._scrambleTimer = window.setInterval(function () {
          element.textContent = original.split("").map(function (character, index) {
            if (character === " ") {
              return " ";
            }

            if (index < iterations) {
              return original.charAt(index);
            }

            return randomChar(SCRAMBLE_CHARS);
          }).join("");

          iterations += 0.45;

          if (iterations >= original.length + 1) {
            window.clearInterval(element._scrambleTimer);
            element.textContent = original;
          }
        }, 30);
      }

      document.querySelectorAll("#header .main-navigation a").forEach(function (link) {
        link.dataset.original = link.textContent;
      });

      function handlePointerMove(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        pointer.x = x;
        pointer.y = y;
        pointer.active = true;
        pointer.inside = isInsideAt(x, y);

        // only "damage" the logo area
        if (!pointer.inside || reduceMotion) return;

        // throttle: small circular interaction only (reference hover)
        if (frameCount - lastDamageFrame < 2) return;
        lastDamageFrame = frameCount;

        const intensity = randomBetween(1.02, 1.22);
        pushHole(x, y, intensity);
        repelNearPointer(x, y, intensity);
      }

      function handlePointerLeave() {
        pointer.active = false;
        pointer.inside = false;
        pointer.x = -1;
        pointer.y = -1;
      }

      hero.style.height = "100%";
      resizeCanvas();
      render();

      window.addEventListener("resize", scheduleResize);
      hero.addEventListener("mousemove", handlePointerMove, { passive: true });
      hero.addEventListener("mouseleave", handlePointerLeave, { passive: true });
      hero.addEventListener("touchmove", function (event) {
        if (!event.touches || !event.touches.length) return;
        handlePointerMove(event.touches[0]);
      }, { passive: true });
      hero.addEventListener("touchend", handlePointerLeave, { passive: true });
    })();
