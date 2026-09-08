(function () {
    "use strict";

    var section = document.querySelector(".spotlight-story");
    if (!section) return;

    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var observer = new IntersectionObserver(function (entries) {
        if (reducedMotion.matches) {
            document.body.classList.toggle("spotlight-story-active", entries[0].isIntersecting);
        }
    }, { rootMargin: "-64px 0px -55%", threshold: 0 });
    observer.observe(section);

    var revealCanvas = section.querySelector(".spotlight-story__reveal-canvas");
    if (revealCanvas && !reducedMotion.matches) {
        initCharacterReveal(revealCanvas);
    }

    function initCharacterReveal(canvas) {
        var context = canvas.getContext("2d");
        if (!context) return;

        var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var width = 1;
        var height = 1;
        var frameId = 0;

        function random(x, y) {
            var value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
            return value - Math.floor(value);
        }

        function resize() {
            width = Math.max(1, canvas.clientWidth);
            height = Math.max(1, canvas.clientHeight);
            var ratio = Math.min(window.devicePixelRatio || 1, 1.5);
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            context.font = "700 8px monospace";
            context.textAlign = "center";
            context.textBaseline = "middle";
        }

        function draw() {
            if (width !== canvas.clientWidth || height !== canvas.clientHeight) resize();

            var rect = section.getBoundingClientRect();
            var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            var travel = Math.max(1, section.offsetHeight - viewportHeight);
            var pinnedProgress = Math.min(1, Math.max(0, -rect.top / travel));
            var progress = Math.min(1, Math.max(0, (viewportHeight * .5 - rect.top) / (travel + viewportHeight * .5)));
            var visible = rect.bottom > 0 && rect.top < viewportHeight;
            var paperProgress = progress * progress * (3 - 2 * progress);
            var contentProgress = Math.min(1, Math.max(0, (progress - 0.18) / 0.32));
            contentProgress = contentProgress * contentProgress * (3 - 2 * contentProgress);

            section.style.setProperty("--spotlight-sticky-offset", (pinnedProgress * travel).toFixed(1) + "px");
            section.style.setProperty("--spotlight-paper-progress", paperProgress.toFixed(4));
            section.style.setProperty("--spotlight-content-progress", contentProgress.toFixed(4));
            document.body.classList.toggle(
                "spotlight-story-transitioning",
                rect.top <= 64 && rect.bottom > 64
            );
            document.body.classList.toggle(
                "spotlight-story-active",
                rect.top <= 64 && rect.bottom > 64 && progress > 0.72
            );
            section.style.setProperty("--spotlight-reveal-progress", progress.toFixed(4));

            context.clearRect(0, 0, width, height);

            if (visible && progress > 0.001 && progress < 0.998) {
                var size = width < 600 ? 14 : 17;
                var columns = Math.ceil(width / size);
                var rows = Math.ceil(height / size);

                for (var y = 0; y < rows; y += 1) {
                    for (var x = 0; x < columns; x += 1) {
                        var noise = random(x, y);
                        var threshold = 0.05 + noise * 0.74 + (1 - y / rows) * 0.16;
                        var cellProgress = Math.min(1, Math.max(0, (progress - threshold) / 0.09));
                        if (cellProgress > 0) {
                            context.fillStyle = "rgba(241,241,237," + (cellProgress * 0.92).toFixed(3) + ")";
                            context.fillRect(x * size, y * size, size + 1, size + 1);
                        }

                        var frontier = 1 - Math.min(1, Math.abs(progress - threshold) / 0.15);
                        if (frontier > 0.05 && noise > 0.32) {
                            var charIndex = Math.floor(random(x + 81, y + 27) * characters.length);
                            context.fillStyle = "rgba(255,255,255," + (frontier * (0.42 + noise * 0.48)).toFixed(3) + ")";
                            context.fillText(characters[charIndex], x * size + size / 2, y * size + size / 2);
                        }
                    }
                }
            }

            frameId = window.requestAnimationFrame(draw);
        }

        resize();
        frameId = window.requestAnimationFrame(draw);
        window.addEventListener("pagehide", function () {
            window.cancelAnimationFrame(frameId);
        }, { once: true });
    }

    var desktopMotion = window.matchMedia("(min-width: 1000px) and (pointer: fine)");
    section.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && event.target.matches(".spotlight-story__spot")) event.target.blur();
    });
    document.addEventListener("pointerdown", function (event) {
        var active = document.activeElement;
        if (active && active.matches(".spotlight-story__spot") && !active.contains(event.target)) active.blur();
    });
    section.querySelectorAll(".spotlight-story__spot").forEach(function (spot) {
        function fitPreview() {
            if (desktopMotion.matches && !reducedMotion.matches) return;
            var rect = spot.getBoundingClientRect();
            var center = rect.left + rect.width / 2;
            var margin = parseFloat(getComputedStyle(section).getPropertyValue("--preview-size")) / 2 + 16;
            var safeCenter = Math.max(margin, Math.min(window.innerWidth - margin, center));
            spot.style.setProperty("--card-shift", (safeCenter - center) + "px");
        }
        spot.addEventListener("focus", fitPreview);
        window.addEventListener("resize", fitPreview);
    });
    if (!desktopMotion.matches || reducedMotion.matches) return;

    import("../../node_modules/gsap/index.js").then(function (module) {
        var gsap = module.gsap || module.default;
        var TILT_MAX = 12;
        var DRIFT_MAX = 16;
        var SMOOTHING = 0.075;

        section.querySelectorAll(".spotlight-story__spot").forEach(function (spot) {
            var card = spot.querySelector(".spotlight-story__card");
            var image = card.querySelector("img");
            var current = { x: 0, y: 0, rotateX: 0, rotateY: 0 };
            var aim = { x: 0, y: 0, rotateX: 0, rotateY: 0 };
            var pointerInside = false;
            var focused = false;
            var ticking = false;

            gsap.set(card, { xPercent: -50, yPercent: -50, transformPerspective: 900 });

            function frame() {
                Object.keys(current).forEach(function (key) {
                    current[key] += (aim[key] - current[key]) * SMOOTHING;
                });
                gsap.set(card, {
                    x: current.x,
                    y: current.y,
                    rotateX: current.rotateX,
                    rotateY: current.rotateY
                });
                gsap.set(image, { x: -current.x * 0.72, y: -current.y * 0.72 });
            }

            function startTicker() {
                if (ticking) return;
                ticking = true;
                gsap.ticker.add(frame);
            }

            function stopTicker() {
                if (!ticking) return;
                ticking = false;
                gsap.ticker.remove(frame);
            }

            function openCard() {
                var width = parseFloat(getComputedStyle(section).getPropertyValue("--preview-size"));
                startTicker();
                gsap.to(card, {
                    width: width,
                    height: width,
                    "--frame-open": 1,
                    duration: 0.72,
                    ease: "power3.out",
                    overwrite: "auto"
                });
                gsap.to(image, {
                    autoAlpha: 1,
                    scale: 1,
                    duration: 0.5,
                    delay: 0.08,
                    ease: "power2.out",
                    overwrite: "auto"
                });
            }

            function closeCard() {
                aim.x = 0;
                aim.y = 0;
                aim.rotateX = 0;
                aim.rotateY = 0;
                gsap.to(image, {
                    autoAlpha: 0,
                    scale: 1.08,
                    duration: 0.24,
                    ease: "power2.in",
                    overwrite: "auto"
                });
                gsap.to(card, {
                    width: spot.offsetWidth,
                    height: spot.offsetHeight,
                    "--frame-open": 0,
                    borderRadius: 0,
                    duration: 0.48,
                    ease: "power3.inOut",
                    overwrite: "auto",
                    onComplete: function () {
                        current.x = current.y = current.rotateX = current.rotateY = 0;
                        frame();
                        stopTicker();
                        gsap.set(card, { clearProps: "width,height,borderRadius" });
                    }
                });
            }

            function closeIfIdle() {
                if (!pointerInside && !focused) closeCard();
            }

            spot.addEventListener("pointerenter", function () {
                pointerInside = true;
                openCard();
            });

            spot.addEventListener("pointermove", function (event) {
                var rect = card.getBoundingClientRect();
                var dx = event.clientX - (rect.left + rect.width / 2);
                var dy = event.clientY - (rect.top + rect.height / 2);
                var distance = Math.hypot(dx, dy) || 1;
                var drift = Math.min(DRIFT_MAX, distance * 0.2);
                aim.x = dx / distance * drift;
                aim.y = dy / distance * drift;
                aim.rotateY = Math.max(-1, Math.min(1, dx / (rect.width / 2))) * TILT_MAX;
                aim.rotateX = Math.max(-1, Math.min(1, -dy / (rect.height / 2))) * TILT_MAX;
            });

            spot.addEventListener("pointerleave", function () {
                pointerInside = false;
                closeIfIdle();
            });

            spot.addEventListener("focus", function () {
                focused = true;
                openCard();
            });

            spot.addEventListener("blur", function () {
                focused = false;
                closeIfIdle();
            });
        });
    }).catch(function () {
        document.documentElement.classList.add("spotlight-story-static");
    });
}());
