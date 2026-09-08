(function () {
    "use strict";
    const host = document.querySelector("[data-ascii-portrait]");
    if (!host) return;
    const photo = host.querySelector("img");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    const context = canvas.getContext("2d");
    const sample = document.createElement("canvas");
    const sampleContext = sample.getContext("2d", { willReadFrequently: true });
    if (!context || !sampleContext) return;
    const glyphs = ".,:;=+*%#@";
    const clamp = value => Math.max(0, Math.min(1, value));
    let width = 0, height = 0, columns = 0, rows = 0, cells = [];
    let visible = false, frame = 0, lastProgress = -1, lastBeat = -1;

    function resize() {
        width = host.clientWidth;
        height = host.clientHeight;
        if (!width || !height) return;
        const dpr = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        columns = width < 300 ? 48 : 64;
        rows = Math.round(height / (width / columns * 1.45));
        sample.width = columns;
        sample.height = rows;
        sampleContext.drawImage(photo, 0, 0, columns, rows);
        const pixels = sampleContext.getImageData(0, 0, columns, rows).data;
        cells = Array.from({ length: columns * rows }, (_, i) => {
            const luminance = (pixels[i*4] * .2126 + pixels[i*4+1] * .7152 + pixels[i*4+2] * .0722) / 255;
            const noise = Math.sin(i * 127.1 + 311.7) * 43758.5453;
            return { density: Math.pow(1 - luminance, .85), noise: noise - Math.floor(noise) };
        });
        lastProgress = -1;
    }

    function draw(time) {
        frame = 0;
        if (!visible || document.hidden || reduced.matches) return;
        const rect = host.getBoundingClientRect();
        const progress = clamp((innerHeight * .94 - rect.top) / (innerHeight * .8));
        const beat = Math.floor(time / 110);
        if (Math.abs(progress - lastProgress) > .001 || (progress < .62 && beat !== lastBeat)) {
            context.clearRect(0, 0, width, height);
            const cw = width / columns, ch = height / rows;
            context.font = `${Math.max(7, ch * .9)}px "Courier New", monospace`;
            context.textAlign = "center";
            context.textBaseline = "middle";
            const reveal = clamp((progress - .42) / .53);
            const sourceWidth = photo.naturalWidth / columns;
            const sourceHeight = photo.naturalHeight / rows;
            cells.forEach((cell, i) => {
                const x = i % columns, y = Math.floor(i / columns);
                const threshold = .05 + cell.noise * .43 + (y / rows) * .34;
                const ink = clamp((reveal - threshold) / .14);
                if (ink > 0) {
                    context.globalAlpha = ink;
                    context.drawImage(photo, x * sourceWidth, y * sourceHeight, sourceWidth, sourceHeight,
                        x * cw, y * ch, cw + .35, ch + .35);
                }
                if (ink < 1) {
                    const settled = Math.floor(cell.density * (glyphs.length - 1));
                    const scramble = progress < .4 && cell.noise > .6;
                    const index = scramble ? (settled + beat + i) % glyphs.length : settled;
                    context.globalAlpha = (1 - ink) * (.24 + cell.density * .76);
                    context.fillStyle = "#fff";
                    context.fillText(glyphs[index], x * cw + cw / 2, y * ch + ch / 2);
                }
            });
            context.globalAlpha = 1;
            host.dataset.asciiProgress = progress.toFixed(3);
            lastProgress = progress;
            lastBeat = beat;
        }
        frame = requestAnimationFrame(draw);
    }

    function sync() {
        cancelAnimationFrame(frame);
        host.classList.toggle("ascii-ready", !reduced.matches);
        if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(draw);
    }

    photo.decode().then(() => {
        resize();
        host.appendChild(canvas);
        new ResizeObserver(resize).observe(host);
        new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(host);
        reduced.addEventListener("change", sync);
        document.addEventListener("visibilitychange", sync);
        window.addEventListener("pagehide", () => cancelAnimationFrame(frame));
        window.addEventListener("pageshow", sync);
    }).catch(() => { /* The original photograph remains visible if decoding fails. */ });
}());
