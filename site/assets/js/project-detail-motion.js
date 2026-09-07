(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var meter = document.querySelector(".project-scroll-meter span");

  function updateMeter() {
    if (!meter) return;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var progress = Math.min(1, Math.max(0, window.scrollY / max));
    meter.style.transform = "scaleY(" + progress + ")";
  }

  updateMeter();
  window.addEventListener("scroll", updateMeter, { passive: true });
  window.addEventListener("resize", updateMeter);

  if (reduceMotion) return;

  import("../../node_modules/gsap/index.js")
    .then(function (module) {
      var gsap = module.default || module.gsap;
      if (!gsap) return;

      var heroItems = Array.from(document.querySelectorAll(".project-detail-hero [data-motion-item], .project-home-header[data-motion-item]"));
      gsap.from(heroItems, {
        y: 34,
        duration: 0.9,
        stagger: 0.07,
        ease: "power3.out"
      });

      gsap.from("[data-motion-card]", {
        y: 44,
        duration: 1.05,
        ease: "power3.out",
        delay: 0.14
      });

      gsap.from(".project-media-frame img", {
        scale: 1.08,
        duration: 1.25,
        ease: "power3.out",
        delay: 0.18
      });

      revealOnEnter(gsap);
    })
    .catch(function () {
      document.documentElement.classList.add("project-motion-fallback");
    });

  function revealOnEnter(gsap) {
    var targets = Array.from(document.querySelectorAll(".project-brief-section [data-motion-item], .project-case-notes [data-motion-item], .project-next-nav[data-motion-item]"));
    if (!targets.length || !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        gsap.from(entry.target, {
          autoAlpha: 0,
          y: 36,
          duration: 0.82,
          ease: "power3.out"
        });
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });

    targets.forEach(function (target) {
      observer.observe(target);
    });
  }

})();
