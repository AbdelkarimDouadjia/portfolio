(function () {
    "use strict";

    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    var canvas = document.createElement("canvas");
    canvas.className = "hero-site-glitch-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(canvas);

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-*/<>[]{}";
    var particles = [];
    var width = 1;
    var height = 1;
    var ratio = 1;
    var frame = 0;
    var lastSpawn = 0;

    function resize() {
        ratio = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth || document.documentElement.clientWidth || 1;
        height = window.innerHeight || document.documentElement.clientHeight || 1;
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.font = "700 10px 'Courier New', monospace";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
    }

    function spawnCluster() {
        var scrollRatio = Math.min(1, Math.max(0, window.scrollY / Math.max(1, document.body.scrollHeight - height)));
        var baseY = 30 + Math.random() * (height - 60);
        var baseX = Math.random() * width;
        var count = width < 768 ? 10 : 18;

        for (var i = 0; i < count; i += 1) {
            particles.push({
                x: baseX + (Math.random() - 0.5) * 320,
                y: baseY + (Math.random() - 0.5) * 82 + Math.sin(scrollRatio * Math.PI * 2) * 14,
                vx: (Math.random() - 0.5) * 0.18,
                vy: -0.05 - Math.random() * 0.16,
                life: 42 + Math.random() * 54,
                age: 0,
                size: 8 + Math.random() * 4,
                alpha: 0.14 + Math.random() * 0.48,
                char: glyphs[(Math.random() * glyphs.length) | 0]
            });
        }
    }

    function render(time) {
        frame += 1;
        ctx.clearRect(0, 0, width, height);

        if (time - lastSpawn > 260 + Math.random() * 260) {
            lastSpawn = time;
            spawnCluster();
        }

        if (Math.random() < 0.08) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: 0,
                vy: 0,
                life: 18 + Math.random() * 24,
                age: 0,
                size: 7 + Math.random() * 5,
                alpha: 0.08 + Math.random() * 0.32,
                char: glyphs[(Math.random() * glyphs.length) | 0]
            });
        }

        for (var i = particles.length - 1; i >= 0; i -= 1) {
            var p = particles[i];
            p.age += 1;
            p.x += p.vx;
            p.y += p.vy;

            if (p.age > p.life) {
                particles.splice(i, 1);
                continue;
            }

            if (Math.random() < 0.12) {
                p.char = glyphs[(Math.random() * glyphs.length) | 0];
            }

            var fade = 1 - p.age / p.life;
            var pulse = 0.52 + Math.sin((frame + p.x) * 0.12) * 0.48;
            ctx.font = "700 " + p.size + "px 'Courier New', monospace";
            ctx.fillStyle = "rgba(255,255,255," + (p.alpha * fade * pulse).toFixed(3) + ")";
            ctx.fillText(p.char, p.x, p.y);

            if (Math.random() < 0.025) {
                ctx.fillStyle = "rgba(255,255,255," + (p.alpha * fade * 0.24).toFixed(3) + ")";
                ctx.fillRect(p.x - p.size * 0.8, p.y - 1, p.size * (1 + Math.random() * 3), 1);
            }
        }

        requestAnimationFrame(render);
    }

    window.addEventListener("resize", resize, { passive: true });
    resize();
    requestAnimationFrame(render);
}());
