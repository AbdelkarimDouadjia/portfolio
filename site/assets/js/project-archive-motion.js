const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduceMotion) {
    import("../../node_modules/gsap/index.js")
        .then(function (module) {
            const gsap = module.default || module.gsap;
            if (!gsap) return;

            gsap.from(".project-home-header, .repo-hero-topline, .repo-hero h1 span, .repo-hero-intro", {
                y: 24,
                duration: 0.9,
                stagger: 0.08,
                ease: "power3.out"
            });

            const seen = new WeakSet();
            const observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting || seen.has(entry.target)) return;
                    seen.add(entry.target);
                    observer.unobserve(entry.target);
                    gsap.from(entry.target.children, {
                        autoAlpha: 0,
                        y: 28,
                        duration: 0.75,
                        stagger: 0.06,
                        ease: "power3.out"
                    });
                });
            }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });

            function observeCards() {
                document.querySelectorAll(".repo-card").forEach(function (card) {
                    observer.observe(card);
                });
            }

            observeCards();
            window.addEventListener("portfolio:projects-rendered", observeCards);

            document.addEventListener("click", function (event) {
                const card = event.target.closest(".repo-card");
                if (!card || event.defaultPrevented || event.button !== 0) return;
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

                const image = card.querySelector("img");
                if (!image) return;
                event.preventDefault();

                const rect = image.getBoundingClientRect();
                const layer = document.createElement("div");
                const clone = image.cloneNode();
                layer.className = "project-transition-layer";
                clone.className = "project-transition-image";
                clone.style.left = rect.left + "px";
                clone.style.top = rect.top + "px";
                clone.style.width = rect.width + "px";
                clone.style.height = rect.height + "px";
                clone.style.objectPosition = getComputedStyle(image).objectPosition;
                document.body.append(layer, clone);
                document.body.classList.add("is-project-leaving");

                gsap.timeline({
                    defaults: { ease: "power3.inOut" },
                    onComplete: function () {
                        window.location.href = card.href;
                    }
                })
                    .to(layer, { opacity: 1, duration: 0.52 }, 0)
                    .to(clone, {
                        left: 0,
                        top: 0,
                        width: window.innerWidth,
                        height: window.innerHeight,
                        duration: 0.72
                    }, 0);
            });
        })
        .catch(function () {
            document.documentElement.classList.add("project-motion-fallback");
        });
}

window.addEventListener("pageshow", function () {
    document.body.classList.remove("is-project-leaving");
    document.querySelectorAll(".project-transition-layer, .project-transition-image").forEach(function (element) {
        element.remove();
    });
});
